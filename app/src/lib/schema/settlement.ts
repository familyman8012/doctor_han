import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zUuid } from "./common";

// ============================================
// Enums
// ============================================

export const SettlementStatusSchema = z.enum(["pending", "confirmed", "paid"]);
export type SettlementStatus = z.infer<typeof SettlementStatusSchema>;

export const SettlementItemTypeSchema = z.enum([
    "lead_charge",
    "subscription",
    "membership",
    "ad_purchase",
    "bid_commission",
]);
export type SettlementItemType = z.infer<typeof SettlementItemTypeSchema>;

// ============================================
// Entities
// ============================================

export const SettlementSchema = z.object({
    id: zUuid,
    vendorId: zUuid,
    vendorName: z.string().optional(),
    periodStart: z.string(),
    periodEnd: z.string(),
    status: SettlementStatusSchema,
    totalRevenue: z.number().int(),
    totalRefunds: z.number().int(),
    netRevenue: z.number().int(),
    leadChargeRevenue: z.number().int(),
    leadChargeRefunds: z.number().int(),
    subscriptionRevenue: z.number().int(),
    membershipRevenue: z.number().int(),
    adPurchaseRevenue: z.number().int(),
    bidCommissionRevenue: z.number().int(),
    totalItemCount: z.number().int(),
    confirmedBy: zUuid.nullable(),
    confirmedAt: z.string().nullable(),
    paidBy: zUuid.nullable(),
    paidAt: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type Settlement = z.infer<typeof SettlementSchema>;

export const SettlementItemSchema = z.object({
    id: zUuid,
    settlementId: zUuid,
    itemType: SettlementItemTypeSchema,
    sourceId: zUuid,
    amount: z.number().int(),
    refundAmount: z.number().int(),
    netAmount: z.number().int(),
    description: z.string().nullable(),
    sourceCreatedAt: z.string().nullable(),
    createdAt: z.string(),
});
export type SettlementItem = z.infer<typeof SettlementItemSchema>;

// ============================================
// Request Schemas
// ============================================

export const SettlementListQuerySchema = z.object({
    status: SettlementStatusSchema.optional(),
    vendorId: zUuid.optional(),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    format: z.enum(["json", "csv"]).optional().default("json"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type SettlementListQuery = z.infer<typeof SettlementListQuerySchema>;

export const SettlementItemListQuerySchema = z.object({
    itemType: SettlementItemTypeSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type SettlementItemListQuery = z.infer<typeof SettlementItemListQuerySchema>;

export const SettlementGenerateBodySchema = z
    .object({
        year: z.number().int().min(2020).max(2100),
        month: z.number().int().min(1).max(12),
    })
    .strict();
export type SettlementGenerateBody = z.infer<typeof SettlementGenerateBodySchema>;

export const SettlementActionBodySchema = z
    .object({
        notes: z.string().max(1000).optional(),
    })
    .strict();
export type SettlementActionBody = z.infer<typeof SettlementActionBodySchema>;

// ============================================
// Response Schemas
// ============================================

export const SettlementListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(SettlementSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});
export type SettlementListResponse = z.infer<typeof SettlementListResponseSchema>;

export const SettlementDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        settlement: SettlementSchema,
        items: z.array(SettlementItemSchema),
        itemPage: z.number().int(),
        itemPageSize: z.number().int(),
        itemTotal: z.number().int(),
    }),
    message: z.string().optional(),
});
export type SettlementDetailResponse = z.infer<typeof SettlementDetailResponseSchema>;

export const SettlementActionResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        settlement: SettlementSchema,
    }),
    message: z.string().optional(),
});
export type SettlementActionResponse = z.infer<typeof SettlementActionResponseSchema>;

export const SettlementGenerateResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        created: z.number().int(),
        skipped: z.number().int(),
        total: z.number().int(),
        settlements: z.array(SettlementSchema),
    }),
    message: z.string().optional(),
});
export type SettlementGenerateResponse = z.infer<typeof SettlementGenerateResponseSchema>;
