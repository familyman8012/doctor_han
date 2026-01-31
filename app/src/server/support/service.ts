import "server-only";

import type { Database, Json } from "@/lib/database.types";
import type {
	AdminSupportTicketListItem,
	AdminSupportTicketListQuery,
	AdminSupportTicketView,
	AdminTicketStatusChangeBody,
	SupportMessageCreateBody,
	SupportTicketCreateBody,
	SupportTicketListItem,
	SupportTicketListQuery,
	SupportTicketMessageView,
	SupportTicketStatus,
	SupportTicketStatusHistoryView,
	SupportTicketView,
} from "@/lib/schema/support";
import { badRequest, forbidden, notFound, tooManyRequests } from "@/server/api/errors";
import { fetchNotificationSettings, insertNotificationDelivery } from "@/server/notification/repository";
import { resend, RESEND_FROM_EMAIL } from "@/server/notification/resend";
import { sendKakaoAlimtalk } from "@/server/notification/service";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
	mapMessageToView,
	mapStatusHistoryToView,
	mapTicketToAdminListItem,
	mapTicketToAdminView,
	mapTicketToListItem,
	mapTicketToView,
} from "./mapper";
import {
	checkTicketRateLimit,
	fetchAdminTickets,
	fetchAdminUserIds,
	fetchStatusHistory,
	fetchTicketById,
	fetchTicketMessages,
	fetchUserProfile,
	fetchUserTickets,
	getLastMessagePreview,
	getUnreadCount,
	insertMessage,
	insertStatusHistory,
	insertTicket,
	markMessagesAsRead as markMessagesAsReadRepo,
	updateTicketStatus,
} from "./repository";

// ===========================
// User Service
// ===========================

/**
 * Create a new support ticket
 */
export async function createTicket(
	supabase: SupabaseClient<Database>,
	userId: string,
	body: SupportTicketCreateBody,
): Promise<SupportTicketView> {
	// Check rate limit (5 tickets per day)
	const isRateLimited = await checkTicketRateLimit(supabase, userId);
	if (isRateLimited) {
		throw tooManyRequests("일일 티켓 생성 한도(5건)를 초과했습니다.", {
			retryAfter: 24 * 60 * 60, // 24 hours in seconds
		});
	}

	// Calculate SLA deadlines
	const now = new Date();
	const slaFirstResponseDue = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
	const slaResolutionDue = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours

	// Create ticket
	const ticketRow = await insertTicket(supabase, {
		user_id: userId,
		category_id: body.categoryId,
		title: body.title,
		content: body.content,
		status: "open",
		sla_first_response_due: slaFirstResponseDue.toISOString(),
		sla_resolution_due: slaResolutionDue.toISOString(),
	});

	// Record initial status history
	// status_history는 admin만 INSERT 가능 (RLS). service role로 기록한다.
	const adminSupabase = createSupabaseAdminClient();
	await insertStatusHistory(adminSupabase, {
		ticket_id: ticketRow.id,
		from_status: null,
		to_status: "open",
		changed_by: userId,
		note: null,
	});

	// Fetch ticket with relations
	const ticketWithRelations = await fetchTicketById(supabase, ticketRow.id);
	if (!ticketWithRelations) {
		throw notFound("티켓을 찾을 수 없습니다.");
	}

	// Send notification to admins (async, non-blocking)
	sendTicketCreatedNotification({
		ticketTitle: body.title,
		userId,
	}).catch((err) => {
		console.error("[Support] Failed to send ticket created notification", err);
	});

	return mapTicketToView(ticketWithRelations);
}

/**
 * Get user's ticket list
 */
export async function getMyTickets(
	supabase: SupabaseClient<Database>,
	userId: string,
	query: SupportTicketListQuery,
): Promise<{
	items: SupportTicketListItem[];
	page: number;
	pageSize: number;
	total: number;
}> {
	const { rows, total } = await fetchUserTickets(supabase, userId, {
		status: query.status,
		page: query.page,
		pageSize: query.pageSize,
	});

	// Get unread counts and last message previews for each ticket
	const items = await Promise.all(
		rows.map(async (row) => {
			const [unreadCount, lastMessagePreview] = await Promise.all([
				getUnreadCount(supabase, row.id, userId),
				getLastMessagePreview(supabase, row.id),
			]);
			return mapTicketToListItem(row, unreadCount, lastMessagePreview);
		}),
	);

	return {
		items,
		page: query.page,
		pageSize: query.pageSize,
		total,
	};
}

