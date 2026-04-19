import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zUuid } from "./common";

// ============================================
// Enums
// ============================================

export const PaymentStatusSchema = z.enum([
    "ready",
    "in_progress",
    "done",
    "canceled",
    "partial_canceled",
    "aborted",
    "expired",
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentMethodSchema = z.enum([
    "card",
    "virtual_account",
    "transfer",
    "mobile",
    "easy_pay",
    "etc",
]);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

/**
 * 결제 목적 (payments.metadata.purpose 에 저장)
 * - credit_charge: 크레딧 충전
 * - subscription: 구독 구매 (카테고리별)
 * - membership: S등급 멤버십 구매
 * - ad_priority: 광고 우선순위 슬롯 구매
 */
export const PaymentPurposeSchema = z.enum([
    "credit_charge",
    "subscription",
    "membership",
    "ad_priority",
]);
export type PaymentPurpose = z.infer<typeof PaymentPurposeSchema>;

/** 구독 결제 metadata */
export const SubscriptionPaymentMetadataSchema = z.object({
    purpose: z.literal("subscription"),
    planId: zUuid,
    categoryId: zUuid,
    autoRenew: z.boolean().default(false),
});

/** 멤버십 결제 metadata */
export const MembershipPaymentMetadataSchema = z.object({
    purpose: z.literal("membership"),
    planId: zUuid,
    autoRenew: z.boolean().default(false),
});

/** 광고 우선순위 결제 metadata */
export const AdPriorityPaymentMetadataSchema = z.object({
    purpose: z.literal("ad_priority"),
    prioritySlotId: zUuid,
});

// ============================================
// Entity
// ============================================

export const PaymentSchema = z.object({
    id: zUuid,
    orderId: z.string(),
    paymentKey: z.string().nullable(),
    vendorId: zUuid,
    userId: zUuid,
    amount: z.number().int().positive(),
    status: PaymentStatusSchema,
    method: PaymentMethodSchema.nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type Payment = z.infer<typeof PaymentSchema>;

// ============================================
// Request Schemas
// ============================================

export const PaymentConfirmBodySchema = z
    .object({
        paymentKey: z.string().min(1),
        orderId: z.string().min(1),
        amount: z.number().int().positive(),
    })
    .strict();

export type PaymentConfirmBody = z.infer<typeof PaymentConfirmBodySchema>;

// ============================================
// Response Schemas
// ============================================

export const PaymentDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        payment: PaymentSchema,
    }),
    message: z.string().optional(),
});

export type PaymentDetailResponse = z.infer<typeof PaymentDetailResponseSchema>;

export const PaymentConfirmResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        payment: PaymentSchema,
        creditBalance: z.number().int(),
    }),
    message: z.string().optional(),
});

export type PaymentConfirmResponse = z.infer<typeof PaymentConfirmResponseSchema>;
