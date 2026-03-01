import type { Tables } from "@/lib/database.types";
import type {
    LeadAttachment,
    LeadCharge,
    LeadDetail,
    LeadListItem,
    LeadReport,
    LeadStatusHistory,
    LeadVendorSummary,
    PriceBreakdownItem,
} from "@/lib/schema/lead";

type LeadRow = Tables<"leads">;
type LeadStatusHistoryRow = Tables<"lead_status_history">;
type LeadAttachmentRow = Tables<"lead_attachments">;
export type LeadChargeRow = Tables<"lead_charges">;
export type LeadReportRow = Tables<"lead_reports">;

export function mapLeadVendorSummary(input: { id: string; name: string } | null | undefined): LeadVendorSummary | null {
    if (!input) return null;
    return { id: input.id, name: input.name };
}

export function mapLeadRow(row: LeadRow, vendor?: LeadVendorSummary | null): LeadListItem {
    return {
        id: row.id,
        doctorUserId: row.doctor_user_id,
        vendorId: row.vendor_id,
        categoryIds: (row.category_ids ?? []) as string[],
        serviceName: row.service_name,
        contactName: row.contact_name,
        contactPhone: row.contact_phone,
        contactEmail: row.contact_email,
        preferredChannel: row.preferred_channel,
        preferredTime: row.preferred_time,
        content: row.content,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        vendor: vendor ?? null,
    };
}

export function mapLeadStatusHistoryRow(row: LeadStatusHistoryRow): LeadStatusHistory {
    return {
        id: row.id,
        leadId: row.lead_id,
        fromStatus: row.from_status,
        toStatus: row.to_status,
        changedBy: row.changed_by,
        createdAt: row.created_at,
    };
}

export function mapLeadAttachmentRow(row: LeadAttachmentRow): LeadAttachment {
    return {
        id: row.id,
        leadId: row.lead_id,
        fileId: row.file_id,
        createdBy: row.created_by,
        createdAt: row.created_at,
    };
}

export function mapLeadChargeRow(row: LeadChargeRow): LeadCharge {
    return {
        id: row.id,
        leadId: row.lead_id,
        vendorId: row.vendor_id,
        creditAccountId: row.credit_account_id,
        totalAmount: row.total_amount,
        priceBreakdown: (row.price_breakdown ?? []) as PriceBreakdownItem[],
        status: row.status,
        chargeTransactionId: row.charge_transaction_id,
        refundTransactionId: row.refund_transaction_id,
        refundReason: row.refund_reason,
        refundAmount: row.refund_amount,
        refundedAt: row.refunded_at,
        isDuplicate: row.is_duplicate,
        duplicateOfLeadId: row.duplicate_of_lead_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapLeadReportRow(row: LeadReportRow): LeadReport {
    return {
        id: row.id,
        leadId: row.lead_id,
        reporterUserId: row.reporter_user_id,
        reason: row.reason,
        detail: row.detail,
        status: row.status,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapLeadDetail(input: {
    lead: LeadRow;
    vendor: LeadVendorSummary | null;
    statusHistory: LeadStatusHistory[];
    attachments: LeadAttachment[];
    charge?: LeadCharge | null;
}): LeadDetail {
    return {
        ...mapLeadRow(input.lead, input.vendor),
        statusHistory: input.statusHistory,
        attachments: input.attachments,
        charge: input.charge ?? null,
    };
}