/**
 * Get ticket detail for user
 */
export async function getTicketDetail(
	supabase: SupabaseClient<Database>,
	userId: string,
	ticketId: string,
): Promise<{
	ticket: SupportTicketView;
	messages: SupportTicketMessageView[];
}> {
	const ticketRow = await fetchTicketById(supabase, ticketId);
	if (!ticketRow) {
		throw notFound("티켓을 찾을 수 없습니다.");
	}

	// Check ownership
	if (ticketRow.user_id !== userId) {
		throw forbidden("이 티켓에 접근할 권한이 없습니다.");
	}

	const messageRows = await fetchTicketMessages(supabase, ticketId);

	return {
		ticket: mapTicketToView(ticketRow),
		messages: messageRows.map(mapMessageToView),
	};
}

/**
 * Send a message from user
 */
export async function sendUserMessage(
	supabase: SupabaseClient<Database>,
	userId: string,
	ticketId: string,
	body: SupportMessageCreateBody,
): Promise<SupportTicketMessageView> {
	const ticketRow = await fetchTicketById(supabase, ticketId);
	if (!ticketRow) {
		throw notFound("티켓을 찾을 수 없습니다.");
	}

	// Check ownership
	if (ticketRow.user_id !== userId) {
		throw forbidden("이 티켓에 접근할 권한이 없습니다.");
	}

	// Check if ticket is closed
	if (ticketRow.status === "closed") {
		throw badRequest("종료된 티켓에는 메시지를 보낼 수 없습니다.");
	}

	// resolved 상태는 재오픈 후 메시지 작성 (PRD 엣지 케이스)
	if (ticketRow.status === "resolved") {
		throw badRequest("해결된 티켓에는 메시지를 보낼 수 없습니다. 티켓을 재오픈 후 다시 시도해주세요.");
	}

	// Insert message
	const messageRow = await insertMessage(supabase, {
		ticket_id: ticketId,
		sender_id: userId,
		content: body.content,
		is_admin: false,
	});

	// Send notification to admins (async, non-blocking)
	sendTicketResponseNotification({
		ticketTitle: ticketRow.title,
		recipientUserId: null, // will fetch admin user IDs
		isAdmin: false,
		messagePreview: body.content.slice(0, 100),
	}).catch((err) => {
		console.error("[Support] Failed to send message notification", err);
	});

	return mapMessageToView(messageRow);
}

/**
 * Mark messages as read for user
 */
export async function markMessagesAsRead(
	supabase: SupabaseClient<Database>,
	userId: string,
	ticketId: string,
): Promise<number> {
	const ticketRow = await fetchTicketById(supabase, ticketId);
	if (!ticketRow) {
		throw notFound("티켓을 찾을 수 없습니다.");
	}

	// Check ownership
	if (ticketRow.user_id !== userId) {
		throw forbidden("이 티켓에 접근할 권한이 없습니다.");
	}

	return markMessagesAsReadRepo(supabase, ticketId, userId);
}

/**
 * Reopen a resolved ticket
 */
export async function reopenTicket(
	supabase: SupabaseClient<Database>,
	userId: string,
	ticketId: string,
): Promise<SupportTicketView> {
	const ticketRow = await fetchTicketById(supabase, ticketId);
	if (!ticketRow) {
		throw notFound("티켓을 찾을 수 없습니다.");
	}

	// Check ownership
	if (ticketRow.user_id !== userId) {
		throw forbidden("이 티켓에 접근할 권한이 없습니다.");
	}

	// Check if ticket is resolved
	if (ticketRow.status !== "resolved") {
		throw badRequest("해결됨 상태의 티켓만 재오픈할 수 있습니다.");
	}

	// Update ticket status
	await updateTicketStatus(supabase, ticketId, {
		status: "open",
	});

	// Record status history (use admin client to bypass RLS for status_history table)
	const adminSupabase = createSupabaseAdminClient();
	await insertStatusHistory(adminSupabase, {
		ticket_id: ticketId,
		from_status: "resolved",
		to_status: "open",
		changed_by: userId,
		note: "사용자가 티켓을 재오픈했습니다.",
	});

	// Fetch updated ticket
	const updatedTicket = await fetchTicketById(supabase, ticketId);
	if (!updatedTicket) {
		throw notFound("티켓을 찾을 수 없습니다.");
	}

	return mapTicketToView(updatedTicket);
}

