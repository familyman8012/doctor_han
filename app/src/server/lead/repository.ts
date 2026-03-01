import "server-only";

import type { Database } from "@/lib/database.types";
import type { PriceBreakdownItem } from "@/lib/schema/lead";
import { internalServerError, notFound } from "@/server/api/errors";
import {
    mapLeadAttachmentRow,
    mapLeadChargeRow,
    mapLeadDetail,
    mapLeadStatusHistoryRow,
    mapLeadVendorSummary,
} from "@/server/lead/mapper";
import type { LeadChargeRow, LeadReportRow } from "@/server/lead/mapper";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================
// Lead Detail
// ============================================

export async function fetchLeadDetail(supabase: SupabaseClient<Database>, leadId: string) {
    const { data: leadRow, error: leadError } = await supabase
        .from("leads")
        .select("*, vendor:vendors(id, name)")
        .eq("id", leadId)
        .maybeSingle();

    if (leadError) {
        throw internalServerError("리드를 조회할 수 없습니다.", {
            message: leadError.message,
            code: leadError.code,
        });
    }

    if (!leadRow) {
        throw notFound("리드를 찾을 수 없습니다.");
    }

    const [statusHistoryResult, attachmentsResult, chargeResult] = await Promise.all([
        supabase.from("lead_status_history").select("*").eq("lead_id", leadId).order("created_at", { ascending: true }),
        supabase.from("lead_attachments").select("*").eq("lead_id", leadId).order("created_at", { ascending: true }),
        supabase.from("lead_charges").select("*").eq("lead_id", leadId).maybeSingle(),
    ]);

    if (statusHistoryResult.error) {
        throw internalServerError("리드 상태 이력을 조회할 수 없습니다.", {
            message: statusHistoryResult.error.message,
            code: statusHistoryResult.error.code,
        });
    }

    if (attachmentsResult.error) {
        throw internalServerError("리드 첨부를 조회할 수 없습니다.", {
            message: attachmentsResult.error.message,
            code: attachmentsResult.error.code,
        });
    }

    if (chargeResult.error) {
        throw internalServerError("리드 과금 정보를 조회할 수 없습니다.", {
            message: chargeResult.error.message,
            code: chargeResult.error.code,
        });
    }

    const vendor = mapLeadVendorSummary((leadRow as unknown as { vendor?: { id: string; name: string } | null }).vendor);
    const charge = chargeResult.data ? mapLeadChargeRow(chargeResult.data) : null;

    return mapLeadDetail({
        lead: leadRow,
        vendor,
        statusHistory: (statusHistoryResult.data ?? []).map(mapLeadStatusHistoryRow),
        attachments: (attachmentsResult.data ?? []).map(mapLeadAttachmentRow),
        charge,
    });
}

// ============================================
// Lead Charges
// ============================================

