import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================
// Search Event Logging (fire-and-forget)
// ============================================

export async function insertSearchEvent(
    supabase: SupabaseClient<Database>,
    params: {
        query: string;
        userId: string | null;
        resultCount: number | null;
    },
): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not in generated types until db:gen
    const { error } = await (supabase as any).from("search_events").insert({
        query: params.query,
        user_id: params.userId,
        result_count: params.resultCount,
    });

    if (error) {
        console.error("[SearchEvent] Failed to insert:", error.message);
    }
}

// ============================================
// Ranked Vendor Search via RPC
// ============================================

export type RankedVendorRow = {
    id: string;
    name: string;
    summary: string | null;
    region_primary: string | null;
    region_secondary: string | null;
    road_address: string | null;
    jibun_address: string | null;
    address_detail: string | null;
    zonecode: string | null;
    latitude: number | null;
    longitude: number | null;
    price_min: number | null;
    price_max: number | null;
    rating_avg: number | null;
    review_count: number;
    profile_image_url: string | null;
    rank: number;
    total_count: number;
};

export async function searchVendorsRanked(
    supabase: SupabaseClient<Database>,
    params: {
        query: string;
        categoryId?: string;
        priceMin?: number;
        priceMax?: number;
        sort: string;
        limit: number;
        offset: number;
    },
): Promise<{ rows: RankedVendorRow[]; total: number }> {
    const { data, error } = await supabase.rpc("search_vendors_ranked" as never, {
        p_query: params.query,
        p_category_id: params.categoryId ?? null,
        p_price_min: params.priceMin ?? null,
        p_price_max: params.priceMax ?? null,
        p_sort: params.sort,
        p_limit: params.limit,
        p_offset: params.offset,
    } as never);

    if (error) {
        throw internalServerError("검색 결과를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const rows = (data ?? []) as unknown as RankedVendorRow[];
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

    return { rows, total };
}

// ============================================
// Autocomplete via RPC
// ============================================

export type AutocompleteRow = {
    label: string;
    type: string;
    score: number;
};

export async function fetchAutocomplete(
    supabase: SupabaseClient<Database>,
    params: { query: string; limit: number },
): Promise<AutocompleteRow[]> {
    const { data, error } = await supabase.rpc("search_autocomplete" as never, {
        p_query: params.query,
        p_limit: params.limit,
    } as never);

    if (error) {
        throw internalServerError("자동완성 결과를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as unknown as AutocompleteRow[];
}

// ============================================
// Popular Search Terms via RPC
// ============================================

export type PopularTermRow = {
    term: string;
    count: number;
};

export async function fetchPopularSearchTerms(
    supabase: SupabaseClient<Database>,
    params: { days: number; limit: number },
): Promise<PopularTermRow[]> {
    const { data, error } = await supabase.rpc("get_popular_search_terms" as never, {
        p_days: params.days,
        p_limit: params.limit,
    } as never);

    if (error) {
        throw internalServerError("인기 검색어를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as unknown as PopularTermRow[];
}
