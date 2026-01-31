import "server-only";

import type { Database, Tables, TablesInsert } from "@/lib/database.types";
import type { SupportTicketStatus } from "@/lib/schema/support";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

// ===========================
// Types
// ===========================

export type SupportTicketRow = Tables<"support_tickets">;
export type SupportTicketMessageRow = Tables<"support_ticket_messages">;
export type SupportTicketStatusHistoryRow = Tables<"support_ticket_status_history">;

export type SupportTicketRowWithRelations = SupportTicketRow & {
	category: { id: string; name: string; slug: string } | null;
	user: { id: string; display_name: string | null; email: string | null; role: string } | null;
};

export type SupportTicketStatusHistoryRowWithRelations = SupportTicketStatusHistoryRow & {
	changed_by_user: { id: string; display_name: string | null } | null;
};

// ===========================
// Ticket Repository
// ===========================

/**
 * Check ticket creation rate limit (5 tickets per day per user)
 */
export async function checkTicketRateLimit(
	supabase: SupabaseClient<Database>,
	userId: string,
): Promise<boolean> {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayIso = today.toISOString();

	const { count, error } = await supabase
		.from("support_tickets")
		.select("*", { count: "exact", head: true })
		.eq("user_id", userId)
		.gte("created_at", todayIso);

	if (error) {
		throw internalServerError("티켓 생성 제한을 확인할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return (count ?? 0) >= 5;
}

/**
 * Insert a new support ticket
 */
export async function insertTicket(
	supabase: SupabaseClient<Database>,
	payload: TablesInsert<"support_tickets">,
): Promise<SupportTicketRow> {
	const { data, error } = await supabase
		.from("support_tickets")
		.insert(payload)
		.select("*")
		.single();

	if (error) {
		throw internalServerError("티켓을 생성할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return data;
}

/**
 * Fetch ticket by ID with relations
 */
export async function fetchTicketById(
	supabase: SupabaseClient<Database>,
	ticketId: string,
): Promise<SupportTicketRowWithRelations | null> {
	const { data, error } = await supabase
		.from("support_tickets")
		.select(`
			*,
			category:help_categories!support_tickets_category_id_fkey(id, name, slug),
			user:profiles!support_tickets_user_id_fkey(id, display_name, email, role)
		`)
		.eq("id", ticketId)
		.maybeSingle();

	if (error) {
		throw internalServerError("티켓을 조회할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return data as SupportTicketRowWithRelations | null;
}

/**
 * Fetch user's tickets with pagination
 */
export async function fetchUserTickets(
	supabase: SupabaseClient<Database>,
	userId: string,
	options: {
		status?: SupportTicketStatus;
		page: number;
		pageSize: number;
	},
): Promise<{ rows: SupportTicketRowWithRelations[]; total: number }> {
	const { status, page, pageSize } = options;
	const offset = (page - 1) * pageSize;

	let query = supabase
		.from("support_tickets")
		.select(`
			*,
			category:help_categories!support_tickets_category_id_fkey(id, name, slug),
			user:profiles!support_tickets_user_id_fkey(id, display_name, email, role)
		`, { count: "exact" })
		.eq("user_id", userId);

	if (status) {
		query = query.eq("status", status);
	}

	query = query.order("created_at", { ascending: false });

	const { data, error, count } = await query.range(offset, offset + pageSize - 1);

	if (error) {
		throw internalServerError("티켓 목록을 조회할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return {
		rows: (data ?? []) as SupportTicketRowWithRelations[],
		total: count ?? 0,
	};
}

/**
 * Fetch all tickets for admin with filters
 */
export async function fetchAdminTickets(
	supabase: SupabaseClient<Database>,
	options: {
		status?: SupportTicketStatus;
		categoryId?: string;
		slaStatus?: "normal" | "warning" | "violated";
		q?: string;
		page: number;
		pageSize: number;
	},
): Promise<{ rows: SupportTicketRowWithRelations[]; total: number }> {
	const { status, categoryId, slaStatus, q, page, pageSize } = options;
	const offset = (page - 1) * pageSize;

	let query = supabase
		.from("support_tickets")
		.select(`
			*,
			category:help_categories!support_tickets_category_id_fkey(id, name, slug),
			user:profiles!support_tickets_user_id_fkey(id, display_name, email, role)
		`, { count: "exact" });

	if (status) {
		query = query.eq("status", status);
	}

	if (categoryId) {
		query = query.eq("category_id", categoryId);
	}

	// SLA status filter
	if (slaStatus) {
		const now = new Date();
		const warningThreshold = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now

		if (slaStatus === "violated") {
			// SLA exceeded: first_response_due passed (for open) or resolution_due passed (for in_progress)
			query = query.or(
				`and(status.eq.open,sla_first_response_due.lt.${now.toISOString()}),and(status.eq.in_progress,sla_resolution_due.lt.${now.toISOString()})`
			);
		} else if (slaStatus === "warning") {
			// SLA warning: within 4 hours of deadline
			query = query.or(
				`and(status.eq.open,sla_first_response_due.gt.${now.toISOString()},sla_first_response_due.lt.${warningThreshold.toISOString()}),and(status.eq.in_progress,sla_resolution_due.gt.${now.toISOString()},sla_resolution_due.lt.${warningThreshold.toISOString()})`
			);
		} else {
			// normal: SLA not violated and not in warning
			query = query.or(
				`status.in.(resolved,closed),and(status.eq.open,sla_first_response_due.gte.${warningThreshold.toISOString()}),and(status.eq.in_progress,sla_resolution_due.gte.${warningThreshold.toISOString()})`
			);
		}
	}

	// Search by title or user name/email
	if (q) {
		// For search, we need to filter by title or user info
		// This is a simplified approach - title search only
		query = query.ilike("title", `%${q}%`);
	}

	query = query.order("created_at", { ascending: false });

	const { data, error, count } = await query.range(offset, offset + pageSize - 1);

	if (error) {
		throw internalServerError("티켓 목록을 조회할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return {
		rows: (data ?? []) as SupportTicketRowWithRelations[],
		total: count ?? 0,
	};
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
	supabase: SupabaseClient<Database>,
	ticketId: string,
	updates: {
		status: SupportTicketStatus;
		firstResponseAt?: string;
		resolvedAt?: string;
	},
): Promise<SupportTicketRow> {
	const updatePayload: Partial<TablesInsert<"support_tickets">> = {
		status: updates.status,
		updated_at: new Date().toISOString(),
	};

	if (updates.firstResponseAt) {
		updatePayload.first_response_at = updates.firstResponseAt;
	}

	if (updates.resolvedAt) {
		updatePayload.resolved_at = updates.resolvedAt;
	}

	const { data, error } = await supabase
		.from("support_tickets")
		.update(updatePayload)
		.eq("id", ticketId)
		.select("*")
		.single();

	if (error) {
		throw internalServerError("티켓 상태를 변경할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return data;
}

// ===========================
// Message Repository
// ===========================

/**
 * Fetch messages for a ticket
 */
export async function fetchTicketMessages(
	supabase: SupabaseClient<Database>,
	ticketId: string,
): Promise<SupportTicketMessageRow[]> {
	const { data, error } = await supabase
		.from("support_ticket_messages")
		.select("id, ticket_id, sender_id, content, is_admin, read_at, created_at")
		.eq("ticket_id", ticketId)
		.order("created_at", { ascending: true });

	if (error) {
		throw internalServerError("메시지를 조회할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return (data ?? []) as SupportTicketMessageRow[];
}

/**
 * Insert a new message
 */
export async function insertMessage(
	supabase: SupabaseClient<Database>,
	payload: TablesInsert<"support_ticket_messages">,
): Promise<SupportTicketMessageRow> {
	const { data, error } = await supabase
		.from("support_ticket_messages")
		.insert(payload)
		.select("id, ticket_id, sender_id, content, is_admin, read_at, created_at")
		.single();

	if (error) {
		throw internalServerError("메시지를 저장할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return data as SupportTicketMessageRow;
}

/**
 * Mark messages as read (messages not sent by userId)
 */
export async function markMessagesAsRead(
	supabase: SupabaseClient<Database>,
	ticketId: string,
	userId: string,
): Promise<number> {
	const now = new Date().toISOString();

	const { data, error } = await supabase
		.from("support_ticket_messages")
		.update({ read_at: now })
		.eq("ticket_id", ticketId)
		.neq("sender_id", userId)
		.is("read_at", null)
		.select("id");

	if (error) {
		throw internalServerError("메시지 읽음 표시를 할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return data?.length ?? 0;
}

/**
 * Get unread message count for a ticket
 */
export async function getUnreadCount(
	supabase: SupabaseClient<Database>,
	ticketId: string,
	userId: string,
): Promise<number> {
	const { count, error } = await supabase
		.from("support_ticket_messages")
		.select("*", { count: "exact", head: true })
		.eq("ticket_id", ticketId)
		.neq("sender_id", userId)
		.is("read_at", null);

	if (error) {
		throw internalServerError("안 읽은 메시지 개수를 조회할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return count ?? 0;
}

/**
 * Get last message preview
 */
export async function getLastMessagePreview(
	supabase: SupabaseClient<Database>,
	ticketId: string,
): Promise<string | null> {
	const { data, error } = await supabase
		.from("support_ticket_messages")
		.select("content")
		.eq("ticket_id", ticketId)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw internalServerError("최근 메시지를 조회할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	if (!data) {
		return null;
	}

	return data.content.length > 50 ? `${data.content.slice(0, 50)}...` : data.content;
}

// ===========================
// Status History Repository
// ===========================

/**
 * Insert status change history
 */
export async function insertStatusHistory(
	supabase: SupabaseClient<Database>,
	payload: TablesInsert<"support_ticket_status_history">,
): Promise<SupportTicketStatusHistoryRow> {
	const { data, error } = await supabase
		.from("support_ticket_status_history")
		.insert(payload)
		.select("*")
		.single();

	if (error) {
		throw internalServerError("상태 이력을 기록할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return data;
}

/**
 * Fetch status history for a ticket (admin only)
 */
export async function fetchStatusHistory(
	supabase: SupabaseClient<Database>,
	ticketId: string,
): Promise<SupportTicketStatusHistoryRowWithRelations[]> {
	const { data, error } = await supabase
		.from("support_ticket_status_history")
		.select(`
			*,
			changed_by_user:profiles!support_ticket_status_history_changed_by_fkey(id, display_name)
		`)
		.eq("ticket_id", ticketId)
		.order("created_at", { ascending: false });

	if (error) {
		throw internalServerError("상태 이력을 조회할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return (data ?? []) as SupportTicketStatusHistoryRowWithRelations[];
}

// ===========================
// Profile Repository (for notifications)
// ===========================

/**
 * Fetch user profile for notifications
 */
export async function fetchUserProfile(
	supabase: SupabaseClient<Database>,
	userId: string,
): Promise<{ email: string | null; phone: string | null; displayName: string | null } | null> {
	const { data, error } = await supabase
		.from("profiles")
		.select("email, phone, display_name")
		.eq("id", userId)
		.maybeSingle();

	if (error) {
		throw internalServerError("사용자 프로필을 조회할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	if (!data) {
		return null;
	}

	return {
		email: data.email,
		phone: data.phone,
		displayName: data.display_name,
	};
}

/**
 * Fetch admin user IDs for notifications
 */
export async function fetchAdminUserIds(
	supabase: SupabaseClient<Database>,
): Promise<string[]> {
	const { data, error } = await supabase
		.from("profiles")
		.select("id")
		.eq("role", "admin")
		.limit(10);

	if (error) {
		throw internalServerError("관리자 목록을 조회할 수 없습니다.", {
			message: error.message,
			code: error.code,
		});
	}

	return (data ?? []).map((profile) => profile.id);
}