export async function findDuplicateLeads(
    supabase: SupabaseClient<Database>,
    doctorUserId: string,
    vendorId: string,
    withinDays: number = 30,
    excludeLeadId?: string,
) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - withinDays);

    let query = supabase
        .from("leads")
        .select("*")
        .eq("doctor_user_id", doctorUserId)
        .eq("vendor_id", vendorId)
        .gte("created_at", thresholdDate.toISOString());

    if (excludeLeadId) {
        query = query.neq("id", excludeLeadId);
    }

    const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(1);

    if (error) {
        throw internalServerError("중복 리드 조회에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data ?? [];
}

export async function getLeadChargeByLeadId(
    supabase: SupabaseClient<Database>,
    leadId: string,
): Promise<LeadChargeRow | null> {
    const { data, error } = await supabase
        .from("lead_charges")
        .select("*")
        .eq("lead_id", leadId)
        .maybeSingle();

    if (error) {
        throw internalServerError("리드 과금 정보를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data;
}

export async function insertLeadCharge(
    supabase: SupabaseClient<Database>,
    payload: {
        lead_id: string;
        vendor_id: string;
        credit_account_id: string;
        total_amount: number;
        price_breakdown: PriceBreakdownItem[];
        status: string;
        charge_transaction_id?: string | null;
        is_duplicate: boolean;
        duplicate_of_lead_id?: string | null;
    },
): Promise<LeadChargeRow> {
    const { data, error } = await supabase
        .from("lead_charges")
        .insert({
            lead_id: payload.lead_id,
            vendor_id: payload.vendor_id,
            credit_account_id: payload.credit_account_id,
            total_amount: payload.total_amount,
            price_breakdown: payload.price_breakdown as unknown as Database["public"]["Tables"]["lead_charges"]["Insert"]["price_breakdown"],
            status: payload.status as Database["public"]["Enums"]["lead_charge_status"],
            charge_transaction_id: payload.charge_transaction_id ?? null,
            is_duplicate: payload.is_duplicate,
            duplicate_of_lead_id: payload.duplicate_of_lead_id ?? null,
        })
        .select()
        .single();

    if (error || !data) {
        throw internalServerError("리드 과금 정보를 생성할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data;
}

export async function updateLeadCharge(
    supabase: SupabaseClient<Database>,
    chargeId: string,
    updates: {
        status?: string;
        refund_transaction_id?: string | null;
        refund_reason?: string | null;
        refund_amount?: number | null;
        refunded_at?: string | null;
    },
): Promise<LeadChargeRow> {
    const updatePayload: Database["public"]["Tables"]["lead_charges"]["Update"] = {};

    if (updates.status !== undefined) {
        updatePayload.status = updates.status as Database["public"]["Enums"]["lead_charge_status"];
    }
    if (updates.refund_transaction_id !== undefined) {
        updatePayload.refund_transaction_id = updates.refund_transaction_id;
    }
    if (updates.refund_reason !== undefined) {
        updatePayload.refund_reason = updates.refund_reason as Database["public"]["Enums"]["lead_charge_refund_reason"] | null;
    }
    if (updates.refund_amount !== undefined) {
        updatePayload.refund_amount = updates.refund_amount;
    }
    if (updates.refunded_at !== undefined) {
        updatePayload.refunded_at = updates.refunded_at;
    }

    const { data, error } = await supabase
        .from("lead_charges")
        .update(updatePayload)
        .eq("id", chargeId)
        .select()
        .single();

    if (error || !data) {
        throw internalServerError("리드 과금 정보를 수정할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data;
}

// ============================================
// Lead Reports
// ============================================

export async function insertLeadReport(
    supabase: SupabaseClient<Database>,
    payload: {
        lead_id: string;
        reporter_user_id: string;
        reason: string;
        detail?: string | null;
    },
): Promise<LeadReportRow> {
    const { data, error } = await supabase
        .from("lead_reports")
        .insert({
            lead_id: payload.lead_id,
            reporter_user_id: payload.reporter_user_id,
            reason: payload.reason as Database["public"]["Enums"]["lead_report_reason"],
            detail: payload.detail ?? null,
        })
        .select()
        .single();

    if (error || !data) {
        throw internalServerError("리드 신고를 생성할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data;
}

export async function getLeadReportById(
    supabase: SupabaseClient<Database>,
    reportId: string,
): Promise<LeadReportRow | null> {
    const { data, error } = await supabase
        .from("lead_reports")
        .select("*")
        .eq("id", reportId)
        .maybeSingle();

    if (error) {
        throw internalServerError("리드 신고를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data;
}

export async function updateLeadReport(
    supabase: SupabaseClient<Database>,
    reportId: string,
    updates: {
        status?: string;
        reviewed_by?: string | null;
        reviewed_at?: string | null;
    },
): Promise<LeadReportRow> {
    const updatePayload: Database["public"]["Tables"]["lead_reports"]["Update"] = {};

    if (updates.status !== undefined) {
        updatePayload.status = updates.status as Database["public"]["Enums"]["lead_report_status"];
    }
    if (updates.reviewed_by !== undefined) {
        updatePayload.reviewed_by = updates.reviewed_by;
    }
    if (updates.reviewed_at !== undefined) {
        updatePayload.reviewed_at = updates.reviewed_at;
    }

    const { data, error } = await supabase
        .from("lead_reports")
        .update(updatePayload)
        .eq("id", reportId)
        .select()
        .single();

    if (error || !data) {
        throw internalServerError("리드 신고를 수정할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data;
}

export async function listLeadReports(
    supabase: SupabaseClient<Database>,
    params: { status?: string; page: number; pageSize: number },
): Promise<{ rows: LeadReportRow[]; total: number }> {
    const offset = (params.page - 1) * params.pageSize;

    let query = supabase
        .from("lead_reports")
        .select("*", { count: "exact" });

    if (params.status) {
        query = query.eq("status", params.status as Database["public"]["Enums"]["lead_report_status"]);
    }

    const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + params.pageSize - 1);

    if (error) {
        throw internalServerError("리드 신고 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return {
        rows: data ?? [],
        total: count ?? 0,
    };
}

// ============================================
// Unresponded Charged Leads
// ============================================

export async function getUnrespondedChargedLeads(
    supabase: SupabaseClient<Database>,
    hoursThreshold: number,
    options?: {
        maxHoursSinceCreated?: number;
        onlyUnwarned?: boolean;
    },
) {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

    // First, get charged lead_charges
    let chargesQuery = supabase
        .from("lead_charges")
        .select("*")
        .eq("status", "charged" as Database["public"]["Enums"]["lead_charge_status"]);

    if (options?.onlyUnwarned) {
        chargesQuery = chargesQuery.is("no_response_warned_at", null);
    }

    const { data: charges, error: chargesError } = await chargesQuery;

    if (chargesError) {
        throw internalServerError("과금된 리드 목록을 조회할 수 없습니다.", {
            message: chargesError.message,
            code: chargesError.code,
        });
    }

    if (!charges || charges.length === 0) {
        return [];
    }

    const chargedLeadIds = charges.map((c: LeadChargeRow) => c.lead_id);

    // Then, get leads that are still 'submitted' and older than the threshold
    let leadsQuery = supabase
        .from("leads")
        .select("*")
        .in("id", chargedLeadIds)
        .eq("status", "submitted")
        .lt("created_at", thresholdDate.toISOString());

    if (options?.maxHoursSinceCreated !== undefined) {
        const maxThresholdDate = new Date();
        maxThresholdDate.setHours(maxThresholdDate.getHours() - options.maxHoursSinceCreated);
        leadsQuery = leadsQuery.gte("created_at", maxThresholdDate.toISOString());
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
        throw internalServerError("미응답 리드 목록을 조회할 수 없습니다.", {
            message: leadsError.message,
            code: leadsError.code,
        });
    }

    if (!leads || leads.length === 0) {
        return [];
    }

    // Combine lead + charge data
    const chargeByLeadId = new Map(charges.map((c: LeadChargeRow) => [c.lead_id, c] as const));

    return leads.map((lead: typeof leads[number]) => ({
        lead,
        charge: mapLeadChargeRow(chargeByLeadId.get(lead.id)!),
    }));
}

export async function markLeadChargeNoResponseWarned(
    supabase: SupabaseClient<Database>,
    chargeId: string,
): Promise<void> {
    const { error } = await supabase
        .from("lead_charges")
        .update({ no_response_warned_at: new Date().toISOString() })
        .eq("id", chargeId);

    if (error) {
        throw internalServerError("무응답 경고 발송 기록에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }
}
