import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { VendorListItemSchema } from "./vendor";
import { zUuid } from "./common";

export const FavoriteToggleBodySchema = z
    .object({
        vendorId: zUuid,
    })
    .strict();

export type FavoriteToggleBody = z.infer<typeof FavoriteToggleBodySchema>;

export const FavoriteToggleResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        vendorId: zUuid,
        isFavorited: z.boolean(),
    }),
    message: z.string().optional(),
});

export type FavoriteToggleResponse = z.infer<typeof FavoriteToggleResponseSchema>;

export const FavoriteListItemSchema = z.object({
    createdAt: z.string(),
    vendor: VendorListItemSchema,
});

export type FavoriteListItem = z.infer<typeof FavoriteListItemSchema>;

export const FavoriteListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(FavoriteListItemSchema),
    }),
    message: z.string().optional(),
});

export type FavoriteListResponse = z.infer<typeof FavoriteListResponseSchema>;

