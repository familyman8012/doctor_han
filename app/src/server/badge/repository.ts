import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { VendorBadge } from "@/lib/schema/badge";
import { internalServerError } from "@/server/api/errors";

export interface ActiveVendorRow {
    id: string;
    owner_user_id: string;
    created_at: string;
}

export async function fetchAllActiveVendors(
    admin: SupabaseClient<Database>,
): Promise<ActiveVendorRow[]> {
    const { data, error } = await admin
        .from("vendors")
        .select("id, owner_user_id, created_at")
        .eq("status", "active");

    if (error) {
        throw internalServerError("활성 업체 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as ActiveVendorRow[];
}

export async function fetchVerificationStatuses(
    admin: SupabaseClient<Database>,
    userIds: string[],
): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();

    const { data, error } = await admin
        .from("vendor_verifications")
        .select("user_id, status")
        .in("user_id", userIds);

    if (error) {
        throw internalServerError("인증 상태를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const map = new Map<string, string>();
    for (const row of data ?? []) {
        map.set(row.user_id, row.status);
    }
    return map;
}

export async function fetchAvgResponseTimes(
    admin: SupabaseClient<Database>,
    vendorIds: string[],
    since: string,
    vendorOwnerMap: Map<string, string>,
): Promise<Map<string, number>> {
    const vendorTimes = await fetchResponseHoursByVendor(admin, vendorIds, since, vendorOwnerMap);

    const result = new Map<string, number>();
    for (const [vendorId, times] of vendorTimes) {
        if (times.length >= 3) {
            const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
            result.set(vendorId, Math.round(avg * 10) / 10);
        }
    }

    return result;
}

export async function fetchOverallAvgResponseHours(
    admin: SupabaseClient<Database>,
    vendorIds: string[],
    since: string,
    vendorOwnerMap: Map<string, string>,
): Promise<number> {
    const vendorTimes = await fetchResponseHoursByVendor(admin, vendorIds, since, vendorOwnerMap);
    const allHours = [...vendorTimes.values()].flat();

    if (allHours.length === 0) {
        return 0;
    }

    const avg = allHours.reduce((sum, hours) => sum + hours, 0) / allHours.length;
    return Math.round(avg * 10) / 10;
}

async function fetchResponseHoursByVendor(
    admin: SupabaseClient<Database>,
    vendorIds: string[],
    since: string,
    vendorOwnerMap: Map<string, string>,
): Promise<Map<string, number[]>> {
    if (vendorIds.length === 0) return new Map();

    // Fetch leads for these vendors created in the last 90 days
    const { data: leads, error: leadsError } = await admin
        .from("leads")
        .select("id, vendor_id, created_at")
        .in("vendor_id", vendorIds)
        .gte("created_at", since);

    if (leadsError) {
        throw internalServerError("리드 목록을 조회할 수 없습니다.", {
            message: leadsError.message,
            code: leadsError.code,
        });
    }

    if (!leads || leads.length === 0) return new Map();

    const leadIds = leads.map((l) => l.id);
    const leadVendorMap = new Map(leads.map((l) => [l.id, l.vendor_id]));

    // Fetch first status change per lead (after submitted)
    const { data: historyRows, error: historyError } = await admin
        .from("lead_status_history")
        .select("lead_id, from_status, to_status, created_at, changed_by")
        .in("lead_id", leadIds)
        .eq("from_status", "submitted" as never)
        .order("created_at", { ascending: true });

    if (historyError) {
        throw internalServerError("리드 상태 이력을 조회할 수 없습니다.", {
            message: historyError.message,
            code: historyError.code,
        });
    }

    // Get first vendor response per lead (only count changes made by vendor owner)
    const firstResponseMap = new Map<string, string>();
    for (const row of historyRows ?? []) {
        if (firstResponseMap.has(row.lead_id)) continue;

        const vendorId = leadVendorMap.get(row.lead_id);
        const ownerUserId = vendorId ? vendorOwnerMap.get(vendorId) : undefined;

        if (row.changed_by && row.changed_by === ownerUserId) {
            firstResponseMap.set(row.lead_id, row.created_at);
        }
    }

    // Calculate avg per vendor
    const vendorTimes = new Map<string, number[]>();
    for (const lead of leads) {
        const responseAt = firstResponseMap.get(lead.id);
        if (!responseAt) continue;

        const hours =
            (new Date(responseAt).getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60);
        if (hours < 0) continue;

        const times = vendorTimes.get(lead.vendor_id) ?? [];
        times.push(hours);
        vendorTimes.set(lead.vendor_id, times);
    }

    return vendorTimes;
}

export interface CategoryRanking {
    percentile: number;
    categoryId: string;
}

export async function fetchCategoryRankings(
    admin: SupabaseClient<Database>,
): Promise<Map<string, CategoryRanking>> {
    // Get all active vendors with their categories, rating, and review count
    const { data: vendorCategories, error: vcError } = await admin
        .from("vendor_categories")
        .select("vendor_id, category_id");

    if (vcError) {
        throw internalServerError("업체 카테고리를 조회할 수 없습니다.", {
            message: vcError.message,
            code: vcError.code,
        });
    }

    if (!vendorCategories) return new Map();

    const { data: vendors, error: vError } = await admin
        .from("vendors")
        .select("id, rating_avg, review_count")
        .eq("status", "active")
        .gte("review_count", 5);

    if (vError) {
        throw internalServerError("업체 평점 데이터를 조회할 수 없습니다.", {
            message: vError.message,
            code: vError.code,
        });
    }

    if (!vendors) return new Map();

    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    // Group vendors by category
    const categoryVendors = new Map<string, Array<{ vendorId: string; ratingAvg: number; reviewCount: number }>>();
    for (const vc of vendorCategories) {
        const vendor = vendorMap.get(vc.vendor_id);
        if (!vendor || vendor.rating_avg === null) continue;

        const list = categoryVendors.get(vc.category_id) ?? [];
        list.push({
            vendorId: vc.vendor_id,
            ratingAvg: vendor.rating_avg,
            reviewCount: vendor.review_count,
        });
        categoryVendors.set(vc.category_id, list);
    }

    // Calculate percentile per vendor (best rank across categories)
    const result = new Map<string, CategoryRanking>();

    for (const [categoryId, vendorsInCat] of categoryVendors) {
        // Skip categories with fewer than 5 vendors
        if (vendorsInCat.length < 5) continue;

        // Sort by rating desc, then review count desc
        vendorsInCat.sort((a, b) => b.ratingAvg - a.ratingAvg || b.reviewCount - a.reviewCount);

        for (let i = 0; i < vendorsInCat.length; i++) {
            const percentile = Math.ceil(((i + 1) / vendorsInCat.length) * 100);

            if (percentile > 20) continue;

            const existing = result.get(vendorsInCat[i].vendorId);
            if (!existing || percentile < existing.percentile) {
                result.set(vendorsInCat[i].vendorId, { percentile, categoryId });
            }
        }
    }

    return result;
}

export async function fetchActiveMemberships(
    admin: SupabaseClient<Database>,
    vendorIds: string[],
): Promise<Set<string>> {
    if (vendorIds.length === 0) return new Set();

    const { data, error } = await admin
        .from("vendor_memberships")
        .select("vendor_id")
        .in("vendor_id", vendorIds)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());

    if (error) {
        throw internalServerError("멤버십 상태를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return new Set((data ?? []).map((r) => r.vendor_id));
}

export async function batchUpdateBadges(
    admin: SupabaseClient<Database>,
    updates: Array<{ vendorId: string; badges: VendorBadge[] }>,
): Promise<number> {
    let updatedCount = 0;

    for (const { vendorId, badges } of updates) {
        const { error } = await admin
            .from("vendors")
            .update({ badges } as never)
            .eq("id", vendorId);

        if (error) {
            console.error(`[Badge] Failed to update badges for vendor ${vendorId}:`, error.message);
            continue;
        }
        updatedCount++;
    }

    return updatedCount;
}
