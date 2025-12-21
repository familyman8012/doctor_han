import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { CategoryViewSchema } from "./category";
import { zUuid } from "./common";
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

export const HomeCategoryGridSectionSchema = z.object({
    id: z.string(),
    type: z.literal("category_grid"),
    title: z.string().optional(),
    items: z.array(CategoryViewSchema),
});

export type HomeCategoryGridSection = z.infer<typeof HomeCategoryGridSectionSchema>;

export const HomeVendorCarouselSectionSchema = z.object({
    id: z.string(),
    type: z.literal("vendor_carousel"),
    title: z.string(),
    category: CategoryViewSchema.optional(),
    items: z.array(HomeVendorCardSchema),
});

export type HomeVendorCarouselSection = z.infer<typeof HomeVendorCarouselSectionSchema>;

export const HomeSectionSchema = z.discriminatedUnion("type", [
    HomeCategoryGridSectionSchema,
    HomeVendorCarouselSectionSchema,
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

