import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { CategoryViewSchema } from "./category";
import { zUuid } from "./common";
import { ProductListItemSchema } from "./product";
import { VendorListItemSchema } from "./vendor";

export const HomeVendorThumbnailSchema = z.object({
    fileId: zUuid.nullable(),
    url: z.string().nullable(),
});

export type HomeVendorThumbnail = z.infer<typeof HomeVendorThumbnailSchema>;

export const HomeVendorCardSchema = VendorListItemSchema.extend({
    categories: z.array(CategoryViewSchema),
    thumbnail: HomeVendorThumbnailSchema.nullable(),
});

export type HomeVendorCard = z.infer<typeof HomeVendorCardSchema>;

// 카테고리 + 업체 수 (메인 페이지 카테고리 그리드용)
export const HomeCategoryItemSchema = CategoryViewSchema.extend({
    vendorCount: z.number().int(),
});

export type HomeCategoryItem = z.infer<typeof HomeCategoryItemSchema>;

export const HomeCategoryGridSectionSchema = z.object({
    id: z.string(),
    type: z.literal("category_grid"),
    title: z.string().optional(),
    items: z.array(HomeCategoryItemSchema),
});

export type HomeCategoryGridSection = z.infer<typeof HomeCategoryGridSectionSchema>;

// 홈 통계 (신뢰 구간 섹션)
export const HomeStatsSchema = z.object({
    vendorCount: z.number().int(),
    reviewCount: z.number().int(),
    avgResponseHours: z.number(),
});

export type HomeStats = z.infer<typeof HomeStatsSchema>;

export const HomeVendorCarouselSectionSchema = z.object({
    id: z.string(),
    type: z.literal("vendor_carousel"),
    title: z.string(),
    category: CategoryViewSchema.optional(),
    items: z.array(HomeVendorCardSchema),
});

export type HomeVendorCarouselSection = z.infer<typeof HomeVendorCarouselSectionSchema>;

export const HomeProductCarouselSectionSchema = z.object({
    id: z.string(),
    type: z.literal("product_carousel"),
    title: z.string(),
    category: CategoryViewSchema.optional(),
    items: z.array(ProductListItemSchema),
});

export type HomeProductCarouselSection = z.infer<typeof HomeProductCarouselSectionSchema>;

export const HomeSectionSchema = z.discriminatedUnion("type", [
    HomeCategoryGridSectionSchema,
    HomeVendorCarouselSectionSchema,
    HomeProductCarouselSectionSchema,
]);

export type HomeSection = z.infer<typeof HomeSectionSchema>;

export const HomeScreenSchema = z.object({
    version: z.number().int(),
    generatedAt: z.string(),
    sections: z.array(HomeSectionSchema),
});

export type HomeScreen = z.infer<typeof HomeScreenSchema>;

export const HomeResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: HomeScreenSchema,
    message: z.string().optional(),
});

export type HomeResponse = z.infer<typeof HomeResponseSchema>;

