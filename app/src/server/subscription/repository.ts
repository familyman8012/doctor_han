import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionPlanRow, VendorSubscriptionRow } from "./mapper";

export async function listActivePlans(
    supabase: SupabaseClient<Database>,
): Promise<SubscriptionPlanRow[]> {
    const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (error) {
        throw internalServerError("구독 플랜을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as SubscriptionPlanRow[];
}

export async function getPlanById(
    supabase: SupabaseClient<Database>,
    planId: string,
): Promise<SubscriptionPlanRow | null> {
    const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .eq("is_active", true)
        .maybeSingle();

    if (error) {
        throw internalServerError("구독 플랜을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as SubscriptionPlanRow) ?? null;
}

export async function listVendorSubscriptions(
    supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<VendorSubscriptionRow[]> {
    const { data, error } = await supabase
        .from("vendor_subscriptions")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

    if (error) {
        throw internalServerError("구독 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as VendorSubscriptionRow[];
}

export async function getVendorSubscriptionById(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<VendorSubscriptionRow | null> {
    const { data, error } = await supabase
        .from("vendor_subscriptions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw internalServerError("구독을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as VendorSubscriptionRow) ?? null;
}

export async function getActiveSubscription(
    supabase: SupabaseClient<Database>,
    vendorId: string,
    categoryId: string,
): Promise<VendorSubscriptionRow | null> {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
        .from("vendor_subscriptions")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("category_id", categoryId)
        .eq("status", "active")
        .gt("expires_at", nowIso)
        .maybeSingle();

    if (error) {
        throw internalServerError("활성 구독을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as VendorSubscriptionRow) ?? null;
}

export async function createVendorSubscription(
    supabase: SupabaseClient<Database>,
    payload: {
        vendorId: string;
        categoryId: string;
        planId: string;
        pricePaid: number;
        expiresAt: string;
        autoRenew: boolean;
        creditTransactionId: string | null;
    },
): Promise<VendorSubscriptionRow> {
    const { data, error } = await supabase
        .from("vendor_subscriptions")
        .insert({
            vendor_id: payload.vendorId,
            category_id: payload.categoryId,
            plan_id: payload.planId,
            price_paid: payload.pricePaid,
            expires_at: payload.expiresAt,
            auto_renew: payload.autoRenew,
            credit_transaction_id: payload.creditTransactionId,
        })
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("구독을 생성할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as VendorSubscriptionRow;
}

export async function updateSubscriptionAutoRenew(
    supabase: SupabaseClient<Database>,
    id: string,
    autoRenew: boolean,
): Promise<VendorSubscriptionRow> {
    const { data, error } = await supabase
        .from("vendor_subscriptions")
        .update({ auto_renew: autoRenew })
        .eq("id", id)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("자동갱신 설정을 업데이트할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as VendorSubscriptionRow;
}
