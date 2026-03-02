import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError, notFound } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RefundRequestRow, RefundRequestRowWithCharge } from "./mapper";

const CHARGE_JOIN = "lead_charges(lead_id, total_amount)" as const;

export async function insertRefundRequest(
    supabase: SupabaseClient<Database>,
    input: {
        lead_charge_id: string;
        vendor_id: string;
        requester_user_id: string;
        reason: Database["public"]["Enums"]["refund_request_reason"];
        description?: string;
    },
): Promise<RefundRequestRowWithCharge> {
    const { data, error } = await supabase
        .from("refund_requests")
        .insert(input)
        .select(`*, ${CHARGE_JOIN}`)
        .single();

    if (error || !data) {
        throw internalServerError("환불 요청 생성에 실패했습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as RefundRequestRowWithCharge;
}

export async function getRefundRequestById(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<RefundRequestRowWithCharge> {
    const { data, error } = await supabase
        .from("refund_requests")
        .select(`*, ${CHARGE_JOIN}`)
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw internalServerError("환불 요청 조회에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (!data) {
        throw notFound("환불 요청을 찾을 수 없습니다.");
    }

    return data as RefundRequestRowWithCharge;
}

export async function getRefundRequestByChargeId(
    supabase: SupabaseClient<Database>,
    leadChargeId: string,
): Promise<RefundRequestRow | null> {
    const { data, error } = await supabase
        .from("refund_requests")
        .select("*")
        .eq("lead_charge_id", leadChargeId)
        .maybeSingle();

    if (error) {
        throw internalServerError("환불 요청 조회에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data;
}

export async function listRefundRequestsByVendor(
    supabase: SupabaseClient<Database>,
    params: { vendorId: string; status?: string; page: number; pageSize: number },
): Promise<{ rows: RefundRequestRowWithCharge[]; total: number }> {
    const offset = (params.page - 1) * params.pageSize;

    let query = supabase
        .from("refund_requests")
        .select(`*, ${CHARGE_JOIN}`, { count: "exact" })
        .eq("vendor_id", params.vendorId);

    if (params.status) {
        query = query.eq("status", params.status as Database["public"]["Enums"]["refund_request_status"]);
    }

    const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + params.pageSize - 1);

    if (error) {
        throw internalServerError("환불 요청 목록 조회에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return { rows: (data ?? []) as RefundRequestRowWithCharge[], total: count ?? 0 };
}

export async function listRefundRequestsAdmin(
    supabase: SupabaseClient<Database>,
    params: { status?: string; page: number; pageSize: number },
): Promise<{ rows: RefundRequestRowWithCharge[]; total: number }> {
    const offset = (params.page - 1) * params.pageSize;

    let query = supabase
        .from("refund_requests")
        .select(`*, ${CHARGE_JOIN}`, { count: "exact" });

    if (params.status) {
        query = query.eq("status", params.status as Database["public"]["Enums"]["refund_request_status"]);
    }

    const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + params.pageSize - 1);

    if (error) {
        throw internalServerError("환불 요청 목록 조회에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return { rows: (data ?? []) as RefundRequestRowWithCharge[], total: count ?? 0 };
}

export async function updateRefundRequest(
    supabase: SupabaseClient<Database>,
    id: string,
    input: {
        status: Database["public"]["Enums"]["refund_request_status"];
        admin_note?: string;
        reviewed_by: string;
        reviewed_at: string;
    },
): Promise<RefundRequestRowWithCharge> {
    const { data, error } = await supabase
        .from("refund_requests")
        .update(input)
        .eq("id", id)
        .select(`*, ${CHARGE_JOIN}`)
        .single();

    if (error || !data) {
        throw internalServerError("환불 요청 업데이트에 실패했습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as RefundRequestRowWithCharge;
}
