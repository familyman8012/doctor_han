import type {
    ReviewCreateBody,
    ReviewReplyCreateBody,
    ReviewReplyPatchBody,
    VendorReviewListResponse,
} from "@/lib/schema/review";
import api from "./client";

interface VendorReviewsQuery {
    page?: number;
    pageSize?: number;
    sort?: "recent" | "rating_high" | "rating_low";
    photoOnly?: boolean;
}

export const reviewsApi = {
    create: (body: ReviewCreateBody) =>
        api.post("/api/reviews", body).then((r) => r.data),

    listByVendor: (vendorId: string, query: VendorReviewsQuery = {}) =>
        api
            .get<VendorReviewListResponse>(`/api/vendors/${vendorId}/reviews`, {
                params: {
                    page: query.page,
                    pageSize: query.pageSize,
                    sort: query.sort,
                    photoOnly: query.photoOnly,
                },
            })
            .then((r) => r.data.data),

    createReply: (reviewId: string, body: ReviewReplyCreateBody) =>
        api.post(`/api/reviews/${reviewId}/reply`, body).then((r) => r.data),

    updateReply: (reviewId: string, body: ReviewReplyPatchBody) =>
        api.patch(`/api/reviews/${reviewId}/reply`, body).then((r) => r.data),

    deleteReply: (reviewId: string) =>
        api.delete(`/api/reviews/${reviewId}/reply`).then((r) => r.data),
};
