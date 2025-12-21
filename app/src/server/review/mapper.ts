import type { Tables } from "@/lib/database.types";
import type { ReviewView } from "@/lib/schema/review";

type ReviewRow = Tables<"reviews">;
type ReviewRowWithPhotos = ReviewRow & { photo_file_ids?: string[] | null };

export function mapReviewRow(row: ReviewRow): ReviewView {
    const rowWithPhotos = row as ReviewRowWithPhotos;
    const photoFileIds = Array.isArray(rowWithPhotos.photo_file_ids) ? rowWithPhotos.photo_file_ids : [];

    return {
        id: row.id,
        vendorId: row.vendor_id,
        doctorUserId: row.doctor_user_id,
        leadId: row.lead_id,
        rating: row.rating,
        content: row.content,
        amount: row.amount,
        workedAt: row.worked_at,
        status: row.status,
        photoFileIds,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
