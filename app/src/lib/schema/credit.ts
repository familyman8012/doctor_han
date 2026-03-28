import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zPaginationQuery, zUuid } from "./common";

// ============================================
// Enums
// ============================================

export const CreditTransactionTypeSchema = z.enum([
    "charge",
    "charge_bonus",
    "deduct",
    "refund",
    "recovery",
    "expire",
    "admin_adjust",
]);

export type CreditTransactionType = z.infer<typeof CreditTransactionTypeSchema>;

export const CreditTransactionStatusSchema = z.enum([
    "pending",
    "completed",
    "failed",
    "canceled",
]);

export type CreditTransactionStatus = z.infer<typeof CreditTransactionStatusSchema>;

// ============================================
// Entities
// ============================================

export const CreditPackageSchema = z.object({
    id: zUuid,
    name: z.string(),
    amount: z.number().int().positive(),
    bonusRate: z.number(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type CreditPackage = z.infer<typeof CreditPackageSchema>;

export const CreditAccountSchema = z.object({
    id: zUuid,
    vendorId: zUuid,
    balance: z.number().int(),
    autoChargeEnabled: z.boolean(),
    autoChargeAmount: z.number().int().nullable(),
    autoChargeThreshold: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type CreditAccount = z.infer<typeof CreditAccountSchema>;

export const CreditTransactionSchema = z.object({
    id: zUuid,
    creditAccountId: zUuid,
    type: CreditTransactionTypeSchema,
    status: CreditTransactionStatusSchema,
    amount: z.number().int(),
    balanceAfter: z.number().int(),
    paymentId: zUuid.nullable(),
    description: z.string().nullable(),
    expiresAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type CreditTransaction = z.infer<typeof CreditTransactionSchema>;

// ============================================
// Request Schemas
// ============================================

export const CreditTransactionListQuerySchema = z
    .object({
        type: CreditTransactionTypeSchema.optional(),
    })
    .merge(zPaginationQuery)
    .strict();

export type CreditTransactionListQuery = z.infer<typeof CreditTransactionListQuerySchema>;

export const CreditChargeBodySchema = z
    .object({
        packageId: zUuid,
    })
    .strict();

export type CreditChargeBody = z.infer<typeof CreditChargeBodySchema>;

export const CreditAutoChargeBodySchema = z
    .object({
        enabled: z.boolean(),
        amount: z.number().int().min(50000).optional(),
    })
    .strict()
    .refine(
        (data) => !data.enabled || data.amount !== undefined,
        { message: "자동충전 활성화 시 금액은 필수입니다.", path: ["amount"] },
    );

export type CreditAutoChargeBody = z.infer<typeof CreditAutoChargeBodySchema>;

// ============================================
// Response Schemas
// ============================================

export const CreditBalanceResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        account: CreditAccountSchema,
        packages: z.array(CreditPackageSchema),
    }),
    message: z.string().optional(),
});

export type CreditBalanceResponse = z.infer<typeof CreditBalanceResponseSchema>;

export const CreditTransactionListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(CreditTransactionSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type CreditTransactionListResponse = z.infer<typeof CreditTransactionListResponseSchema>;

export const CreditChargeResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        orderId: z.string(),
        amount: z.number().int(),
        paymentId: zUuid,
        clientKey: z.string(),
        customerName: z.string(),
        orderName: z.string(),
    }),
    message: z.string().optional(),
});

export type CreditChargeResponse = z.infer<typeof CreditChargeResponseSchema>;

export const CreditAutoChargeResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        account: CreditAccountSchema,
    }),
    message: z.string().optional(),
});

export type CreditAutoChargeResponse = z.infer<typeof CreditAutoChargeResponseSchema>;

// ============================================
// Admin Credit Adjust
// ============================================

export const AdminCreditAdjustTypeSchema = z.enum([
    "beta_initial",
    "beta_bonus",
    "manual_grant",
    "manual_deduct",
    "penalty",
]);

export type AdminCreditAdjustType = z.infer<typeof AdminCreditAdjustTypeSchema>;

export const AdminCreditAdjustBodySchema = z
    .object({
        amount: z.number().int().refine((v) => v !== 0, "0원은 조정할 수 없습니다."),
        reason: z.string().min(1, "사유를 입력해주세요.").max(500),
        adjustType: AdminCreditAdjustTypeSchema,
    })
    .strict()
    .refine(
        (d) => {
            if (d.adjustType === "manual_deduct" || d.adjustType === "penalty") return d.amount < 0;
            return d.amount > 0;
        },
        { message: "지급은 양수, 차감/패널티는 음수여야 합니다.", path: ["amount"] },
    );

export type AdminCreditAdjustBody = z.infer<typeof AdminCreditAdjustBodySchema>;

export const AdminCreditAdjustResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        transaction: CreditTransactionSchema,
        newBalance: z.number().int(),
    }),
    message: z.string().optional(),
});

export type AdminCreditAdjustResponse = z.infer<typeof AdminCreditAdjustResponseSchema>;

export const AdminVendorCreditResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        account: CreditAccountSchema,
        transactions: z.object({
            items: z.array(CreditTransactionSchema),
            page: z.number().int(),
            pageSize: z.number().int(),
            total: z.number().int(),
        }),
    }),
    message: z.string().optional(),
});

export type AdminVendorCreditResponse = z.infer<typeof AdminVendorCreditResponseSchema>;
