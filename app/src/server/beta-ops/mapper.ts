import "server-only";

import type { AdminLeadOpsItem, AdminStatusHistoryItem } from "@/lib/schema/beta-ops";

export function mapAdminLeadOpsItem(
    row: {
        id: string;
        status: string;
        created_at: string;
        viewed_at: string | null;
        vendor_id: string;
        vendor: { name: string } | null;
        doctor: { display_name: string | null } | null;
    },
    responseTimeMinutes: number | null,
): AdminLeadOpsItem {
    return {
        id: row.id,
        doctorName: row.doctor?.display_name ?? null,
        vendorName: row.vendor?.name ?? null,
        vendorId: row.vendor_id,
        status: row.status as AdminLeadOpsItem["status"],
        createdAt: row.created_at,
        viewedAt: row.viewed_at,
        responseTimeMinutes,
    };
}

export function mapAdminStatusHistoryItem(
    row: {
        id: string;
        lead_id: string;
        from_status: string | null;
        to_status: string;
        created_at: string;
        changer: { display_name: string | null } | null;
        lead: { created_at: string; vendor_id: string } | null;
    },
    timeSincePreviousChangeMinutes: number | null,
): AdminStatusHistoryItem {
    const leadCreatedAt = row.lead?.created_at ?? row.created_at;
    const timeSinceLeadCreationMinutes = Math.round(
        (new Date(row.created_at).getTime() - new Date(leadCreatedAt).getTime()) / 60000,
    );

    return {
        id: row.id,
        leadId: row.lead_id,
        fromStatus: row.from_status as AdminStatusHistoryItem["fromStatus"],
        toStatus: row.to_status as AdminStatusHistoryItem["toStatus"],
        changedByName: row.changer?.display_name ?? null,
        createdAt: row.created_at,
        leadCreatedAt,
        timeSinceLeadCreationMinutes,
        timeSincePreviousChangeMinutes,
    };
}
