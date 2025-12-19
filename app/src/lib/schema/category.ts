import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zUuid } from "./common";

export const CategoryViewSchema = z.object({
    id: zUuid,
    parentId: zUuid.nullable(),
    depth: z.number().int(),
    name: z.string(),
    slug: z.string(),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type CategoryView = z.infer<typeof CategoryViewSchema>;

export const CategoryListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(CategoryViewSchema),
    }),
    message: z.string().optional(),
});

export type CategoryListResponse = z.infer<typeof CategoryListResponseSchema>;

