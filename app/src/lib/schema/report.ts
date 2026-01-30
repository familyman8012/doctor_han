import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";

// ===========================
// Enum Schemas
// ===========================

/** 신고 대상 유형 */
export const ReportTargetTypeSchema = z.enum(["review", "vendor", "profile"]);
export type ReportTargetType = z.infer<typeof ReportTargetTypeSchema>;

/** 신고 사유 */
export const ReportReasonSchema = z.enum([
    "spam",
    "inappropriate",
    "false_info",
    "privacy",
    "other",
]);
export type ReportReason = z.infer<typeof ReportReasonSchema>;

/** 신고 상태 */
export const ReportStatusSchema = z.enum([
    "pending",
    "reviewing",
    "resolved",
    "dismissed",
]);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

/** 제재 유형 */
export const SanctionTypeSchema = z.enum([
    "warning",
    "suspension",
    "permanent_ban",
]);
export type SanctionType = z.infer<typeof SanctionTypeSchema>;

/** 제재 상태 */
export const SanctionStatusSchema = z.enum(["active", "expired", "revoked"]);
export type SanctionStatus = z.infer<typeof SanctionStatusSchema>;

// ===========================
// Request Schemas (Body/Query)
// ===========================

/** 신고 생성 요청 (일반 사용자) */
export const CreateReportBodySchema = z
    .object({
        targetType: ReportTargetTypeSchema,
        targetId: zUuid,
        reason: ReportReasonSchema,
        detail: z.string().trim().min(1).max(500).optional(),
    })
    .strict()
    .refine((data) => data.reason !== "other" || !!data.detail, {
        message: "'기타' 사유는 상세 내용이 필요합니다.",
        path: ["detail"],
    });
export type CreateReportBody = z.infer<typeof CreateReportBodySchema>;

/** 관리자 신고 목록 조회 쿼리 */
export const AdminReportListQuerySchema = z
    .object({
        targetType: ReportTargetTypeSchema.optional(),
        status: ReportStatusSchema.optional(),
        q: z.string().trim().min(1).optional(),
    })
    .merge(zPaginationQuery)
    .strict();
export type AdminReportListQuery = z.infer<typeof AdminReportListQuerySchema>;

/** 관리자 신고 처리 완료 요청 */
export const AdminReportResolveBodySchema = z
    .object({
        sanctionType: SanctionTypeSchema.optional(),
        durationDays: z.number().int().refine((v) => v === 7 || v === 30, {
            message: "정지 기간은 7일 또는 30일만 가능합니다.",
        }).optional(),
        reason: zNonEmptyString.max(500),
    })
    .strict()
    .refine(
        (data) => data.sanctionType !== "suspension" || data.durationDays !== undefined,
        {
            message: "일시정지 제재 시 정지 기간이 필요합니다.",
            path: ["durationDays"],
        },
    );
export type AdminReportResolveBody = z.infer<typeof AdminReportResolveBodySchema>;

/** 관리자 신고 기각 요청 */
export const AdminReportDismissBodySchema = z
    .object({
        reason: zNonEmptyString.max(500),
    })
    .strict();
export type AdminReportDismissBody = z.infer<typeof AdminReportDismissBodySchema>;

/** 관리자 제재 목록 조회 쿼리 */
export const AdminSanctionListQuerySchema = z
    .object({
        targetType: ReportTargetTypeSchema.optional(),
        targetId: zUuid.optional(),
        status: SanctionStatusSchema.optional(),
    })
    .merge(zPaginationQuery)
    .strict();
export type AdminSanctionListQuery = z.infer<typeof AdminSanctionListQuerySchema>;

/** 관리자 제재 해제 요청 */
export const AdminSanctionRevokeBodySchema = z
    .object({
        reason: zNonEmptyString.max(500),
    })
    .strict();
export type AdminSanctionRevokeBody = z.infer<typeof AdminSanctionRevokeBodySchema>;

// ===========================
// View Schemas (Response DTO)
// ===========================

/** 신고자 요약 정보 */
export const ReporterUserSummarySchema = z.object({
    id: zUuid,
    displayName: z.string(),
    email: z.string().nullable(),
});
export type ReporterUserSummary = z.infer<typeof ReporterUserSummarySchema>;

/** 관리자 요약 정보 */
export const AdminUserSummarySchema = z.object({
    id: zUuid,
    displayName: z.string(),
});
export type AdminUserSummary = z.infer<typeof AdminUserSummarySchema>;

/** 신고 목록 아이템 */
export const AdminReportListItemSchema = z.object({
    id: zUuid,
    targetType: ReportTargetTypeSchema,
    targetId: zUuid,
    targetSummary: z.string(),
    reporterUser: ReporterUserSummarySchema,
    reason: ReportReasonSchema,
    status: ReportStatusSchema,
    createdAt: z.string(),
});
export type AdminReportListItem = z.infer<typeof AdminReportListItemSchema>;

/** 신고 상세 뷰 */
export const AdminReportViewSchema = z.object({
    id: zUuid,
    targetType: ReportTargetTypeSchema,
    targetId: zUuid,
    targetSummary: z.string(),
    reporterUser: ReporterUserSummarySchema,
    reason: ReportReasonSchema,
    detail: z.string().nullable(),
    status: ReportStatusSchema,
    reviewedBy: AdminUserSummarySchema.nullable(),
    reviewedAt: z.string().nullable(),
    resolvedBy: AdminUserSummarySchema.nullable(),
    resolvedAt: z.string().nullable(),
    resolutionNote: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type AdminReportView = z.infer<typeof AdminReportViewSchema>;

/** 제재 뷰 */
export const SanctionViewSchema = z.object({
    id: zUuid,
    targetType: ReportTargetTypeSchema,
    targetId: zUuid,
    reportId: zUuid.nullable(),
    sanctionType: SanctionTypeSchema,
    status: SanctionStatusSchema,
    reason: z.string(),
    durationDays: z.number().int().nullable(),
    startsAt: z.string(),
    endsAt: z.string().nullable(),
    createdBy: AdminUserSummarySchema.nullable(),
    revokedBy: AdminUserSummarySchema.nullable(),
    revokedAt: z.string().nullable(),
    revokeReason: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type SanctionView = z.infer<typeof SanctionViewSchema>;

// ===========================
// Response Schemas
// ===========================

/** 신고 목록 응답 */
export const AdminReportListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(AdminReportListItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});
export type AdminReportListResponse = z.infer<typeof AdminReportListResponseSchema>;

/** 신고 상세 응답 */
export const AdminReportDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        report: AdminReportViewSchema,
        targetReportCount: z.number().int(),
        sanctions: z.array(SanctionViewSchema),
    }),
    message: z.string().optional(),
});
export type AdminReportDetailResponse = z.infer<typeof AdminReportDetailResponseSchema>;

/** 신고 액션 응답 (review/resolve/dismiss) */
export const AdminReportActionResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        report: AdminReportViewSchema,
        sanction: SanctionViewSchema.optional(),
    }),
    message: z.string().optional(),
});
export type AdminReportActionResponse = z.infer<typeof AdminReportActionResponseSchema>;

/** 제재 목록 응답 */
export const AdminSanctionListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(SanctionViewSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});
export type AdminSanctionListResponse = z.infer<typeof AdminSanctionListResponseSchema>;

/** 제재 액션 응답 (revoke) */
export const AdminSanctionActionResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        sanction: SanctionViewSchema,
    }),
    message: z.string().optional(),
});
export type AdminSanctionActionResponse = z.infer<typeof AdminSanctionActionResponseSchema>;
