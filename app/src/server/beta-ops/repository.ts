import "server-only";

import type { Database } from "@/lib/database.types";
import type { AdminLeadOpsListQuery, AdminStatusHistoryQuery } from "@/lib/schema/beta-ops";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================
// Admin Lead Operations List
// ============================================

export async function listAdminLeadOps(
    supabase: SupabaseClient<Database>,
    params: AdminLeadOpsListQuery,
) {
    const { page, pageSize, status, vendorId, from, to } = params;
    const offset = (page - 1) * pageSize;

    let query = supabase
        .from("leads")
        .select(
            "id, status, created_at, viewed_at, vendor_id, vendor:vendors(name), doctor:profiles!leads_doctor_user_id_fkey(display_name)",
            { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

    if (status) {
        query = query.eq("status", status);
    }
    if (vendorId) {
        query = query.eq("vendor_id", vendorId);
    }
    if (from) {
        query = query.gte("created_at", from);
    }
    if (to) {
        query = query.lte("created_at", to);
    }

    const { data, error, count } = await query;

    if (error) {
        throw internalServerError("리드 운영 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    // Batch-fetch first status changes for response time calculation
    const leadIds = (data ?? []).map((row) => row.id);
    const firstChanges = leadIds.length > 0 ? await fetchFirstStatusChanges(supabase, leadIds) : [];

    return {
        items: data ?? [],
        total: count ?? 0,
        firstChanges,
    };
}

// ============================================
// Lead Count Since
// ============================================

export async function countLeadsCreatedSince(
    supabase: SupabaseClient<Database>,
    since: string,
) {
    const { count, error } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since);

    if (error) {
        throw internalServerError("리드 생성 수를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return count ?? 0;
}

// ============================================
// Leads In Period
// ============================================

export async function fetchLeadsInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
) {
    const { data, error } = await supabase
        .from("leads")
        .select("id, status, created_at, viewed_at, vendor_id")
        .gte("created_at", from)
        .lte("created_at", to);

    if (error) {
        throw internalServerError("기간별 리드를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data ?? [];
}

// ============================================
// First Status Changes (response time)
// ============================================

export async function fetchFirstStatusChanges(
    supabase: SupabaseClient<Database>,
    leadIds: string[],
) {
    const { data, error } = await supabase
        .from("lead_status_history")
        .select("id, lead_id, from_status, to_status, created_at")
        .in("lead_id", leadIds)
        .eq("from_status", "submitted")
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("리드 상태 변경 이력을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    // Keep only the earliest entry per lead
    const firstPerLead = new Map<string, (typeof data)[number]>();
    for (const row of data ?? []) {
        if (!firstPerLead.has(row.lead_id)) {
            firstPerLead.set(row.lead_id, row);
        }
    }

    return Array.from(firstPerLead.values());
}

// ============================================
// Unviewed Over 24h
// ============================================

export async function countUnviewedOver24h(supabase: SupabaseClient<Database>) {
    const minus24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .is("viewed_at", null)
        .lt("created_at", minus24h)
        .neq("status", "canceled");

    if (error) {
        throw internalServerError("미확인 리드 수를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return count ?? 0;
}

// ============================================
// Notification Failures
// ============================================

export async function countNotificationFailuresSince(
    supabase: SupabaseClient<Database>,
    since: string,
) {
    const { count, error } = await supabase
        .from("notification_deliveries")
        .select("id", { count: "exact", head: true })
        .not("failed_at", "is", null)
        .gte("created_at", since);

    if (error) {
        throw internalServerError("알림 실패 수를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return count ?? 0;
}

// ============================================
// Stuck Submitted Leads
// ============================================

export async function countStuckSubmittedLeads(
    supabase: SupabaseClient<Database>,
    olderThan: string,
) {
    const { count, error } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "submitted")
        .lt("created_at", olderThan);

    if (error) {
        throw internalServerError("정체 리드 수를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return count ?? 0;
}

// ============================================
// Admin Status History
// ============================================

export async function listAdminStatusHistory(
    supabase: SupabaseClient<Database>,
    params: AdminStatusHistoryQuery,
) {
    const { page, pageSize, leadId, vendorId, from, to } = params;
    const offset = (page - 1) * pageSize;

    let query = supabase
        .from("lead_status_history")
        .select(
            "id, lead_id, from_status, to_status, created_at, lead:leads(created_at, vendor_id), changer:profiles!lead_status_history_changed_by_fkey(display_name)",
            { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

    if (leadId) {
        query = query.eq("lead_id", leadId);
    }
    if (vendorId) {
        query = query.eq("lead.vendor_id", vendorId);
    }
    if (from) {
        query = query.gte("created_at", from);
    }
    if (to) {
        query = query.lte("created_at", to);
    }

    const { data, error, count } = await query;

    if (error) {
        throw internalServerError("상태 변경 이력을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return {
        items: data ?? [],
        total: count ?? 0,
    };
}
