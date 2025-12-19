import type { Tables } from "@/lib/database.types";
import type { LeadAttachment, LeadDetail, LeadListItem, LeadStatusHistory, LeadVendorSummary } from "@/lib/schema/lead";

type LeadRow = Tables<"leads">;
type LeadStatusHistoryRow = Tables<"lead_status_history">;
type LeadAttachmentRow = Tables<"lead_attachments">;

export function mapLeadVendorSummary(input: { id: string; name: string } | null | undefined): LeadVendorSummary | null {
    if (!input) return null;
    return { id: input.id, name: input.name };
}

export function mapLeadRow(row: LeadRow, vendor?: LeadVendorSummary | null): LeadListItem {
    return {
        id: row.id,
        doctorUserId: row.doctor_user_id,
        vendorId: row.vendor_id,
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

export function mapLeadDetail(input: {
    lead: LeadRow;
    vendor: LeadVendorSummary | null;
    statusHistory: LeadStatusHistory[];
    attachments: LeadAttachment[];
}): LeadDetail {
    return {
        ...mapLeadRow(input.lead, input.vendor),
        statusHistory: input.statusHistory,
        attachments: input.attachments,
    };
}

