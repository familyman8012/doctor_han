import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreditAccountRow, CreditPackageRow, CreditTransactionRow } from "./mapper";

export async function getOrCreateCreditAccount(
    supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<CreditAccountRow> {
    // 기존 계정 조회
    const { data: existing, error: selectError } = await supabase
        .from("credit_accounts")
        .select("*")
        .eq("vendor_id", vendorId)
        .maybeSingle();

    if (selectError) {
        throw internalServerError("크레딧 계정을 조회할 수 없습니다.", {
            message: selectError.message,
            code: selectError.code,
        });
    }

    if (existing) {
        return existing as CreditAccountRow;
    }

    // 신규 생성
    const { data: created, error: insertError } = await supabase
        .from("credit_accounts")
        .insert({ vendor_id: vendorId })
        .select("*")
        .single();

    if (insertError || !created) {
        throw internalServerError("크레딧 계정을 생성할 수 없습니다.", {
            message: insertError?.message,
            code: insertError?.code,
        });
    }

    return created as CreditAccountRow;
}

export async function getCreditAccount(
    supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<CreditAccountRow | null> {
    const { data, error } = await supabase
        .from("credit_accounts")
        .select("*")
        .eq("vendor_id", vendorId)
        .maybeSingle();

    if (error) {
        throw internalServerError("크레딧 계정을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as CreditAccountRow) ?? null;
}

export async function listActivePackages(
    supabase: SupabaseClient<Database>,
): Promise<CreditPackageRow[]> {
    const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (error) {
        throw internalServerError("충전 패키지를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as CreditPackageRow[];
}

export async function getPackageById(
    supabase: SupabaseClient<Database>,
    packageId: string,
): Promise<CreditPackageRow | null> {
    const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("id", packageId)
        .eq("is_active", true)
        .maybeSingle();

    if (error) {
        throw internalServerError("충전 패키지를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as CreditPackageRow) ?? null;
}

export async function listCreditTransactions(
    supabase: SupabaseClient<Database>,
    creditAccountId: string,
    params: { page: number; pageSize: number; type?: string },
): Promise<{ rows: CreditTransactionRow[]; total: number }> {
    let countQuery = supabase
        .from("credit_transactions")
        .select("*", { count: "exact", head: true })
        .eq("credit_account_id", creditAccountId);

    if (params.type) {
        countQuery = countQuery.eq("type", params.type as Database["public"]["Enums"]["credit_transaction_type"]);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
        throw internalServerError("거래 내역 개수를 조회할 수 없습니다.", {
            message: countError.message,
            code: countError.code,
        });
    }

    const total = count ?? 0;
    const offset = (params.page - 1) * params.pageSize;

    let dataQuery = supabase
        .from("credit_transactions")
        .select("*")
        .eq("credit_account_id", creditAccountId)
        .order("created_at", { ascending: false })
        .range(offset, offset + params.pageSize - 1);

    if (params.type) {
        dataQuery = dataQuery.eq("type", params.type as Database["public"]["Enums"]["credit_transaction_type"]);
    }

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
        throw internalServerError("거래 내역을 조회할 수 없습니다.", {
            message: dataError.message,
            code: dataError.code,
        });
    }

    return { rows: (data ?? []) as CreditTransactionRow[], total };
}

export async function createPendingTransaction(
    supabase: SupabaseClient<Database>,
    payload: {
        creditAccountId: string;
        type: string;
        amount: number;
        paymentId?: string;
        description?: string;
        expiresAt?: string;
        metadata?: Record<string, unknown>;
    },
): Promise<CreditTransactionRow> {
    const { data, error } = await supabase
        .from("credit_transactions")
        .insert({
            credit_account_id: payload.creditAccountId,
            type: payload.type as Database["public"]["Enums"]["credit_transaction_type"],
            status: "pending",
            amount: payload.amount,
            balance_after: 0,
            payment_id: payload.paymentId ?? null,
            description: payload.description ?? null,
            expires_at: payload.expiresAt ?? null,
            metadata: (payload.metadata ?? {}) as Database["public"]["Tables"]["credit_transactions"]["Insert"]["metadata"],
        })
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("크레딧 거래를 생성할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as CreditTransactionRow;
}

export async function getPendingTransactionByPaymentId(
    supabase: SupabaseClient<Database>,
    paymentId: string,
): Promise<CreditTransactionRow | null> {
    const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("payment_id", paymentId)
        .eq("type", "charge" as Database["public"]["Enums"]["credit_transaction_type"])
        .maybeSingle();

    if (error) {
        throw internalServerError("크레딧 거래를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as CreditTransactionRow) ?? null;
}

export async function updateAutoChargeSettings(
    supabase: SupabaseClient<Database>,
    creditAccountId: string,
    payload: { enabled: boolean; amount?: number },
): Promise<CreditAccountRow> {
    const updateData: Database["public"]["Tables"]["credit_accounts"]["Update"] = {
        auto_charge_enabled: payload.enabled,
        updated_at: new Date().toISOString(),
    };

    if (payload.amount !== undefined) {
        updateData.auto_charge_amount = payload.amount;
    }

    if (!payload.enabled) {
        updateData.auto_charge_amount = null;
    }

    const { data, error } = await supabase
        .from("credit_accounts")
        .update(updateData)
        .eq("id", creditAccountId)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("자동충전 설정을 업데이트할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as CreditAccountRow;
}