// ===========================
// Admin Service
// ===========================

/**
 * Get ticket list for admin
 */
export async function getAdminTickets(
	supabase: SupabaseClient<Database>,
	query: AdminSupportTicketListQuery,
): Promise<{
	items: AdminSupportTicketListItem[];
	page: number;
	pageSize: number;
	total: number;
}> {
	const { rows, total } = await fetchAdminTickets(supabase, {
		status: query.status,
		categoryId: query.categoryId,
		slaStatus: query.slaStatus,
		q: query.q,
		page: query.page,
		pageSize: query.pageSize,
	});

	return {
		items: rows.map(mapTicketToAdminListItem),
		page: query.page,
		pageSize: query.pageSize,
		total,
	};
}

/**
 * Get ticket detail for admin
 */
export async function getAdminTicketDetail(
	supabase: SupabaseClient<Database>,
	ticketId: string,
): Promise<{
	ticket: AdminSupportTicketView;
	messages: SupportTicketMessageView[];
	statusHistory: SupportTicketStatusHistoryView[];
}> {
	const ticketRow = await fetchTicketById(supabase, ticketId);
	if (!ticketRow) {
		throw notFound("티켓을 찾을 수 없습니다.");
	}

	const [messageRows, historyRows] = await Promise.all([
		fetchTicketMessages(supabase, ticketId),
		fetchStatusHistory(supabase, ticketId),
	]);

	return {
		ticket: mapTicketToAdminView(ticketRow),
		messages: messageRows.map(mapMessageToView),
		statusHistory: historyRows.map(mapStatusHistoryToView),
	};
}

/**
 * Change ticket status (admin)
 */
export async function changeTicketStatus(
	supabase: SupabaseClient<Database>,
	adminUserId: string,
	ticketId: string,
	body: AdminTicketStatusChangeBody,
): Promise<AdminSupportTicketView> {
	const ticketRow = await fetchTicketById(supabase, ticketId);
	if (!ticketRow) {
		throw notFound("티켓을 찾을 수 없습니다.");
	}

	// Validate status transition
	const currentStatus = ticketRow.status;
	const newStatus = body.status;

	// Invalid transitions
	if (currentStatus === "closed" && newStatus !== "closed") {
		throw badRequest("종료된 티켓의 상태는 변경할 수 없습니다.");
	}

	// Update ticket
	const now = new Date().toISOString();
	const updates: {
		status: SupportTicketStatus;
		resolvedAt?: string;
	} = {
		status: newStatus,
	};

	if (newStatus === "resolved" && !ticketRow.resolved_at) {
		updates.resolvedAt = now;
	}

	await updateTicketStatus(supabase, ticketId, updates);

	// Record status history
	await insertStatusHistory(supabase, {
		ticket_id: ticketId,
		from_status: currentStatus,
		to_status: newStatus,
		changed_by: adminUserId,
		note: body.note ?? null,
	});

	// Send notification to user if resolved
	if (newStatus === "resolved") {
		sendTicketResolvedNotification({
			ticketTitle: ticketRow.title,
			userId: ticketRow.user_id,
		}).catch((err) => {
			console.error("[Support] Failed to send resolved notification", err);
		});
	}

	// Fetch updated ticket
	const updatedTicket = await fetchTicketById(supabase, ticketId);
	if (!updatedTicket) {
		throw notFound("티켓을 찾을 수 없습니다.");
	}

	return mapTicketToAdminView(updatedTicket);
}

/**
 * Send a message from admin
 */
export async function sendAdminMessage(
	supabase: SupabaseClient<Database>,
	adminUserId: string,
	ticketId: string,
	body: SupportMessageCreateBody,
): Promise<SupportTicketMessageView> {
	const ticketRow = await fetchTicketById(supabase, ticketId);
	if (!ticketRow) {
		throw notFound("티켓을 찾을 수 없습니다.");
	}

	if (ticketRow.status === "closed") {
		throw badRequest("종료된 티켓에는 메시지를 보낼 수 없습니다.");
	}

	const now = new Date().toISOString();

	// Insert message
	const messageRow = await insertMessage(supabase, {
		ticket_id: ticketId,
		sender_id: adminUserId,
		content: body.content,
		is_admin: true,
	});

	// Update first_response_at if this is the first admin response
	if (!ticketRow.first_response_at) {
		await updateTicketStatus(supabase, ticketId, {
			status: ticketRow.status === "open" ? "in_progress" : ticketRow.status,
			firstResponseAt: now,
		});

		// Record status history if status changed
		if (ticketRow.status === "open") {
			await insertStatusHistory(supabase, {
				ticket_id: ticketId,
				from_status: "open",
				to_status: "in_progress",
				changed_by: adminUserId,
				note: "관리자가 최초 응답을 보냈습니다.",
			});
		}
	}

	// Send notification to user (async, non-blocking)
	sendTicketResponseNotification({
		ticketTitle: ticketRow.title,
		recipientUserId: ticketRow.user_id,
		isAdmin: true,
		messagePreview: body.content.slice(0, 100),
	}).catch((err) => {
		console.error("[Support] Failed to send message notification", err);
	});

	return mapMessageToView(messageRow);
}

