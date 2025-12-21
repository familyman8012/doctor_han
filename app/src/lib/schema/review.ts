import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";

const zDateString = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.");

export const ReviewStatusSchema = z.enum(["published", "hidden"]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const MAX_REVIEW_PHOTOS = 10;

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
    photoFileIds: z.array(zUuid).max(MAX_REVIEW_PHOTOS),
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
        photoFileIds: z.array(zUuid).max(MAX_REVIEW_PHOTOS).optional(),
    })
    .strict();

export type ReviewCreateBody = z.infer<typeof ReviewCreateBodySchema>;

export const ReviewListQuerySchema = zPaginationQuery.strict();
export type ReviewListQuery = z.infer<typeof ReviewListQuerySchema>;

export const ReviewPatchBodySchema = z
    .object({
        rating: z.number().int().min(1).max(5).optional(),
        content: zNonEmptyString.optional(),
        amount: z.number().int().min(0).optional().nullable(),
        workedAt: zDateString.optional().nullable(),
        status: ReviewStatusSchema.optional(),
        photoFileIds: z.array(zUuid).max(MAX_REVIEW_PHOTOS).optional(),
    })
    .strict()
    .refine(
        (value) =>
            value.rating !== undefined ||
            value.content !== undefined ||
            value.amount !== undefined ||
            value.workedAt !== undefined ||
            value.status !== undefined ||
            value.photoFileIds !== undefined,
        { message: "수정할 필드가 없습니다." },
    );

export type ReviewPatchBody = z.infer<typeof ReviewPatchBodySchema>;

export const ReviewVendorSummarySchema = z.object({
    id: zUuid,
    name: z.string(),
});

export type ReviewVendorSummary = z.infer<typeof ReviewVendorSummarySchema>;

export const MyReviewListQuerySchema = z
    .object({
        status: z.enum(["all", "published", "hidden"]).default("all"),
    })
    .merge(zPaginationQuery)
    .strict();

export type MyReviewListQuery = z.infer<typeof MyReviewListQuerySchema>;

export const MyReviewListItemSchema = ReviewViewSchema.extend({
    vendor: ReviewVendorSummarySchema.nullable(),
});

export type MyReviewListItem = z.infer<typeof MyReviewListItemSchema>;

export const ReviewCreateResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        review: ReviewViewSchema,
    }),
    message: z.string().optional(),
});

export type ReviewCreateResponse = z.infer<typeof ReviewCreateResponseSchema>;

export const ReviewDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        review: ReviewViewSchema,
        vendor: ReviewVendorSummarySchema.nullable(),
    }),
    message: z.string().optional(),
});

export type ReviewDetailResponse = z.infer<typeof ReviewDetailResponseSchema>;

export const MyReviewListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(MyReviewListItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type MyReviewListResponse = z.infer<typeof MyReviewListResponseSchema>;

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
