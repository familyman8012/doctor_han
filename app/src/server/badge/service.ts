import "server-only";

import { BADGE_DISPLAY_CONFIG, type VendorBadge } from "@/lib/schema/badge";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { parseBadgesFromJson } from "./mapper";
import {
    type ActiveVendorRow,
    type CategoryRanking,
    fetchActiveMemberships,
    fetchAllActiveVendors,
    fetchAvgResponseTimes,
    fetchCategoryRankings,
    fetchVerificationStatuses,
    batchUpdateBadges,
} from "./repository";

interface BadgeComputeContext {
    verificationMap: Map<string, string>;
    responseTimeMap: Map<string, number>;
    categoryRankingMap: Map<string, CategoryRanking>;
    activeMembershipSet: Set<string>;
    now: Date;
}

function computeBadges(vendor: ActiveVendorRow, ctx: BadgeComputeContext): VendorBadge[] {
    const badges: VendorBadge[] = [];
    const nowIso = ctx.now.toISOString();

    // 1. 메디허브 인증 — 사업자 인증 완료
    const verificationStatus = ctx.verificationMap.get(vendor.owner_user_id);
    if (verificationStatus === "approved") {
        badges.push({
            type: "verified",
            label: BADGE_DISPLAY_CONFIG.verified.label,
            awardedAt: nowIso,
        });
    }

    // 2. 빠른 응답 — 평균 응답시간 24h 이내
    const avgHours = ctx.responseTimeMap.get(vendor.id);
    if (avgHours !== undefined && avgHours < 24) {
        badges.push({
            type: "fast_response",
            label: BADGE_DISPLAY_CONFIG.fast_response.label,
            awardedAt: nowIso,
            meta: { avgHours },
        });
    }

    // 3. Top N% — 카테고리 내 리뷰/평점 상위
    const ranking = ctx.categoryRankingMap.get(vendor.id);
    if (ranking) {
        let label: string;
        if (ranking.percentile <= 5) {
            label = "Top 5%";
        } else if (ranking.percentile <= 10) {
            label = "Top 10%";
        } else {
            label = "Top 20%";
        }

        badges.push({
            type: "top_rated",
            label,
            awardedAt: nowIso,
            meta: { percentile: ranking.percentile, categoryId: ranking.categoryId },
        });
    }

    // 4. 프리미엄 파트너 — 유료 멤버십 업체
    if (ctx.activeMembershipSet.has(vendor.id)) {
        badges.push({
            type: "premium_partner",
            label: BADGE_DISPLAY_CONFIG.premium_partner.label,
            awardedAt: nowIso,
        });
    }

    // 5. 신규 입점 — 입점 30일 이내
    const createdAt = new Date(vendor.created_at);
    const thirtyDaysAgo = new Date(ctx.now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (createdAt > thirtyDaysAgo) {
        badges.push({
            type: "new_vendor",
            label: BADGE_DISPLAY_CONFIG.new_vendor.label,
            awardedAt: nowIso,
        });
    }

    return badges;
}

function badgesEqual(a: VendorBadge[], b: VendorBadge[]): boolean {
    if (a.length !== b.length) return false;
    // Normalize meta keys to avoid jsonb key-order mismatch from PostgreSQL
    const normalizeMeta = (meta: VendorBadge["meta"]) =>
        Object.entries(meta ?? {})
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
            .join(",");
    const serialize = (badge: VendorBadge) =>
        `${badge.type}:${badge.label}:${normalizeMeta(badge.meta)}`;
    const aKeys = a.map(serialize).sort();
    const bKeys = b.map(serialize).sort();
    return aKeys.every((key, i) => key === bKeys[i]);
}

export interface RefreshBadgesResult {
    totalVendors: number;
    updated: number;
    unchanged: number;
}

export async function refreshAllBadges(): Promise<RefreshBadgesResult> {
    const admin = createSupabaseAdminClient();

    // 1. Fetch all active vendors
    const vendors = await fetchAllActiveVendors(admin);
    if (vendors.length === 0) {
        return { totalVendors: 0, updated: 0, unchanged: 0 };
    }

    const vendorIds = vendors.map((v) => v.id);
    const userIds = vendors.map((v) => v.owner_user_id);
    const vendorOwnerMap = new Map(vendors.map((v) => [v.id, v.owner_user_id]));
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Fetch all needed data in parallel
    const [verificationMap, responseTimeMap, categoryRankingMap, activeMembershipSet] = await Promise.all([
        fetchVerificationStatuses(admin, userIds),
        fetchAvgResponseTimes(admin, vendorIds, ninetyDaysAgo, vendorOwnerMap),
        fetchCategoryRankings(admin),
        fetchActiveMemberships(admin, vendorIds),
    ]);

    const ctx: BadgeComputeContext = {
        verificationMap,
        responseTimeMap,
        categoryRankingMap,
        activeMembershipSet,
        now: new Date(),
    };

    // 3. Fetch current badges for comparison
    // NOTE: After running db:gen with the badges migration, remove the type assertion
    const { data: currentRows } = await admin
        .from("vendors")
        .select("id, badges" as "id")
        .in("id", vendorIds);

    const currentBadgesMap = new Map<string, VendorBadge[]>();
    for (const row of currentRows ?? []) {
        const r = row as unknown as { id: string; badges: unknown };
        currentBadgesMap.set(r.id, parseBadgesFromJson(r.badges));
    }

    // 4. Compute badges and collect updates
    const updates: Array<{ vendorId: string; badges: VendorBadge[] }> = [];

    for (const vendor of vendors) {
        const newBadges = computeBadges(vendor, ctx);
        const currentBadges = currentBadgesMap.get(vendor.id) ?? [];

        if (!badgesEqual(newBadges, currentBadges)) {
            updates.push({ vendorId: vendor.id, badges: newBadges });
        }
    }

    // 5. Batch update only changed vendors
    let updated = 0;
    if (updates.length > 0) {
        updated = await batchUpdateBadges(admin, updates);
    }

    return {
        totalVendors: vendors.length,
        updated,
        unchanged: vendors.length - updates.length,
    };
}