// ===========================
// Notification Helpers
// ===========================

interface TicketCreatedNotificationParams {
	ticketTitle: string;
	userId: string;
}

async function sendTicketCreatedNotification(params: TicketCreatedNotificationParams): Promise<void> {
	const { ticketTitle, userId } = params;
	const adminSupabase = createSupabaseAdminClient();

	// Fetch admin user IDs
	const adminIds = await fetchAdminUserIds(adminSupabase);
	if (adminIds.length === 0) {
		console.log("[Support] No admins found for ticket created notification");
		return;
	}

	// Fetch user info for the ticket creator
	const userProfile = await fetchUserProfile(adminSupabase, userId);
	const userName = userProfile?.displayName ?? "사용자";

	// Send notification to first admin (simplified for now)
	const adminId = adminIds[0];
	const settings = await fetchNotificationSettings(adminSupabase, adminId);
	const emailEnabled = settings?.email_enabled ?? true;

	if (!emailEnabled) {
		console.log(`[Support] Email notification disabled for admin ${adminId}`);
		return;
	}

	const adminProfile = await fetchUserProfile(adminSupabase, adminId);
	if (!adminProfile?.email) {
		console.log(`[Support] Admin ${adminId} has no email`);
		return;
	}

	try {
		const subject = `[메디허브] 새 문의가 접수되었습니다 - ${ticketTitle}`;
		const body = `안녕하세요.

${userName}님이 새 문의를 등록했습니다.

문의 제목: ${ticketTitle}

메디허브 관리자 페이지에서 확인해주세요.

감사합니다.
메디허브 팀`;

		const result = await resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: adminProfile.email,
			subject,
			text: body,
		});

		await insertNotificationDelivery(adminSupabase, {
			userId: adminId,
			type: "support_ticket_created",
			channel: "email",
			provider: "resend",
			recipient: adminProfile.email,
			subject,
			bodyPreview: body.slice(0, 200),
			providerResponse: result as Json,
			sentAt: new Date().toISOString(),
			status: "sent",
		});

		console.log(`[Support] Ticket created notification sent to admin ${adminId}`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		await insertNotificationDelivery(adminSupabase, {
			userId: adminId,
			type: "support_ticket_created",
			channel: "email",
			provider: "resend",
			recipient: adminProfile.email,
			failedAt: new Date().toISOString(),
			errorMessage,
			status: "failed",
		});

		console.error(`[Support] Ticket created notification failed for admin ${adminId}`, error);
	}
}

interface TicketResponseNotificationParams {
	ticketTitle: string;
	recipientUserId: string | null;
	isAdmin: boolean;
	messagePreview: string;
}

