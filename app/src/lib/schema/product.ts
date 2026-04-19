import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";

// ============================================
// Enums & Constants
// ============================================

export const ProductStatusSchema = z.enum([
    "draft",
    "pending_review",
    "active",
    "inactive",
    "rejected",
]);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const ProductPriceTypeSchema = z.enum(["fixed", "range", "negotiable", "contact"]);
export type ProductPriceType = z.infer<typeof ProductPriceTypeSchema>;

// ============================================
// Product Image
// ============================================

export const ProductImageSchema = z.object({
    id: zUuid,
    productId: zUuid,
    fileId: zUuid.nullable(),
    url: z.string().nullable(),
    altText: z.string().nullable(),
    isPrimary: z.boolean(),
    sortOrder: z.number().int(),
    createdAt: z.string(),
});
export type ProductImage = z.infer<typeof ProductImageSchema>;

// ============================================
// Product FAQ
// ============================================

export const ProductFaqSchema = z.object({
    id: zUuid,
    productId: zUuid,
    question: z.string(),
    answer: z.string(),
    sortOrder: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type ProductFaq = z.infer<typeof ProductFaqSchema>;

// ============================================
// Product List Item (카드용)
// ============================================

export const ProductVendorSummarySchema = z.object({
    id: zUuid,
    name: z.string(),
    ratingAvg: z.number().nullable().optional(),
    reviewCount: z.number().int().optional(),
    badges: z.array(z.object({ type: z.string(), label: z.string() })).optional(),
});
export type ProductVendorSummary = z.infer<typeof ProductVendorSummarySchema>;

export const ProductListItemSchema = z.object({
    id: zUuid,
    vendorId: zUuid,
    categoryId: zUuid,
    title: z.string(),
    summary: z.string().nullable(),
    priceType: ProductPriceTypeSchema,
    priceMin: z.number().int().nullable(),
    priceMax: z.number().int().nullable(),
    priceUnit: z.string().nullable(),
    ratingAvg: z.number().nullable(),
    reviewCount: z.number().int(),
    viewCount: z.number().int(),
    thumbnail: z.string().nullable(),
    vendor: ProductVendorSummarySchema,
    categorySlug: z.string().nullable(),
    categoryName: z.string().nullable().optional(),
});
export type ProductListItem = z.infer<typeof ProductListItemSchema>;

// ============================================
// Product Detail (상세 페이지)
// ============================================

export const ProductDetailSchema = ProductListItemSchema.extend({
    description: z.string().nullable(),
    status: ProductStatusSchema,
    inquiryCount: z.number().int(),
    sortOrder: z.number().int(),
    publishedAt: z.string().nullable(),
    firstPublishedAt: z.string().nullable(),
    resubmitReason: z.string().nullable(),
    /** 관리자 전용: 직전 active 시점 대비 변경된 필드 명세 */
    resubmitChangedFields: z
        .array(
            z.object({
                field: z.string(),
                before: z.unknown().nullable(),
                after: z.unknown().nullable(),
            }),
        )
        .optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    images: z.array(ProductImageSchema),
    faqs: z.array(ProductFaqSchema),
});
export type ProductDetail = z.infer<typeof ProductDetailSchema>;

// ============================================
// Query Schemas
// ============================================

export const ProductListQuerySchema = z
    .object({
        q: z.string().trim().min(1).optional(),
        categoryId: zUuid.optional(),
        vendorId: zUuid.optional(),
        priceMin: z.coerce.number().int().min(0).optional(),
        priceMax: z.coerce.number().int().min(0).optional(),
        ratingMin: z.coerce.number().min(0).max(5).optional(),
        sort: z.enum(["newest", "rating", "reviewCount", "popular", "priceAsc", "priceDesc"]).default("newest"),
    })
    .merge(zPaginationQuery)
    .refine(
        (v) => v.priceMin === undefined || v.priceMax === undefined || v.priceMin <= v.priceMax,
        { message: "priceMin은 priceMax보다 클 수 없습니다.", path: ["priceMin"] },
    );
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

// ============================================
// Create / Patch Body
// ============================================

export const ProductImageInputSchema = z
    .object({
        fileId: zUuid.optional().nullable(),
        url: z.string().trim().url().optional().nullable(),
        altText: z.string().trim().max(200).optional().nullable(),
        isPrimary: z.boolean().optional(),
        sortOrder: z.number().int().min(0).optional(),
    })
    .refine((v) => Boolean(v.fileId) || Boolean(v.url), { message: "fileId 또는 url이 필요합니다." });

export const ProductFaqInputSchema = z.object({
    question: zNonEmptyString.max(500),
    answer: zNonEmptyString.max(5000),
    sortOrder: z.number().int().min(0).optional(),
});

export const ProductCreateBodySchema = z
    .object({
        categoryId: zUuid,
        title: zNonEmptyString.max(200),
        summary: z.string().trim().max(500).optional().nullable(),
        description: z.string().trim().optional().nullable(),
        priceType: ProductPriceTypeSchema.default("contact"),
        priceMin: z.number().int().min(0).optional().nullable(),
        priceMax: z.number().int().min(0).optional().nullable(),
        priceUnit: z.string().trim().max(20).optional().nullable(),
        sortOrder: z.number().int().min(0).optional(),
        images: z.array(ProductImageInputSchema).max(20).optional(),
        faqs: z.array(ProductFaqInputSchema).max(30).optional(),
        status: z.enum(["draft", "pending_review"]).default("pending_review"),
    })
    .refine(
        (v) =>
            v.priceMin == null ||
            v.priceMax == null ||
            v.priceMin <= v.priceMax,
        { message: "priceMin은 priceMax보다 클 수 없습니다.", path: ["priceMin"] },
    );
export type ProductCreateBody = z.infer<typeof ProductCreateBodySchema>;

export const ProductPatchBodySchema = z
    .object({
        title: zNonEmptyString.max(200).optional(),
        summary: z.string().trim().max(500).optional().nullable(),
        description: z.string().trim().optional().nullable(),
        priceType: ProductPriceTypeSchema.optional(),
        priceMin: z.number().int().min(0).optional().nullable(),
        priceMax: z.number().int().min(0).optional().nullable(),
        priceUnit: z.string().trim().max(20).optional().nullable(),
        sortOrder: z.number().int().min(0).optional(),
        status: z.enum(["draft", "pending_review", "active", "inactive"]).optional(),
        images: z.array(ProductImageInputSchema).max(20).optional(),
        faqs: z.array(ProductFaqInputSchema).max(30).optional(),
        /** 이미 활성(active)된 상품을 재수정할 때 업체가 작성하는 변경 사유 */
        resubmitReason: z.string().trim().min(1).max(1000).optional(),
    })
    .refine(
        (v) =>
            v.priceMin == null ||
            v.priceMax == null ||
            v.priceMin <= v.priceMax,
        { message: "priceMin은 priceMax보다 클 수 없습니다.", path: ["priceMin"] },
    )
    .refine(
        (v) =>
            v.title !== undefined ||
            v.summary !== undefined ||
            v.description !== undefined ||
            v.priceType !== undefined ||
            v.priceMin !== undefined ||
            v.priceMax !== undefined ||
            v.priceUnit !== undefined ||
            v.sortOrder !== undefined ||
            v.status !== undefined ||
            v.images !== undefined ||
            v.faqs !== undefined,
        { message: "수정할 필드가 없습니다." },
    );
export type ProductPatchBody = z.infer<typeof ProductPatchBodySchema>;

// ============================================
// Response Schemas
// ============================================

export const ProductListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(ProductListItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;

export const ProductDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        product: ProductDetailSchema,
    }),
    message: z.string().optional(),
});
export type ProductDetailResponse = z.infer<typeof ProductDetailResponseSchema>;

export const ProductCreateResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        product: ProductDetailSchema,
    }),
    message: z.string().optional(),
});
export type ProductCreateResponse = z.infer<typeof ProductCreateResponseSchema>;
