import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zPaginationQuery, zUuid } from "./common";

// ============================================
// Enums
// ============================================

export const RefundRequestReasonSchema = z.enum([
    "wrong_contact",
    "spam_lead",
    "competitor_lead",
    "no_response",
    "service_mismatch",
    "other",
]);
export type RefundRequestReason = z.infer<typeof RefundRequestReasonSchema>;

export const RefundRequestStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type RefundRequestStatus = z.infer<typeof RefundRequestStatusSchema>;

// ============================================
// DTO
// ============================================

export const RefundRequestSchema = z.object({
    id: zUuid,
    leadChargeId: zUuid,
    vendorId: zUuid,
    requesterUserId: zUuid,
    reason: RefundRequestReasonSchema,
    description: z.string().nullable(),
    status: RefundRequestStatusSchema,
    adminNote: z.string().nullable(),
    reviewedBy: zUuid.nullable(),
    reviewedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    // join 필드 (선택)
    leadId: zUuid.optional(),
    totalAmount: z.number().int().optional(),
});
export type RefundRequest = z.infer<typeof RefundRequestSchema>;

// ============================================
// Request / Query
// ============================================

export const CreateRefundRequestBodySchema = z
    .object({
        leadChargeId: zUuid,
        reason: RefundRequestReasonSchema,
        description: z.string().trim().max(2000).optional(),
    })
    .strict();
export type CreateRefundRequestBody = z.infer<typeof CreateRefundRequestBodySchema>;

export const ReviewRefundRequestBodySchema = z
    .object({
        action: z.enum(["approve", "reject"]),
        adminNote: z.string().trim().max(2000).optional(),
    })
    .strict();
export type ReviewRefundRequestBody = z.infer<typeof ReviewRefundRequestBodySchema>;

export const RefundRequestListQuerySchema = z
    .object({
        status: RefundRequestStatusSchema.optional(),
    })
    .merge(zPaginationQuery)
    .strict();
export type RefundRequestListQuery = z.infer<typeof RefundRequestListQuerySchema>;

// ============================================
// Response
// ============================================

export const RefundRequestListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(RefundRequestSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});
export type RefundRequestListResponse = z.infer<typeof RefundRequestListResponseSchema>;

export const RefundRequestResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: RefundRequestSchema,
    message: z.string().optional(),
});
export type RefundRequestResponse = z.infer<typeof RefundRequestResponseSchema>;
