import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";

const zDateString = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.");

export const ReviewStatusSchema = z.enum(["published", "hidden"]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const ReviewViewSchema = z.object({
    id: zUuid,
    vendorId: zUuid,
    doctorUserId: zUuid,
    leadId: zUuid.nullable(),
    rating: z.number().int().min(1).max(5),
    content: z.string(),
    amount: z.number().int().nullable(),
    workedAt: zDateString.nullable(),
    status: ReviewStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type ReviewView = z.infer<typeof ReviewViewSchema>;

export const ReviewCreateBodySchema = z
    .object({
        vendorId: zUuid,
        leadId: zUuid,
        rating: z.number().int().min(1).max(5),
        content: zNonEmptyString,
        amount: z.number().int().min(0).optional().nullable(),
        workedAt: zDateString.optional().nullable(),
    })
    .strict();

export type ReviewCreateBody = z.infer<typeof ReviewCreateBodySchema>;

export const ReviewListQuerySchema = zPaginationQuery.strict();
export type ReviewListQuery = z.infer<typeof ReviewListQuerySchema>;

export const ReviewCreateResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        review: ReviewViewSchema,
    }),
    message: z.string().optional(),
});

export type ReviewCreateResponse = z.infer<typeof ReviewCreateResponseSchema>;

export const VendorReviewListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(ReviewViewSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type VendorReviewListResponse = z.infer<typeof VendorReviewListResponseSchema>;