async function sendTicketResponseNotification(params: TicketResponseNotificationParams): Promise<void> {
	const { ticketTitle, recipientUserId, isAdmin, messagePreview } = params;
	const adminSupabase = createSupabaseAdminClient();

	// Determine recipients
	let recipientIds: string[];
	if (isAdmin) {
		// Admin sent message, notify user
		if (!recipientUserId) {
			console.log("[Support] No recipient user ID for admin message notification");
			return;
		}
		recipientIds = [recipientUserId];
	} else {
		// User sent message, notify admins
		recipientIds = await fetchAdminUserIds(adminSupabase);
		if (recipientIds.length === 0) {
			console.log("[Support] No admins found for message notification");
			return;
		}
	}

	// Send notifications
	const sendTasks = recipientIds.map(async (recipientId) => {
		const settings = await fetchNotificationSettings(adminSupabase, recipientId);
		const emailEnabled = settings?.email_enabled ?? true;

		if (!emailEnabled) {
			console.log(`[Support] Email notification disabled for user ${recipientId}`);
			return;
		}

		const profile = await fetchUserProfile(adminSupabase, recipientId);
		if (!profile?.email) {
			console.log(`[Support] User ${recipientId} has no email`);
			return;
		}

		try {
			const subject = `[메디허브] 문의에 새 답변이 도착했습니다 - ${ticketTitle}`;
			const body = `안녕하세요, ${profile.displayName ?? "회원"}님.

문의하신 내용에 대해 새 메시지가 도착했습니다.

문의 제목: ${ticketTitle}

메시지 미리보기:
"${messagePreview}${messagePreview.length >= 100 ? "..." : ""}"

전체 내용을 확인하려면 메디허브에 접속해주세요.

감사합니다.
메디허브 팀`;

			const result = await resend.emails.send({
				from: RESEND_FROM_EMAIL,
				to: profile.email,
				subject,
				text: body,
			});

			await insertNotificationDelivery(adminSupabase, {
				userId: recipientId,
				type: "support_ticket_response",
				channel: "email",
				provider: "resend",
				recipient: profile.email,
				subject,
				bodyPreview: body.slice(0, 200),
				providerResponse: result as Json,
				sentAt: new Date().toISOString(),
				status: "sent",
			});

			// Also send Kakao if enabled
			const kakaoEnabled = settings?.kakao_enabled ?? false;
			if (kakaoEnabled && profile.phone) {
				await sendKakaoAlimtalk({
					phone: profile.phone,
					template: {
						templateId: "support_ticket_response",
						variables: {
							"#{ticketTitle}": ticketTitle,
							"#{messagePreview}": messagePreview.slice(0, 50),
						},
					},
				});
			}

			console.log(`[Support] Message notification sent to user ${recipientId}`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";

			await insertNotificationDelivery(adminSupabase, {
				userId: recipientId,
				type: "support_ticket_response",
				channel: "email",
				provider: "resend",
				recipient: profile.email,
				failedAt: new Date().toISOString(),
				errorMessage,
				status: "failed",
			});

			console.error(`[Support] Message notification failed for user ${recipientId}`, error);
		}
	});

	await Promise.allSettled(sendTasks);
}

interface TicketResolvedNotificationParams {
	ticketTitle: string;
	userId: string;
}

async function sendTicketResolvedNotification(params: TicketResolvedNotificationParams): Promise<void> {
	const { ticketTitle, userId } = params;
	const adminSupabase = createSupabaseAdminClient();

	const settings = await fetchNotificationSettings(adminSupabase, userId);
	const emailEnabled = settings?.email_enabled ?? true;

	if (!emailEnabled) {
		console.log(`[Support] Email notification disabled for user ${userId}`);
		return;
	}

	const profile = await fetchUserProfile(adminSupabase, userId);
	if (!profile?.email) {
		console.log(`[Support] User ${userId} has no email`);
		return;
	}

	try {
		const subject = `[메디허브] 문의가 해결되었습니다 - ${ticketTitle}`;
		const body = `안녕하세요, ${profile.displayName ?? "회원"}님.

문의하신 내용이 해결되었습니다.

문의 제목: ${ticketTitle}

추가 문의 사항이 있으시면 티켓을 재오픈하시거나 새 문의를 등록해주세요.

감사합니다.
메디허브 팀`;

		const result = await resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to: profile.email,
			subject,
			text: body,
		});

		await insertNotificationDelivery(adminSupabase, {
			userId,
			type: "support_ticket_resolved",
			channel: "email",
			provider: "resend",
			recipient: profile.email,
			subject,
			bodyPreview: body.slice(0, 200),
			providerResponse: result as Json,
			sentAt: new Date().toISOString(),
			status: "sent",
		});

		// Also send Kakao if enabled
		const kakaoEnabled = settings?.kakao_enabled ?? false;
		if (kakaoEnabled && profile.phone) {
			await sendKakaoAlimtalk({
				phone: profile.phone,
				template: {
					templateId: "support_ticket_resolved",
					variables: {
						"#{ticketTitle}": ticketTitle,
					},
				},
			});
		}

		console.log(`[Support] Resolved notification sent to user ${userId}`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		await insertNotificationDelivery(adminSupabase, {
			userId,
			type: "support_ticket_resolved",
			channel: "email",
			provider: "resend",
			recipient: profile.email,
			failedAt: new Date().toISOString(),
			errorMessage,
			status: "failed",
		});

		console.error(`[Support] Resolved notification failed for user ${userId}`, error);
	}
}
