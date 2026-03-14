import "server-only";

import type { SearchAutocompleteItem, PopularSearchTerm } from "@/lib/schema/search";
import type { VendorListItem } from "@/lib/schema/vendor";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import {
    fetchAutocomplete,
    fetchPopularSearchTerms,
    insertSearchEvent,
    searchVendorsRanked,
} from "./repository";
import { mapRankedVendorRow } from "./mapper";

// ============================================
// Ranked Search
// ============================================

export async function searchVendors(params: {
    query: string;
    categoryId?: string;
    priceMin?: number;
    priceMax?: number;
    sort: string;
    page: number;
    pageSize: number;
    userId?: string;
}): Promise<{ items: VendorListItem[]; total: number }> {
    const admin = createSupabaseAdminClient();
    const offset = (params.page - 1) * params.pageSize;

    const { rows, total } = await searchVendorsRanked(admin, {
        query: params.query,
        categoryId: params.categoryId,
        priceMin: params.priceMin,
        priceMax: params.priceMax,
        sort: params.sort,
        limit: params.pageSize,
        offset,
    });

    const items = rows.map(mapRankedVendorRow);

    // Fire-and-forget: log search event (reuse admin client)
    insertSearchEvent(admin, {
        query: params.query,
        userId: params.userId ?? null,
        resultCount: total,
    }).catch(() => {
        // Intentionally swallowed — logging failure must not affect search response
    });

    return { items, total };
}

// ============================================
// Autocomplete
// ============================================

export async function getAutocomplete(params: {
    query: string;
    limit: number;
}): Promise<SearchAutocompleteItem[]> {
    const admin = createSupabaseAdminClient();
    const rows = await fetchAutocomplete(admin, params);

    return rows.map((row) => ({
        label: row.label,
        type: row.type as "vendor" | "category",
        score: row.score,
    }));
}

// ============================================
// Popular Terms
// ============================================

export async function getPopularSearchTerms(params: {
    days: number;
    limit: number;
}): Promise<PopularSearchTerm[]> {
    const admin = createSupabaseAdminClient();
    const rows = await fetchPopularSearchTerms(admin, params);

    return rows.map((row) => ({
        term: row.term,
        count: Number(row.count),
    }));
}
