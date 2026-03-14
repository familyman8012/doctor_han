import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";

// ============================================
// Autocomplete
// ============================================

export const SearchAutocompleteQuerySchema = z
    .object({
        q: z.string().trim().min(1).max(100),
        limit: z.coerce.number().int().min(1).max(20).default(8),
    })
    .strict();

export type SearchAutocompleteQuery = z.infer<typeof SearchAutocompleteQuerySchema>;

export const SearchAutocompleteItemSchema = z.object({
    label: z.string(),
    type: z.enum(["vendor", "category"]),
    score: z.number(),
});

export type SearchAutocompleteItem = z.infer<typeof SearchAutocompleteItemSchema>;

export const SearchAutocompleteResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(SearchAutocompleteItemSchema),
    }),
    message: z.string().optional(),
});

export type SearchAutocompleteResponse = z.infer<typeof SearchAutocompleteResponseSchema>;

// ============================================
// Popular Search Terms
// ============================================

export const PopularSearchTermsQuerySchema = z
    .object({
        days: z.coerce.number().int().min(1).max(90).default(30),
        limit: z.coerce.number().int().min(1).max(50).default(10),
    })
    .strict();

export type PopularSearchTermsQuery = z.infer<typeof PopularSearchTermsQuerySchema>;

export const PopularSearchTermSchema = z.object({
    term: z.string(),
    count: z.number().int(),
});

export type PopularSearchTerm = z.infer<typeof PopularSearchTermSchema>;

export const PopularSearchTermsResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(PopularSearchTermSchema),
    }),
    message: z.string().optional(),
});

export type PopularSearchTermsResponse = z.infer<typeof PopularSearchTermsResponseSchema>;
