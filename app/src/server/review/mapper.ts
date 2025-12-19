import type { Tables } from "@/lib/database.types";
import type { ReviewView } from "@/lib/schema/review";

type ReviewRow = Tables<"reviews">;

export function mapReviewRow(row: ReviewRow): ReviewView {
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
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

