import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";

// ===========================
// Enum Schemas
// ===========================

/** 티켓 상태 */
export const SupportTicketStatusSchema = z.enum([
	"open",
	"in_progress",
	"resolved",
	"closed",
]);
export type SupportTicketStatus = z.infer<typeof SupportTicketStatusSchema>;

/** SLA 상태 (계산 필드, 관리자용) */
export const SlaStatusSchema = z.enum(["normal", "warning", "violated"]);
export type SlaStatus = z.infer<typeof SlaStatusSchema>;

// ===========================
// View Schemas (Response DTO)
// ===========================

/** 사용자 요약 정보 */
export const SupportUserSummarySchema = z.object({
	id: zUuid,
	displayName: z.string(),
	email: z.string().nullable(),
	role: z.string(),
});
export type SupportUserSummary = z.infer<typeof SupportUserSummarySchema>;

/** 카테고리 요약 정보 */
export const SupportCategorySummarySchema = z.object({
	id: zUuid,
	name: z.string(),
	slug: z.string(),
});
export type SupportCategorySummary = z.infer<typeof SupportCategorySummarySchema>;

/** 티켓 뷰 (사용자용) */
export const SupportTicketViewSchema = z.object({
	id: zUuid,
	userId: zUuid,
	categoryId: zUuid,
	category: SupportCategorySummarySchema.nullable(),
	title: z.string(),
	content: z.string(),
	status: SupportTicketStatusSchema,
	firstResponseAt: z.string().nullable(),
	resolvedAt: z.string().nullable(),
	slaFirstResponseDue: z.string(),
	slaResolutionDue: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});
export type SupportTicketView = z.infer<typeof SupportTicketViewSchema>;

/** 티켓 목록 아이템 (사용자용) */
export const SupportTicketListItemSchema = z.object({
	id: zUuid,
	categoryId: zUuid,
	category: SupportCategorySummarySchema.nullable(),
	title: z.string(),
	status: SupportTicketStatusSchema,
	createdAt: z.string(),
	updatedAt: z.string(),
	unreadCount: z.number().int(),
	lastMessagePreview: z.string().nullable(),
});
export type SupportTicketListItem = z.infer<typeof SupportTicketListItemSchema>;

/** 티켓 뷰 (관리자용) */
export const AdminSupportTicketViewSchema = SupportTicketViewSchema.extend({
	user: SupportUserSummarySchema,
	slaStatus: SlaStatusSchema,
});
export type AdminSupportTicketView = z.infer<typeof AdminSupportTicketViewSchema>;

/** 티켓 목록 아이템 (관리자용) */
export const AdminSupportTicketListItemSchema = z.object({
	id: zUuid,
	categoryId: zUuid,
	category: SupportCategorySummarySchema.nullable(),
	title: z.string(),
	status: SupportTicketStatusSchema,
	user: SupportUserSummarySchema,
	slaStatus: SlaStatusSchema,
	createdAt: z.string(),
	updatedAt: z.string(),
});
export type AdminSupportTicketListItem = z.infer<typeof AdminSupportTicketListItemSchema>;

/** 메시지 뷰 */
export const SupportTicketMessageViewSchema = z.object({
	id: zUuid,
	ticketId: zUuid,
	senderId: zUuid,
	content: z.string(),
	isAdmin: z.boolean(),
	readAt: z.string().nullable(),
	createdAt: z.string(),
});
export type SupportTicketMessageView = z.infer<typeof SupportTicketMessageViewSchema>;

/** 상태 변경 이력 뷰 (관리자용) */
export const SupportTicketStatusHistoryViewSchema = z.object({
	id: zUuid,
	ticketId: zUuid,
	fromStatus: SupportTicketStatusSchema.nullable(),
	toStatus: SupportTicketStatusSchema,
	changedBy: zUuid,
	changedByUser: SupportUserSummarySchema.nullable(),
	note: z.string().nullable(),
	createdAt: z.string(),
});
export type SupportTicketStatusHistoryView = z.infer<typeof SupportTicketStatusHistoryViewSchema>;

// ===========================
// Request Schemas (Body/Query)
// ===========================

/** 티켓 생성 요청 */
export const SupportTicketCreateBodySchema = z
	.object({
		categoryId: zUuid,
		title: zNonEmptyString.max(100),
		content: zNonEmptyString.max(2000),
	})
	.strict();
export type SupportTicketCreateBody = z.infer<typeof SupportTicketCreateBodySchema>;

