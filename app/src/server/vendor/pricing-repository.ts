import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VendorServicePriceRow } from "./pricing-mapper";

export async function listVendorServicePrices(
    supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<VendorServicePriceRow[]> {
    const { data, error } = await supabase
        .from("vendor_service_prices")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("status", "active")
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("서비스 단가를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as VendorServicePriceRow[];
}

export async function getVendorServicePriceById(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<VendorServicePriceRow | null> {
    const { data, error } = await supabase
        .from("vendor_service_prices")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw internalServerError("서비스 단가를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as VendorServicePriceRow) ?? null;
}

export async function createVendorServicePrice(
    supabase: SupabaseClient<Database>,
    payload: {
        vendorId: string;
        categoryId: string;
        price: number;
        dailyBudgetLimit?: number;
    },
): Promise<VendorServicePriceRow> {
    const { data, error } = await supabase
        .from("vendor_service_prices")
        .insert({
            vendor_id: payload.vendorId,
            category_id: payload.categoryId,
            price: payload.price,
            daily_budget_limit: payload.dailyBudgetLimit ?? null,
        })
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("서비스 단가를 생성할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as VendorServicePriceRow;
}

export async function updateVendorServicePrice(
    supabase: SupabaseClient<Database>,
    id: string,
    payload: {
        price?: number;
        dailyBudgetLimit?: number | null;
    },
): Promise<VendorServicePriceRow> {
    const updateData: Record<string, unknown> = {};
    if (payload.price !== undefined) {
        updateData.price = payload.price;
    }
    if (payload.dailyBudgetLimit !== undefined) {
        updateData.daily_budget_limit = payload.dailyBudgetLimit;
    }

    const { data, error } = await supabase
        .from("vendor_service_prices")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("서비스 단가를 수정할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as VendorServicePriceRow;
}

export async function archiveVendorServicePrice(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<VendorServicePriceRow> {
    const { data, error } = await supabase
        .from("vendor_service_prices")
        .update({ status: "archived" as const })
        .eq("id", id)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("서비스 단가를 삭제할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as VendorServicePriceRow;
}
