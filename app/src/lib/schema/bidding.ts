import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";

// ============================================
// Enums
// ============================================

export const BidProjectStatusSchema = z.enum([
    "draft",
    "open",
    "bidding",
    "selecting",
    "contracted",
    "in_progress",
    "completed",
    "settled",
    "canceled",
]);

export type BidProjectStatus = z.infer<typeof BidProjectStatusSchema>;

export const BidResponseStatusSchema = z.enum([
    "invited",
    "submitted",
    "selected",
    "rejected",
    "withdrawn",
    "expired",
]);

export type BidResponseStatus = z.infer<typeof BidResponseStatusSchema>;

export const BidContractStatusSchema = z.enum([
    "pending",
    "active",
    "completed",
    "canceled",
    "disputed",
]);

export type BidContractStatus = z.infer<typeof BidContractStatusSchema>;

export const BidCommissionStatusSchema = z.enum([
    "pending",
    "charged",
    "refunded",
    "waived",
]);

export type BidCommissionStatus = z.infer<typeof BidCommissionStatusSchema>;

// ============================================
// Entities
// ============================================

export const BidProjectScoreSchema = z.object({
    id: zUuid,
    projectId: zUuid,
    vendorId: zUuid,
    regionScore: z.number(),
    ratingScore: z.number(),
    responseScore: z.number(),
    portfolioScore: z.number(),
    priceScore: z.number(),
    totalScore: z.number(),
    isRecommended: z.boolean(),
    createdAt: z.string(),
    vendorName: z.string().optional(),
});

export type BidProjectScore = z.infer<typeof BidProjectScoreSchema>;

export const BidResponseSchema = z.object({
    id: zUuid,
    projectId: zUuid,
    vendorId: zUuid,
    status: BidResponseStatusSchema,
    price: z.number().nullable(),
    proposal: z.string().nullable(),
    estimatedDays: z.number().nullable(),
    attachments: z.array(z.unknown()),
    submittedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    vendorName: z.string().optional(),
});

export type BidResponse = z.infer<typeof BidResponseSchema>;

export const BidContractSchema = z.object({
    id: zUuid,
    projectId: zUuid,
    vendorId: zUuid,
    responseId: zUuid,
    contractAmount: z.number().int(),
    commissionAmount: z.number().int(),
    commissionStatus: BidCommissionStatusSchema,
    commissionTransactionId: zUuid.nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    vendorName: z.string().optional(),
});

export type BidContract = z.infer<typeof BidContractSchema>;

export const BidProjectStatusHistorySchema = z.object({
    id: zUuid,
    projectId: zUuid,
    fromStatus: BidProjectStatusSchema.nullable(),
    toStatus: BidProjectStatusSchema,
    changedBy: zUuid.nullable(),
    createdAt: z.string(),
});

export type BidProjectStatusHistory = z.infer<typeof BidProjectStatusHistorySchema>;

export const BidProjectListItemSchema = z.object({
    id: zUuid,
    doctorUserId: zUuid,
    title: z.string(),
    location: z.string(),
    budgetMin: z.number().int(),
    budgetMax: z.number().int(),
    spaceSize: z.string().nullable(),
    schedule: z.string().nullable(),
    status: BidProjectStatusSchema,
    bidDeadline: z.string().nullable(),
    responseCount: z.number().int().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type BidProjectListItem = z.infer<typeof BidProjectListItemSchema>;

export const BidProjectDetailSchema = BidProjectListItemSchema.extend({
    requirements: z.string().nullable(),
    attachments: z.array(z.unknown()),
    scores: z.array(BidProjectScoreSchema),
    responses: z.array(BidResponseSchema),
    contract: BidContractSchema.nullable(),
    statusHistory: z.array(BidProjectStatusHistorySchema),
});

export type BidProjectDetail = z.infer<typeof BidProjectDetailSchema>;

// ============================================
// Request Bodies
// ============================================

export const BidProjectCreateBodySchema = z
    .object({
        title: zNonEmptyString,
        location: zNonEmptyString,
        budgetMin: z.number().int().min(0),
        budgetMax: z.number().int().min(0),
        spaceSize: z.string().trim().min(1).optional().nullable(),
        schedule: z.string().trim().min(1).optional().nullable(),
        requirements: z.string().trim().min(1).optional().nullable(),
        attachments: z.array(z.unknown()).max(10).optional(),
    })
    .strict()
    .refine((value) => value.budgetMin <= value.budgetMax, {
        message: "예산 최소는 예산 최대보다 클 수 없습니다.",
        path: ["budgetMax"],
    });

export type BidProjectCreateBody = z.infer<typeof BidProjectCreateBodySchema>;

export const BidResponseSubmitBodySchema = z
    .object({
        price: z.number().int().min(0),
        proposal: zNonEmptyString,
        estimatedDays: z.number().int().min(1).optional(),
        attachments: z.array(z.unknown()).max(10).optional(),
    })
    .strict();

export type BidResponseSubmitBody = z.infer<typeof BidResponseSubmitBodySchema>;

export const BidVendorSelectBodySchema = z
    .object({
        vendorId: zUuid,
    })
    .strict();

export type BidVendorSelectBody = z.infer<typeof BidVendorSelectBodySchema>;

export const BidAdminStatusPatchBodySchema = z
    .object({
        status: BidProjectStatusSchema,
    })
    .strict();

export type BidAdminStatusPatchBody = z.infer<typeof BidAdminStatusPatchBodySchema>;

// ============================================
// Query
// ============================================

export const BidProjectListQuerySchema = z
    .object({
        status: BidProjectStatusSchema.optional(),
    })
    .merge(zPaginationQuery)
    .strict();

export type BidProjectListQuery = z.infer<typeof BidProjectListQuerySchema>;

// ============================================
// Responses
// ============================================

export const BidProjectListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(BidProjectListItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type BidProjectListResponse = z.infer<typeof BidProjectListResponseSchema>;

export const BidProjectDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        project: BidProjectDetailSchema,
    }),
    message: z.string().optional(),
});

export type BidProjectDetailResponse = z.infer<typeof BidProjectDetailResponseSchema>;

export const BidResponseActionResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        response: BidResponseSchema,
    }),
    message: z.string().optional(),
});

export type BidResponseActionResponse = z.infer<typeof BidResponseActionResponseSchema>;

export const BidContractActionResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        contract: BidContractSchema,
    }),
    message: z.string().optional(),
});

export type BidContractActionResponse = z.infer<typeof BidContractActionResponseSchema>;