/** 티켓 목록 조회 쿼리 (사용자용) */
export const SupportTicketListQuerySchema = z
	.object({
		status: SupportTicketStatusSchema.optional(),
	})
	.merge(zPaginationQuery)
	.strict();
export type SupportTicketListQuery = z.infer<typeof SupportTicketListQuerySchema>;

/** 티켓 목록 조회 쿼리 (관리자용) */
export const AdminSupportTicketListQuerySchema = z
	.object({
		status: SupportTicketStatusSchema.optional(),
		categoryId: zUuid.optional(),
		slaStatus: SlaStatusSchema.optional(),
		q: z.string().trim().min(1).optional(),
	})
	.merge(zPaginationQuery)
	.strict();
export type AdminSupportTicketListQuery = z.infer<typeof AdminSupportTicketListQuerySchema>;

/** 메시지 생성 요청 */
export const SupportMessageCreateBodySchema = z
	.object({
		content: zNonEmptyString.max(2000),
	})
	.strict();
export type SupportMessageCreateBody = z.infer<typeof SupportMessageCreateBodySchema>;

/** 관리자 상태 변경 요청 */
export const AdminTicketStatusChangeBodySchema = z
	.object({
		status: z.enum(["in_progress", "resolved", "closed"]),
		note: z.string().max(500).optional(),
	})
	.strict();
export type AdminTicketStatusChangeBody = z.infer<typeof AdminTicketStatusChangeBodySchema>;

// ===========================
// Response Schemas
// ===========================

/** 티켓 목록 응답 (사용자용) */
export const SupportTicketListResponseSchema = z.object({
	code: z.literal(API_SUCCESS_CODE),
	data: z.object({
		items: z.array(SupportTicketListItemSchema),
		page: z.number().int(),
		pageSize: z.number().int(),
		total: z.number().int(),
	}),
	message: z.string().optional(),
});
export type SupportTicketListResponse = z.infer<typeof SupportTicketListResponseSchema>;

/** 티켓 상세 응답 (사용자용) */
export const SupportTicketDetailResponseSchema = z.object({
	code: z.literal(API_SUCCESS_CODE),
	data: z.object({
		ticket: SupportTicketViewSchema,
		messages: z.array(SupportTicketMessageViewSchema),
	}),
	message: z.string().optional(),
});
export type SupportTicketDetailResponse = z.infer<typeof SupportTicketDetailResponseSchema>;

/** 티켓 생성 응답 */
export const SupportTicketCreateResponseSchema = z.object({
	code: z.literal(API_SUCCESS_CODE),
	data: z.object({
		ticket: SupportTicketViewSchema,
	}),
	message: z.string().optional(),
});
export type SupportTicketCreateResponse = z.infer<typeof SupportTicketCreateResponseSchema>;

/** 메시지 생성 응답 */
export const SupportMessageCreateResponseSchema = z.object({
	code: z.literal(API_SUCCESS_CODE),
	data: z.object({
		message: SupportTicketMessageViewSchema,
	}),
	message: z.string().optional(),
});
export type SupportMessageCreateResponse = z.infer<typeof SupportMessageCreateResponseSchema>;

/** 메시지 읽음 표시 응답 */
export const SupportMessagesReadResponseSchema = z.object({
	code: z.literal(API_SUCCESS_CODE),
	data: z.object({
		count: z.number().int(),
	}),
	message: z.string().optional(),
});
export type SupportMessagesReadResponse = z.infer<typeof SupportMessagesReadResponseSchema>;

/** 티켓 목록 응답 (관리자용) */
export const AdminSupportTicketListResponseSchema = z.object({
	code: z.literal(API_SUCCESS_CODE),
	data: z.object({
		items: z.array(AdminSupportTicketListItemSchema),
		page: z.number().int(),
		pageSize: z.number().int(),
		total: z.number().int(),
	}),
	message: z.string().optional(),
});
export type AdminSupportTicketListResponse = z.infer<typeof AdminSupportTicketListResponseSchema>;

/** 티켓 상세 응답 (관리자용) */
export const AdminSupportTicketDetailResponseSchema = z.object({
	code: z.literal(API_SUCCESS_CODE),
	data: z.object({
		ticket: AdminSupportTicketViewSchema,
		messages: z.array(SupportTicketMessageViewSchema),
		statusHistory: z.array(SupportTicketStatusHistoryViewSchema),
	}),
	message: z.string().optional(),
});
export type AdminSupportTicketDetailResponse = z.infer<typeof AdminSupportTicketDetailResponseSchema>;
