import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { CategoryViewSchema } from "./category";
import { zUuid } from "./common";

// ============================================
// Enums
// ============================================

export const SubscriptionStatusSchema = z.enum(["active", "expired", "canceled"]);

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

// ============================================
// Entities
// ============================================

export const SubscriptionPlanSchema = z.object({
    id: zUuid,
    name: z.string(),
    durationDays: z.number().int().positive(),
    price: z.number().int().positive(),
    dailyRate: z.number().int(),
    discountRate: z.number(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export const VendorSubscriptionSchema = z.object({
    id: zUuid,
    vendorId: zUuid,
    categoryId: zUuid,
    planId: zUuid,
    status: SubscriptionStatusSchema,
    pricePaid: z.number().int(),
    startsAt: z.string(),
    expiresAt: z.string(),
    autoRenew: z.boolean(),
    leadCount: z.number().int(),
    creditTransactionId: zUuid.nullable(),
    canceledAt: z.string().nullable(),
    plan: SubscriptionPlanSchema.optional(),
    category: CategoryViewSchema.optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type VendorSubscription = z.infer<typeof VendorSubscriptionSchema>;

// ============================================
// Request Schemas
// ============================================

export const SubscriptionPurchaseBodySchema = z
    .object({
        categoryId: zUuid,
        planId: zUuid,
        autoRenew: z.boolean().optional().default(false),
    })
    .strict();

export type SubscriptionPurchaseBody = z.infer<typeof SubscriptionPurchaseBodySchema>;

/** 토스 즉시결제 준비 응답 */
export const SubscriptionPrepareResponseSchema = z.object({
    orderId: z.string(),
    amount: z.number().int().positive(),
    paymentId: zUuid,
    clientKey: z.string(),
    customerName: z.string(),
    orderName: z.string(),
});
export type SubscriptionPrepareResponse = z.infer<typeof SubscriptionPrepareResponseSchema>;

export const SubscriptionAutoRenewBodySchema = z
    .object({
        autoRenew: z.boolean(),
    })
    .strict();

export type SubscriptionAutoRenewBody = z.infer<typeof SubscriptionAutoRenewBodySchema>;

// ============================================
// Response Schemas
// ============================================

export const SubscriptionPlanListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(SubscriptionPlanSchema),
    }),
    message: z.string().optional(),
});

export type SubscriptionPlanListResponse = z.infer<typeof SubscriptionPlanListResponseSchema>;

export const SubscriptionListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(VendorSubscriptionSchema),
    }),
    message: z.string().optional(),
});

export type SubscriptionListResponse = z.infer<typeof SubscriptionListResponseSchema>;

export const SubscriptionDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        subscription: VendorSubscriptionSchema,
    }),
    message: z.string().optional(),
});

export type SubscriptionDetailResponse = z.infer<typeof SubscriptionDetailResponseSchema>;

export const SubscriptionPurchaseResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        subscription: VendorSubscriptionSchema,
        creditBalance: z.number().int(),
    }),
    message: z.string().optional(),
});

export type SubscriptionPurchaseResponse = z.infer<typeof SubscriptionPurchaseResponseSchema>;
