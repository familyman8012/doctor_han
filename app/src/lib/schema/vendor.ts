import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { CategoryViewSchema } from "./category";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";

export const VendorStatusSchema = z.enum(["draft", "active", "inactive", "banned"]);
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

export const VendorListItemSchema = z.object({
    id: zUuid,
    name: z.string(),
    summary: z.string().nullable(),
    regionPrimary: z.string().nullable(),
    regionSecondary: z.string().nullable(),
    priceMin: z.number().int().nullable(),
    priceMax: z.number().int().nullable(),
    ratingAvg: z.number().nullable(),
    reviewCount: z.number().int(),
});

export type VendorListItem = z.infer<typeof VendorListItemSchema>;

export const VendorPortfolioAssetSchema = z.object({
    id: zUuid,
    portfolioId: zUuid,
    fileId: zUuid.nullable(),
    url: z.string().nullable(),
    sortOrder: z.number().int(),
    createdAt: z.string(),
});

export type VendorPortfolioAsset = z.infer<typeof VendorPortfolioAssetSchema>;

export const VendorPortfolioSchema = z.object({
    id: zUuid,
    vendorId: zUuid,
    title: z.string().nullable(),
    description: z.string().nullable(),
    sortOrder: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
    assets: z.array(VendorPortfolioAssetSchema),
});

export type VendorPortfolio = z.infer<typeof VendorPortfolioSchema>;

export const VendorDetailSchema = VendorListItemSchema.extend({
    ownerUserId: zUuid.optional(),
    description: z.string().nullable(),
    status: VendorStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
    categories: z.array(CategoryViewSchema),
    portfolios: z.array(VendorPortfolioSchema),
});

export type VendorDetail = z.infer<typeof VendorDetailSchema>;

export const VendorListQuerySchema = z
    .object({
        q: z.string().trim().min(1).optional(),
        categoryId: zUuid.optional(),
        priceMin: z.coerce.number().int().min(0).optional(),
        priceMax: z.coerce.number().int().min(0).optional(),
        sort: z.enum(["newest", "rating"]).default("newest"),
    })
    .merge(zPaginationQuery)
    .refine((value) => value.priceMin === undefined || value.priceMax === undefined || value.priceMin <= value.priceMax, {
        message: "priceMin은 priceMax보다 클 수 없습니다.",
        path: ["priceMin"],
    })
    .strict();

export type VendorListQuery = z.infer<typeof VendorListQuerySchema>;

export const VendorUpsertBodySchema = z
    .object({
        name: zNonEmptyString,
        summary: z.string().trim().min(1).optional().nullable(),
        description: z.string().trim().min(1).optional().nullable(),
        regionPrimary: z.string().trim().min(1).optional().nullable(),
        regionSecondary: z.string().trim().min(1).optional().nullable(),
        priceMin: z.number().int().min(0).optional().nullable(),
        priceMax: z.number().int().min(0).optional().nullable(),
        categoryIds: z.array(zUuid).max(50).optional(),
    })
    .refine(
        (value) =>
            value.priceMin === undefined ||
            value.priceMax === undefined ||
            value.priceMin === null ||
            value.priceMax === null ||
            value.priceMin <= value.priceMax,
        { message: "priceMin은 priceMax보다 클 수 없습니다.", path: ["priceMin"] },
    )
    .strict();

export type VendorUpsertBody = z.infer<typeof VendorUpsertBodySchema>;

export const VendorPatchBodySchema = z
    .object({
        name: zNonEmptyString.optional(),
        summary: z.string().trim().min(1).optional().nullable(),
        description: z.string().trim().min(1).optional().nullable(),
        regionPrimary: z.string().trim().min(1).optional().nullable(),
        regionSecondary: z.string().trim().min(1).optional().nullable(),
        priceMin: z.number().int().min(0).optional().nullable(),
        priceMax: z.number().int().min(0).optional().nullable(),
        status: z.enum(["draft", "active", "inactive"]).optional(),
        categoryIds: z.array(zUuid).max(50).optional(),
    })
    .refine(
        (value) =>
            value.priceMin === undefined ||
            value.priceMax === undefined ||
            value.priceMin === null ||
            value.priceMax === null ||
            value.priceMin <= value.priceMax,
        { message: "priceMin은 priceMax보다 클 수 없습니다.", path: ["priceMin"] },
    )
    .refine(
        (value) =>
            value.name !== undefined ||
            value.summary !== undefined ||
            value.description !== undefined ||
            value.regionPrimary !== undefined ||
            value.regionSecondary !== undefined ||
            value.priceMin !== undefined ||
            value.priceMax !== undefined ||
            value.status !== undefined ||
            value.categoryIds !== undefined,
        { message: "수정할 필드가 없습니다." },
    )
    .strict();

export type VendorPatchBody = z.infer<typeof VendorPatchBodySchema>;

export const VendorPortfolioCreateBodySchema = z
    .object({
        title: zNonEmptyString,
        description: z.string().trim().min(1).optional().nullable(),
        sortOrder: z.number().int().min(0).optional(),
        assets: z
            .array(
                z
                    .object({
                        fileId: zUuid.optional().nullable(),
                        url: z.string().trim().url().optional().nullable(),
                        sortOrder: z.number().int().min(0).optional(),
                    })
                    .refine((v) => Boolean(v.fileId) || Boolean(v.url), { message: "fileId 또는 url이 필요합니다." })
                    .strict(),
            )
            .max(30)
            .optional(),
    })
    .strict();

export type VendorPortfolioCreateBody = z.infer<typeof VendorPortfolioCreateBodySchema>;

export const VendorListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(VendorListItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type VendorListResponse = z.infer<typeof VendorListResponseSchema>;

export const VendorDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        vendor: VendorDetailSchema,
    }),
    message: z.string().optional(),
});

export type VendorDetailResponse = z.infer<typeof VendorDetailResponseSchema>;

export const VendorMeResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        vendor: VendorDetailSchema.nullable(),
    }),
    message: z.string().optional(),
});

export type VendorMeResponse = z.infer<typeof VendorMeResponseSchema>;
