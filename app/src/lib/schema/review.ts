import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";

const zDateString = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.");

const zSubRating = z.number().int().min(1).max(5);

export const ReviewStatusSchema = z.enum(["published", "hidden"]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const MAX_REVIEW_PHOTOS = 10;

export const ReviewViewSchema = z.object({
    id: zUuid,
    vendorId: zUuid,
    productId: zUuid.nullable().optional(),
    doctorUserId: zUuid,
    leadId: zUuid.nullable(),
    rating: z.number().int().min(1).max(5),
    qualityRating: zSubRating.nullable(),
    communicationRating: zSubRating.nullable(),
    speedRating: zSubRating.nullable(),
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
        productId: zUuid.optional(),
        leadId: zUuid,
        rating: z.number().int().min(1).max(5),
        qualityRating: zSubRating.optional(),
        communicationRating: zSubRating.optional(),
        speedRating: zSubRating.optional(),
        content: zNonEmptyString,
        amount: z.number().int().min(0).optional().nullable(),
        workedAt: zDateString.optional().nullable(),
        photoFileIds: z.array(zUuid).max(MAX_REVIEW_PHOTOS).optional(),
    })
    .strict();

export type ReviewCreateBody = z.infer<typeof ReviewCreateBodySchema>;

// 정렬 옵션
export const ReviewSortSchema = z.enum(["recent", "rating_high", "rating_low"]);
export type ReviewSort = z.infer<typeof ReviewSortSchema>;

export const ReviewListQuerySchema = z
    .object({
        sort: ReviewSortSchema.default("recent"),
        photoOnly: z.preprocess((value) => {
            if (value === "true") return true;
            if (value === "false") return false;
            return value;
        }, z.boolean().default(false)),
    })
    .merge(zPaginationQuery)
    .strict();
export type ReviewListQuery = z.infer<typeof ReviewListQuerySchema>;

// 신고 사유
export const ReviewReportReasonSchema = z.enum([
    "spam",
    "inappropriate",
    "false_info",
    "privacy",
    "other",
]);
export type ReviewReportReason = z.infer<typeof ReviewReportReasonSchema>;

// 신고 요청
export const ReviewReportBodySchema = z
    .object({
        reason: ReviewReportReasonSchema,
        detail: z.string().trim().min(1).max(500).optional(),
    })
    .strict()
    .refine((data) => data.reason !== "other" || !!data.detail, {
        message: "'기타' 사유는 상세 내용이 필요합니다.",
        path: ["detail"],
    });
export type ReviewReportBody = z.infer<typeof ReviewReportBodySchema>;

// Admin 블라인드/복구 요청
export const AdminReviewHideBodySchema = z
    .object({
        reason: zNonEmptyString.max(500),
    })
    .strict();
export type AdminReviewHideBody = z.infer<typeof AdminReviewHideBodySchema>;

export const AdminReviewUnhideBodySchema = z
    .object({
        reason: z.string().trim().max(500).optional(),
    })
    .strict();
export type AdminReviewUnhideBody = z.infer<typeof AdminReviewUnhideBodySchema>;

export const ReviewPatchBodySchema = z
    .object({
        rating: z.number().int().min(1).max(5).optional(),
        qualityRating: zSubRating.optional().nullable(),
        communicationRating: zSubRating.optional().nullable(),
        speedRating: zSubRating.optional().nullable(),
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
            value.qualityRating !== undefined ||
            value.communicationRating !== undefined ||
            value.speedRating !== undefined ||
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

// --- 리뷰 답변 ---

export const ReviewReplyViewSchema = z.object({
    id: zUuid,
    reviewId: zUuid,
    vendorUserId: zUuid,
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type ReviewReplyView = z.infer<typeof ReviewReplyViewSchema>;

export const ReviewReplyCreateBodySchema = z
    .object({
        content: zNonEmptyString.max(2000),
    })
    .strict();

export type ReviewReplyCreateBody = z.infer<typeof ReviewReplyCreateBodySchema>;

export const ReviewReplyPatchBodySchema = z
    .object({
        content: zNonEmptyString.max(2000),
    })
    .strict();

export type ReviewReplyPatchBody = z.infer<typeof ReviewReplyPatchBodySchema>;

// --- 벤더 리뷰 리스트 확장 ---

export const VendorReviewListItemSchema = ReviewViewSchema.extend({
    reply: ReviewReplyViewSchema.nullable(),
    photoUrls: z.array(z.string()).optional(),
});

export type VendorReviewListItem = z.infer<typeof VendorReviewListItemSchema>;

export const SubRatingSummarySchema = z.object({
    qualityRatingAvg: z.number().nullable(),
    communicationRatingAvg: z.number().nullable(),
    speedRatingAvg: z.number().nullable(),
});

export type SubRatingSummary = z.infer<typeof SubRatingSummarySchema>;

export const RatingDistributionItemSchema = z.object({
    rating: z.number().int().min(1).max(5),
    count: z.number().int().min(0),
});
export type RatingDistributionItem = z.infer<typeof RatingDistributionItemSchema>;

// --- 응답 스키마 ---

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
        reply: ReviewReplyViewSchema.nullable(),
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
        items: z.array(VendorReviewListItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
        photoReviewCount: z.number().int(),
        subRatingSummary: SubRatingSummarySchema,
        ratingDistribution: z.array(RatingDistributionItemSchema),
    }),
    message: z.string().optional(),
});

export type VendorReviewListResponse = z.infer<typeof VendorReviewListResponseSchema>;
