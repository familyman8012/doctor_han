import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdPriorityJumpupRow, AdPriorityPurchaseRow, AdPrioritySlotRow } from "./priority-mapper";

export async function listPrioritySlotsByCategory(
    supabase: SupabaseClient<Database>,
    categoryId: string,
): Promise<AdPrioritySlotRow[]> {
    const { data, error } = await supabase
        .from("ad_priority_slots")
        .select("*")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (error) {
        throw internalServerError("우선순위 슬롯을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as AdPrioritySlotRow[];
}

export async function countActivePurchasesBySlot(
    supabase: SupabaseClient<Database>,
    slotId: string,
): Promise<number> {
    const now = new Date().toISOString();

    const { count, error } = await supabase
        .from("ad_priority_purchases")
        .select("*", { count: "exact", head: true })
        .eq("priority_slot_id", slotId)
        .eq("status", "active")
        .gt("ends_at", now);

    if (error) {
        throw internalServerError("활성 구매 수를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return count ?? 0;
}

export async function expirePriorityPurchases(
    supabase: SupabaseClient<Database>,
    vendorId?: string,
): Promise<void> {
    const now = new Date().toISOString();

    let query = supabase
        .from("ad_priority_purchases")
        .update({
            status: "expired" as Database["public"]["Enums"]["ad_priority_purchase_status"],
            updated_at: now,
        })
        .eq("status", "active")
        .lte("ends_at", now);

    if (vendorId) {
        query = query.eq("vendor_id", vendorId);
    }

    const { error } = await query;

    if (error) {
        throw internalServerError("만료 광고 상태를 정리할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }
}

export async function createPriorityPurchase(
    supabase: SupabaseClient<Database>,
    payload: {
        prioritySlotId: string;
        vendorId: string;
        categoryId: string;
        tier: string;
        startsAt: string;
        endsAt: string;
        pricePaid: number;
        creditTransactionId?: string;
        jumpupRemaining: number;
    },
): Promise<AdPriorityPurchaseRow> {
    const { data, error } = await supabase
        .from("ad_priority_purchases")
        .insert({
            priority_slot_id: payload.prioritySlotId,
            vendor_id: payload.vendorId,
            category_id: payload.categoryId,
            tier: payload.tier as Database["public"]["Enums"]["ad_priority_tier"],
            status: "active" as Database["public"]["Enums"]["ad_priority_purchase_status"],
            starts_at: payload.startsAt,
            ends_at: payload.endsAt,
            price_paid: payload.pricePaid,
            credit_transaction_id: payload.creditTransactionId ?? null,
            jumpup_remaining: payload.jumpupRemaining,
        })
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("우선순위 구매를 생성할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as AdPriorityPurchaseRow;
}

export async function listActivePurchasesByCategory(
    supabase: SupabaseClient<Database>,
    categoryId: string,
): Promise<(AdPriorityPurchaseRow & { vendor_name: string; vendor_summary: string | null; vendor_thumbnail_url: string | null })[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("ad_priority_purchases")
        .select("*, vendors(name, summary), ad_priority_slots(sort_order)")
        .eq("category_id", categoryId)
        .eq("status", "active")
        .gt("ends_at", now)
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("활성 구매를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return ((data ?? []) as unknown[]).map((row: unknown) => {
        const r = row as AdPriorityPurchaseRow & {
            vendors: { name: string; summary: string | null } | null;
            ad_priority_slots: { sort_order: number } | null;
        };
        return {
            ...r,
            vendor_name: r.vendors?.name ?? "",
            vendor_summary: r.vendors?.summary ?? null,
            vendor_thumbnail_url: null, // Vendors table does not have thumbnail_url yet
            sort_order_slot: r.ad_priority_slots?.sort_order ?? 0,
        };
    }) as (AdPriorityPurchaseRow & { vendor_name: string; vendor_summary: string | null; vendor_thumbnail_url: string | null })[];
}

export async function listPurchasesByVendor(
    supabase: SupabaseClient<Database>,
    vendorId: string,
    params: { page: number; pageSize: number; status?: string },
): Promise<{ rows: AdPriorityPurchaseRow[]; total: number }> {
    let countQuery = supabase
        .from("ad_priority_purchases")
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", vendorId);

    if (params.status) {
        countQuery = countQuery.eq("status", params.status as Database["public"]["Enums"]["ad_priority_purchase_status"]);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
        throw internalServerError("구매 내역 개수를 조회할 수 없습니다.", {
            message: countError.message,
            code: countError.code,
        });
    }

    const total = count ?? 0;
    const offset = (params.page - 1) * params.pageSize;

    let dataQuery = supabase
        .from("ad_priority_purchases")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false })
        .range(offset, offset + params.pageSize - 1);

    if (params.status) {
        dataQuery = dataQuery.eq("status", params.status as Database["public"]["Enums"]["ad_priority_purchase_status"]);
    }

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
        throw internalServerError("구매 내역을 조회할 수 없습니다.", {
            message: dataError.message,
            code: dataError.code,
        });
    }

    return { rows: (data ?? []) as AdPriorityPurchaseRow[], total };
}

export async function getPurchaseById(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<AdPriorityPurchaseRow | null> {
    const { data, error } = await supabase
        .from("ad_priority_purchases")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw internalServerError("구매 정보를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as AdPriorityPurchaseRow) ?? null;
}

export async function createJumpup(
    supabase: SupabaseClient<Database>,
    purchaseId: string,
    expiresAt: string,
): Promise<AdPriorityJumpupRow> {
    const { data, error } = await supabase
        .from("ad_priority_jumpups")
        .insert({
            purchase_id: purchaseId,
            expires_at: expiresAt,
        })
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("점프업을 생성할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as AdPriorityJumpupRow;
}

export async function getActiveJumpups(
    supabase: SupabaseClient<Database>,
    categoryId: string,
): Promise<(AdPriorityJumpupRow & { purchase_id: string; vendor_id: string })[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("ad_priority_jumpups")
        .select("*, ad_priority_purchases!inner(id, vendor_id, category_id)")
        .gt("expires_at", now);

    if (error) {
        throw internalServerError("활성 점프업을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    // Filter by category_id from the joined purchases
    return ((data ?? []) as unknown[])
        .filter((row: unknown) => {
            const r = row as { ad_priority_purchases: { category_id: string } };
            return r.ad_priority_purchases?.category_id === categoryId;
        })
        .map((row: unknown) => {
            const r = row as AdPriorityJumpupRow & {
                ad_priority_purchases: { id: string; vendor_id: string };
            };
            return {
                ...r,
                purchase_id: r.ad_priority_purchases.id,
                vendor_id: r.ad_priority_purchases.vendor_id,
            };
        }) as (AdPriorityJumpupRow & { purchase_id: string; vendor_id: string })[];
}

export async function updatePurchaseJumpup(
    supabase: SupabaseClient<Database>,
    purchaseId: string,
    remaining: number,
    lastUsedAt: string,
): Promise<void> {
    const { error } = await supabase
        .from("ad_priority_purchases")
        .update({
            jumpup_remaining: remaining,
            jumpup_last_used_at: lastUsedAt,
            updated_at: new Date().toISOString(),
        })
        .eq("id", purchaseId);

    if (error) {
        throw internalServerError("점프업 정보를 업데이트할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }
}

export async function listAllPrioritySlotsWithCategory(
    supabase: SupabaseClient<Database>,
): Promise<(AdPrioritySlotRow & { category_name: string })[]> {
    const { data, error } = await supabase
        .from("ad_priority_slots")
        .select("*, categories(name)")
        .order("sort_order", { ascending: true });

    if (error) {
        throw internalServerError("우선순위 슬롯을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return ((data ?? []) as unknown[]).map((row: unknown) => {
        const r = row as AdPrioritySlotRow & { categories: { name: string } | null };
        return {
            ...r,
            category_name: r.categories?.name ?? "",
        };
    }) as (AdPrioritySlotRow & { category_name: string })[];
}
