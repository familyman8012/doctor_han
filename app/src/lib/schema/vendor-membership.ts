import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zUuid } from "./common";

// ============================================
// Enums
// ============================================

export const MembershipStatusSchema = z.enum(["active", "expired", "canceled"]);
export type MembershipStatus = z.infer<typeof MembershipStatusSchema>;

// ============================================
// Entities
// ============================================

export const MembershipPlanSchema = z.object({
    id: zUuid,
    name: z.string(),
    durationDays: z.number().int().positive(),
    price: z.number().int().positive(),
    promoPrice: z.number().int().positive().nullable(),
    promoExpiresAt: z.string().nullable(),
    effectivePrice: z.number().int().positive(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type MembershipPlan = z.infer<typeof MembershipPlanSchema>;

export const VendorMembershipSchema = z.object({
    id: zUuid,
    vendorId: zUuid,
    planId: zUuid,
    status: MembershipStatusSchema,
    pricePaid: z.number().int(),
    startsAt: z.string(),
    expiresAt: z.string(),
    autoRenew: z.boolean(),
    creditTransactionId: zUuid.nullable(),
    paymentId: zUuid.nullable(),
    canceledAt: z.string().nullable(),
    plan: MembershipPlanSchema.optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type VendorMembership = z.infer<typeof VendorMembershipSchema>;

// ============================================
// Request Schemas
// ============================================

export const MembershipPurchaseBodySchema = z
    .object({
        planId: zUuid,
        autoRenew: z.boolean().optional().default(false),
    })
    .strict();
export type MembershipPurchaseBody = z.input<typeof MembershipPurchaseBodySchema>;

// ============================================
// Response Schemas
// ============================================

export const MembershipPlanListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({ items: z.array(MembershipPlanSchema) }),
    message: z.string().optional(),
});
export type MembershipPlanListResponse = z.infer<typeof MembershipPlanListResponseSchema>;

export const MembershipStatusResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        membership: VendorMembershipSchema.nullable(),
        isRequired: z.boolean(),
        inGracePeriod: z.boolean(),
    }),
    message: z.string().optional(),
});
export type MembershipStatusResponse = z.infer<typeof MembershipStatusResponseSchema>;

export const MembershipPurchaseResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        membership: VendorMembershipSchema,
        creditBalance: z.number().int(),
    }),
    message: z.string().optional(),
});
export type MembershipPurchaseResponse = z.infer<typeof MembershipPurchaseResponseSchema>;

export const AdminMembershipListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(
            VendorMembershipSchema.extend({
                vendorName: z.string().optional(),
            }),
        ),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});
export type AdminMembershipListResponse = z.infer<typeof AdminMembershipListResponseSchema>;

export const AdminMembershipListQuerySchema = z.object({
    status: MembershipStatusSchema.optional(),
    vendorId: zUuid.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminMembershipListQuery = z.infer<typeof AdminMembershipListQuerySchema>;

export const AdminMembershipUpdateBodySchema = z
    .object({
        status: z.enum(["canceled"]),
    })
    .strict();
export type AdminMembershipUpdateBody = z.infer<typeof AdminMembershipUpdateBodySchema>;
