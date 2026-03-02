import type { Tables } from "@/lib/database.types";
import type { RefundRequest } from "@/lib/schema/refund";

export type RefundRequestRow = Tables<"refund_requests">;

export type RefundRequestRowWithCharge = RefundRequestRow & {
    lead_charges: { lead_id: string; total_amount: number } | null;
};

export function mapRefundRequestRow(row: RefundRequestRowWithCharge): RefundRequest {
    return {
        id: row.id,
        leadChargeId: row.lead_charge_id,
        vendorId: row.vendor_id,
        requesterUserId: row.requester_user_id,
        reason: row.reason,
        description: row.description,
        status: row.status,
        adminNote: row.admin_note,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        leadId: row.lead_charges?.lead_id,
        totalAmount: row.lead_charges?.total_amount,
    };
}
