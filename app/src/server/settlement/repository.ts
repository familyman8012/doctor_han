import "server-only";

import type { Database, Json } from "@/lib/database.types";
import type { SettlementItemType, SettlementStatus } from "@/lib/schema/settlement";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SettlementItemRow, SettlementRow } from "./mapper";

// ============================================
// Settlement CRUD
// ============================================

export async function listSettlements(
    supabase: SupabaseClient<Database>,
    params: {
        status?: string;
        vendorId?: string;
        year?: number;
        month?: number;
        page: number;
        pageSize: number;
    },
): Promise<{ rows: SettlementRow[]; total: number }> {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;

    let qb = supabase.from("settlements").select("*", { count: "exact" });

    if (params.status) {
        qb = qb.eq("status", params.status as SettlementStatus);
    }
    if (params.vendorId) {
        qb = qb.eq("vendor_id", params.vendorId);
    }
    if (params.year && params.month) {
        const periodStart = `${params.year}-${String(params.month).padStart(2, "0")}-01`;
        qb = qb.eq("period_start", periodStart);
    }

    qb = qb.order("created_at", { ascending: false });

    const { data, error, count } = await qb.range(from, to);

    if (error) {
        throw internalServerError("정산 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return {
        rows: (data ?? []) as SettlementRow[],
        total: count ?? 0,
    };
}

export async function getSettlementById(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<SettlementRow | null> {
    const { data, error } = await supabase
        .from("settlements")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw internalServerError("정산을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data as SettlementRow | null;
}

export async function getSettlementsByPeriod(
    supabase: SupabaseClient<Database>,
    periodStart: string,
    periodEnd: string,
): Promise<SettlementRow[]> {
    const { data, error } = await supabase
        .from("settlements")
        .select("*")
        .eq("period_start", periodStart)
        .eq("period_end", periodEnd);

    if (error) {
        throw internalServerError("기간별 정산을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as SettlementRow[];
}

export async function createSettlement(
    supabase: SupabaseClient<Database>,
    payload: {
        vendor_id: string;
        period_start: string;
        period_end: string;
        status: SettlementStatus;
        total_revenue: number;
        total_refunds: number;
        net_revenue: number;
        lead_charge_revenue: number;
        lead_charge_refunds: number;
        subscription_revenue: number;
        membership_revenue: number;
        ad_purchase_revenue: number;
        bid_commission_revenue: number;
        total_item_count: number;
    },
): Promise<SettlementRow> {
    const { data, error } = await supabase
        .from("settlements")
        .insert(payload)
        .select("*")
        .single();

    if (error) {
        throw internalServerError("정산을 생성할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data as SettlementRow;
}

export async function createSettlementItems(
    supabase: SupabaseClient<Database>,
    items: {
        settlement_id: string;
        item_type: SettlementItemType;
        source_id: string;
        amount: number;
        refund_amount: number;
        net_amount: number;
        description: string | null;
        source_created_at: string | null;
    }[],
): Promise<void> {
    if (items.length === 0) return;

    const { error } = await supabase.from("settlement_items").insert(items);

    if (error) {
        throw internalServerError("정산 항목을 생성할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }
}

type CreateSettlementWithItemsRpcRow = SettlementRow & {
    inserted: boolean;
};

export async function createSettlementWithItems(
    supabase: SupabaseClient<Database>,
    payload: {
        vendor_id: string;
        period_start: string;
        period_end: string;
        status: SettlementStatus;
        total_revenue: number;
        total_refunds: number;
        net_revenue: number;
        lead_charge_revenue: number;
        lead_charge_refunds: number;
        subscription_revenue: number;
        membership_revenue: number;
        ad_purchase_revenue: number;
        bid_commission_revenue: number;
        total_item_count: number;
        items: {
            item_type: SettlementItemType;
            source_id: string;
            amount: number;
            refund_amount: number;
            net_amount: number;
            description: string | null;
            source_created_at: string | null;
        }[];
    },
): Promise<{ row: SettlementRow; inserted: boolean }> {
    const { data, error } = await supabase.rpc("create_settlement_with_items", {
        p_vendor_id: payload.vendor_id,
        p_period_start: payload.period_start,
        p_period_end: payload.period_end,
        p_status: payload.status,
        p_total_revenue: payload.total_revenue,
        p_total_refunds: payload.total_refunds,
        p_net_revenue: payload.net_revenue,
        p_lead_charge_revenue: payload.lead_charge_revenue,
        p_lead_charge_refunds: payload.lead_charge_refunds,
        p_subscription_revenue: payload.subscription_revenue,
        p_membership_revenue: payload.membership_revenue,
        p_ad_purchase_revenue: payload.ad_purchase_revenue,
        p_bid_commission_revenue: payload.bid_commission_revenue,
        p_total_item_count: payload.total_item_count,
        p_items: payload.items as unknown as Json,
    });

    if (error) {
        throw internalServerError("정산 생성 처리에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const rpcRow = (data?.[0] as CreateSettlementWithItemsRpcRow | undefined) ?? null;
    if (!rpcRow) {
        throw internalServerError("정산 생성 결과를 확인할 수 없습니다.", {
            data,
        });
    }

    const { inserted, ...row } = rpcRow;

    return {
        row,
        inserted,
    };
}

export async function updateSettlementStatus(
    supabase: SupabaseClient<Database>,
    id: string,
    updates: Database["public"]["Tables"]["settlements"]["Update"],
): Promise<SettlementRow> {
    const { data, error } = await supabase
        .from("settlements")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
        throw internalServerError("정산 상태를 변경할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data as SettlementRow;
}

export async function listSettlementItems(
    supabase: SupabaseClient<Database>,
    settlementId: string,
    params: {
        itemType?: string;
        page: number;
        pageSize: number;
    },
): Promise<{ rows: SettlementItemRow[]; total: number }> {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;

    let qb = supabase
        .from("settlement_items")
        .select("*", { count: "exact" })
        .eq("settlement_id", settlementId);

    if (params.itemType) {
        qb = qb.eq("item_type", params.itemType as SettlementItemType);
    }

    qb = qb.order("created_at", { ascending: false });

    const { data, error, count } = await qb.range(from, to);

    if (error) {
        throw internalServerError("정산 항목을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return {
        rows: (data ?? []) as SettlementItemRow[],
        total: count ?? 0,
    };
}

// ============================================
// Revenue Source Queries (기간별 수익원 집계)
// ============================================

export type RevenueSourceRow = {
    id: string;
    vendor_id: string;
    amount: number;
    refund_amount: number;
    created_at: string;
    description: string;
};

export async function getLeadChargesForPeriod(
    supabase: SupabaseClient<Database>,
    start: string,
    end: string,
): Promise<RevenueSourceRow[]> {
    const { data, error } = await supabase
        .from("lead_charges")
        .select("id, vendor_id, total_amount, refund_amount, status, created_at")
        .in("status", ["charged", "refunded"])
        .gte("created_at", start)
        .lt("created_at", end);

    if (error) {
        throw internalServerError("리드 과금 데이터를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        vendor_id: row.vendor_id,
        amount: row.total_amount,
        refund_amount: row.refund_amount ?? 0,
        created_at: row.created_at,
        description: `리드 과금 (${row.status === "refunded" ? "환불" : "과금"})`,
    }));
}

export async function getSubscriptionsForPeriod(
    supabase: SupabaseClient<Database>,
    start: string,
    end: string,
): Promise<RevenueSourceRow[]> {
    const { data, error } = await supabase
        .from("vendor_subscriptions")
        .select("id, vendor_id, price_paid, created_at")
        .not("credit_transaction_id", "is", null)
        .gte("created_at", start)
        .lt("created_at", end);

    if (error) {
        throw internalServerError("구독 데이터를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        vendor_id: row.vendor_id,
        amount: row.price_paid,
        refund_amount: 0,
        created_at: row.created_at,
        description: "구독 결제",
    }));
}

export async function getMembershipsForPeriod(
    supabase: SupabaseClient<Database>,
    start: string,
    end: string,
): Promise<RevenueSourceRow[]> {
    const { data, error } = await supabase
        .from("vendor_memberships")
        .select("id, vendor_id, price_paid, created_at")
        .not("credit_transaction_id", "is", null)
        .gte("created_at", start)
        .lt("created_at", end);

    if (error) {
        throw internalServerError("입점비 데이터를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        vendor_id: row.vendor_id,
        amount: row.price_paid,
        refund_amount: 0,
        created_at: row.created_at,
        description: "입점비(멤버십) 결제",
    }));
}

export async function getAdPurchasesForPeriod(
    supabase: SupabaseClient<Database>,
    start: string,
    end: string,
): Promise<RevenueSourceRow[]> {
    const { data, error } = await supabase
        .from("ad_priority_purchases")
        .select("id, vendor_id, price_paid, created_at")
        .in("status", ["active", "expired"])
        .not("credit_transaction_id", "is", null)
        .gte("created_at", start)
        .lt("created_at", end);

    if (error) {
        throw internalServerError("광고 구매 데이터를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        vendor_id: row.vendor_id,
        amount: row.price_paid,
        refund_amount: 0,
        created_at: row.created_at,
        description: "광고 구매",
    }));
}

export async function getBidCommissionsForPeriod(
    supabase: SupabaseClient<Database>,
    start: string,
    end: string,
): Promise<RevenueSourceRow[]> {
    const { data, error } = await supabase
        .from("bid_contracts")
        .select("id, vendor_id, commission_amount, created_at")
        .eq("commission_status", "charged")
        .gte("created_at", start)
        .lt("created_at", end);

    if (error) {
        throw internalServerError("비딩 수수료 데이터를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        vendor_id: row.vendor_id,
        amount: row.commission_amount ?? 0,
        refund_amount: 0,
        created_at: row.created_at,
        description: "비딩 수수료",
    }));
}
