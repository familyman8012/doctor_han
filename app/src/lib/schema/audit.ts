import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zPaginationQuery, zUuid } from "./common";

// ===========================
// Request Schemas (Query)
// ===========================

/** 관리자 감사 로그 목록 조회 쿼리 */
export const AdminAuditLogListQuerySchema = z
    .object({
        action: z.string().trim().min(1).optional(),
        targetType: z.string().trim().min(1).optional(),
        actorId: zUuid.optional(),
        startDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다")
            .optional(),
        endDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다")
            .optional(),
    })
    .merge(zPaginationQuery)
    .strict();
export type AdminAuditLogListQuery = z.infer<typeof AdminAuditLogListQuerySchema>;

// ===========================
// View Schemas (Response DTO)
// ===========================

/** 행위자 정보 */
export const AuditLogActorSchema = z.object({
    id: zUuid,
    displayName: z.string().nullable(),
    email: z.string().nullable(),
});
export type AuditLogActor = z.infer<typeof AuditLogActorSchema>;

/** 감사 로그 뷰 */
export const AuditLogViewSchema = z.object({
    id: zUuid,
    action: z.string(),
    targetType: z.string(),
    targetId: z.string().nullable(),
    metadata: z.record(z.string(), z.unknown()),
    createdAt: z.string(),
    actor: AuditLogActorSchema,
});
export type AuditLogView = z.infer<typeof AuditLogViewSchema>;

// ===========================
// Response Schemas
// ===========================

/** 감사 로그 목록 응답 */
export const AdminAuditLogListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(AuditLogViewSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});
export type AdminAuditLogListResponse = z.infer<typeof AdminAuditLogListResponseSchema>;
