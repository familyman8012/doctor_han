import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";

// ============================================
// Enums
// ============================================

export const HelpArticleTypeSchema = z.enum(["faq", "notice", "guide"]);
export type HelpArticleType = z.infer<typeof HelpArticleTypeSchema>;

// ============================================
// View Schemas
// ============================================

export const HelpCategoryViewSchema = z.object({
    id: zUuid,
    name: z.string(),
    slug: z.string(),
    displayOrder: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type HelpCategoryView = z.infer<typeof HelpCategoryViewSchema>;

export const HelpArticleViewSchema = z.object({
    id: zUuid,
    type: HelpArticleTypeSchema,
    categoryId: zUuid.nullable(),
    category: HelpCategoryViewSchema.nullable(),
    title: z.string(),
    content: z.string(),
    isPublished: z.boolean(),
    isPinned: z.boolean(),
    displayOrder: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type HelpArticleView = z.infer<typeof HelpArticleViewSchema>;

// ============================================
// Query Schemas
// ============================================

export const HelpArticleListQuerySchema = zPaginationQuery
    .extend({
        type: HelpArticleTypeSchema.optional(),
        categoryId: zUuid.optional(),
        q: z.string().trim().min(1).optional(),
    })
    .strict();

export type HelpArticleListQuery = z.infer<typeof HelpArticleListQuerySchema>;

export const AdminHelpArticleListQuerySchema = zPaginationQuery
    .extend({
        type: HelpArticleTypeSchema.optional(),
        categoryId: zUuid.optional(),
        isPublished: z.enum(["true", "false"]).optional(),
        q: z.string().trim().min(1).optional(),
    })
    .strict();

export type AdminHelpArticleListQuery = z.infer<typeof AdminHelpArticleListQuerySchema>;

// ============================================
// Body Schemas (Create)
// ============================================

export const HelpCategoryCreateBodySchema = z
    .object({
        name: zNonEmptyString,
        slug: zNonEmptyString,
        displayOrder: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
    })
    .strict();

export type HelpCategoryCreateBody = z.infer<typeof HelpCategoryCreateBodySchema>;

export const HelpArticleCreateBodySchema = z
    .object({
        type: HelpArticleTypeSchema,
        categoryId: zUuid.optional().nullable(),
        title: zNonEmptyString,
        content: zNonEmptyString,
        isPublished: z.boolean().optional(),
        isPinned: z.boolean().optional(),
        displayOrder: z.number().int().min(0).optional(),
    })
    .strict();

export type HelpArticleCreateBody = z.infer<typeof HelpArticleCreateBodySchema>;

// ============================================
// Body Schemas (Patch)
// ============================================

const atLeastOneField = (obj: Record<string, unknown>) =>
    Object.values(obj).some((v) => v !== undefined);

export const HelpCategoryPatchBodySchema = z
    .object({
        name: zNonEmptyString.optional(),
        slug: zNonEmptyString.optional(),
        displayOrder: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
    })
    .strict()
    .refine(atLeastOneField, { message: "수정할 필드가 없습니다." });

export type HelpCategoryPatchBody = z.infer<typeof HelpCategoryPatchBodySchema>;

export const HelpArticlePatchBodySchema = z
    .object({
        type: HelpArticleTypeSchema.optional(),
        categoryId: zUuid.optional().nullable(),
        title: zNonEmptyString.optional(),
        content: zNonEmptyString.optional(),
        isPublished: z.boolean().optional(),
        isPinned: z.boolean().optional(),
        displayOrder: z.number().int().min(0).optional(),
    })
    .strict()
    .refine(atLeastOneField, { message: "수정할 필드가 없습니다." });

export type HelpArticlePatchBody = z.infer<typeof HelpArticlePatchBodySchema>;

// ============================================
// Response Schemas
// ============================================

// Category Responses
export const HelpCategoryListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(HelpCategoryViewSchema),
    }),
    message: z.string().optional(),
});

export type HelpCategoryListResponse = z.infer<typeof HelpCategoryListResponseSchema>;

export const HelpCategoryDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        category: HelpCategoryViewSchema,
    }),
    message: z.string().optional(),
});

export type HelpCategoryDetailResponse = z.infer<typeof HelpCategoryDetailResponseSchema>;

export const HelpCategoryDeleteResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        id: zUuid,
    }),
    message: z.string().optional(),
});

export type HelpCategoryDeleteResponse = z.infer<typeof HelpCategoryDeleteResponseSchema>;

// Article Responses
export const HelpArticleListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(HelpArticleViewSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type HelpArticleListResponse = z.infer<typeof HelpArticleListResponseSchema>;

export const HelpArticleDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        article: HelpArticleViewSchema,
    }),
    message: z.string().optional(),
});

export type HelpArticleDetailResponse = z.infer<typeof HelpArticleDetailResponseSchema>;

export const HelpArticleDeleteResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        id: zUuid,
    }),
    message: z.string().optional(),
});

export type HelpArticleDeleteResponse = z.infer<typeof HelpArticleDeleteResponseSchema>;
