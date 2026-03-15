import type { Tables } from "@/lib/database.types";
import type { ReviewReplyView, ReviewView } from "@/lib/schema/review";

type ReviewRow = Tables<"reviews">;
type ReviewRowWithPhotos = ReviewRow & { photo_file_ids?: string[] | null };
type ReviewReplyRow = Tables<"review_replies">;

export function mapReviewRow(row: ReviewRow): ReviewView {
    const rowWithPhotos = row as ReviewRowWithPhotos;
    const photoFileIds = Array.isArray(rowWithPhotos.photo_file_ids) ? rowWithPhotos.photo_file_ids : [];

    return {
        id: row.id,
        vendorId: row.vendor_id,
        productId: (row as Record<string, unknown>).product_id as string | null ?? null,
        doctorUserId: row.doctor_user_id,
        leadId: row.lead_id,
        rating: row.rating,
        qualityRating: row.quality_rating ?? null,
        communicationRating: row.communication_rating ?? null,
        speedRating: row.speed_rating ?? null,
        content: row.content,
        amount: row.amount,
        workedAt: row.worked_at,
        status: row.status,
        photoFileIds,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapReviewReplyRow(row: ReviewReplyRow): ReviewReplyView {
    return {
        id: row.id,
        reviewId: row.review_id,
        vendorUserId: row.vendor_user_id,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
