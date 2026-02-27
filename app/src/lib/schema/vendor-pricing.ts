import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { CategoryViewSchema } from "./category";
import { zUuid } from "./common";

// ============================================
// Enums
// ============================================

export const VendorServicePriceStatusSchema = z.enum(["active", "archived"]);

export type VendorServicePriceStatus = z.infer<typeof VendorServicePriceStatusSchema>;

// ============================================
// Entity
// ============================================

export const VendorServicePriceSchema = z.object({
    id: zUuid,
    vendorId: zUuid,
    categoryId: zUuid,
    price: z.number().int(),
    dailyBudgetLimit: z.number().int().nullable(),
    status: VendorServicePriceStatusSchema,
    category: CategoryViewSchema.optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type VendorServicePrice = z.infer<typeof VendorServicePriceSchema>;

// ============================================
// Request Schemas
// ============================================

export const VendorServicePriceCreateBodySchema = z
    .object({
        categoryId: zUuid,
        price: z.number().int().min(10000).max(200000),
        dailyBudgetLimit: z.number().int().min(0).optional(),
    })
    .strict();

export type VendorServicePriceCreateBody = z.infer<typeof VendorServicePriceCreateBodySchema>;

export const VendorServicePricePatchBodySchema = z
    .object({
        price: z.number().int().min(10000).max(200000).optional(),
        dailyBudgetLimit: z.number().int().min(0).nullable().optional(),
    })
    .strict()
    .refine((data) => data.price !== undefined || data.dailyBudgetLimit !== undefined, {
        message: "수정할 항목을 하나 이상 입력해주세요.",
    });

export type VendorServicePricePatchBody = z.infer<typeof VendorServicePricePatchBodySchema>;

// ============================================
// Response Schemas
// ============================================

export const VendorServicePriceListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(VendorServicePriceSchema),
    }),
    message: z.string().optional(),
});

export type VendorServicePriceListResponse = z.infer<typeof VendorServicePriceListResponseSchema>;

export const VendorServicePriceResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        price: VendorServicePriceSchema,
    }),
    message: z.string().optional(),
});

export type VendorServicePriceResponse = z.infer<typeof VendorServicePriceResponseSchema>;
