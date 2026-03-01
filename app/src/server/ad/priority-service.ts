import "server-only";

import type { Database } from "@/lib/database.types";
import type { AdPriorityPurchase, AdPrioritySlot, PriorityVendor } from "@/lib/schema/ad";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapAdPriorityPurchaseRow, mapAdPrioritySlotRow } from "./priority-mapper";
import {
    countActivePurchasesBySlot,
    createJumpup,
    expirePriorityPurchases,
    getActiveJumpups,
    getPurchaseById,
    listActivePurchasesByCategory,
    listAllPrioritySlotsWithCategory,
    listPrioritySlotsByCategory,
    listPurchasesByVendor,
    updatePurchaseJumpup,
} from "./priority-repository";

// Tier sort order for display
const TIER_SORT_ORDER: Record<string, number> = {
    premium: 1,
    plus_up: 2,
    plus: 3,
    rookie: 4,
};

/**
 * 카테고리별 우선순위 업체 목록 (공개 표시용)
 * 정렬: jumped-up rookies first -> premium -> plus_up -> plus -> rookie
 */
export async function getPriorityVendorsForCategory(
    _supabase: SupabaseClient<Database>,
    categoryId: string,
): Promise<PriorityVendor[]> {
    const admin = createSupabaseAdminClient();
    await expirePriorityPurchases(admin);

    const [purchases, jumpups] = await Promise.all([
        listActivePurchasesByCategory(admin, categoryId),
        getActiveJumpups(admin, categoryId),
    ]);

    // Build a set of vendor IDs that have active jumpups
    const jumpedUpPurchaseIds = new Set(jumpups.map((j) => j.purchase_id));

    const vendors: PriorityVendor[] = purchases.map((p) => ({
        purchaseId: p.id,
        vendorId: p.vendor_id,
        vendorName: p.vendor_name,
        vendorSummary: p.vendor_summary,
        vendorThumbnailUrl: p.vendor_thumbnail_url,
        tier: p.tier as PriorityVendor["tier"],
        isJumpedUp: jumpedUpPurchaseIds.has(p.id),
        categoryId: p.category_id,
    }));

    // Sort: jumped-up rookies first, then by tier order
    vendors.sort((a, b) => {
        // Jumped-up rookies come first
        if (a.isJumpedUp && !b.isJumpedUp) return -1;
        if (!a.isJumpedUp && b.isJumpedUp) return 1;

        // Within same jumpup status, sort by tier
        const aTier = TIER_SORT_ORDER[a.tier] ?? 99;
        const bTier = TIER_SORT_ORDER[b.tier] ?? 99;
        return aTier - bTier;
    });

    return vendors;
}

/**
 * 우선순위 슬롯 구매
 */
export async function purchasePrioritySlot(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
    prioritySlotId: string,
): Promise<AdPriorityPurchase> {
    const admin = createSupabaseAdminClient();
    await expirePriorityPurchases(admin, vendorId);

    const { data: purchaseResult, error: purchaseError } = await admin.rpc("purchase_ad_priority_slot", {
        p_vendor_id: vendorId,
        p_priority_slot_id: prioritySlotId,
    });

    if (purchaseError) {
        const errorCode = purchaseError.message ?? "";
        if (errorCode.includes("PRIORITY_SLOT_NOT_FOUND")) {
            throw notFound("우선순위 슬롯을 찾을 수 없습니다.");
        }
        if (errorCode.includes("PRIORITY_SLOT_INACTIVE")) {
            throw badRequest("비활성화된 슬롯입니다.");
        }
        if (errorCode.includes("PRIORITY_SLOT_FULL")) {
            throw badRequest("이 슬롯의 구매 가능 수량을 초과했습니다.");
        }
        if (errorCode.includes("CREDIT_ACCOUNT_NOT_FOUND")) {
            throw badRequest("크레딧 계정이 없습니다. 먼저 크레딧을 충전해주세요.");
        }
        if (errorCode.includes("INSUFFICIENT_CREDIT")) {
            throw badRequest("크레딧 잔액이 부족합니다.");
        }
        throw internalServerError("크레딧 차감에 실패했습니다.", {
            message: purchaseError.message,
            code: purchaseError.code,
        });
    }

    const purchaseId = purchaseResult?.[0]?.purchase_id;
    if (!purchaseId) {
        throw internalServerError("광고 구매 처리 결과를 확인할 수 없습니다.");
    }

    const purchase = await getPurchaseById(admin, purchaseId);
    if (!purchase) {
        throw internalServerError("구매된 광고 정보를 찾을 수 없습니다.");
    }

    return mapAdPriorityPurchaseRow(purchase);
}

/**
 * 루키 점프업 활성화
 */
export async function activateJumpup(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
    purchaseId: string,
): Promise<{ success: boolean; expiresAt: string }> {
    const admin = createSupabaseAdminClient();
    await expirePriorityPurchases(admin, vendorId);

    // 1. Verify purchase exists and belongs to vendor
    const purchase = await getPurchaseById(admin, purchaseId);
    if (!purchase) {
        throw notFound("구매 정보를 찾을 수 없습니다.");
    }

    if (purchase.vendor_id !== vendorId) {
        throw badRequest("본인의 구매 건만 점프업할 수 있습니다.");
    }

    if (purchase.status !== "active") {
        throw badRequest("활성 상태의 구매 건만 점프업할 수 있습니다.");
    }
    if (new Date(purchase.ends_at).getTime() <= Date.now()) {
        throw badRequest("만료된 구매 건은 점프업할 수 없습니다.");
    }

    if (purchase.tier !== "rookie") {
        throw badRequest("루키 등급만 점프업을 사용할 수 있습니다.");
    }

    if (purchase.jumpup_remaining <= 0) {
        throw badRequest("점프업 사용 횟수를 모두 소진했습니다.");
    }

    // 2. Check 24h cooldown
    if (purchase.jumpup_last_used_at) {
        const lastUsed = new Date(purchase.jumpup_last_used_at).getTime();
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (now - lastUsed < twentyFourHours) {
            const nextAvailable = new Date(lastUsed + twentyFourHours);
            throw badRequest(
                `점프업은 24시간에 1회만 사용할 수 있습니다. 다음 사용 가능 시간: ${nextAvailable.toISOString()}`,
            );
        }
    }

    // 3. Create jumpup record (30 min expiry)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // +30 minutes

    await createJumpup(admin, purchaseId, expiresAt.toISOString());

    // 4. Update purchase: decrement remaining, set last_used_at
    await updatePurchaseJumpup(
        admin,
        purchaseId,
        purchase.jumpup_remaining - 1,
        now.toISOString(),
    );

    return {
        success: true,
        expiresAt: expiresAt.toISOString(),
    };
}

/**
 * 업체 광고 목록 (내 광고 조회)
 */
export async function getVendorAds(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
    params: { page: number; pageSize: number; status?: string },
): Promise<{ items: AdPriorityPurchase[]; page: number; pageSize: number; total: number }> {
    const admin = createSupabaseAdminClient();
    await expirePriorityPurchases(admin, vendorId);

    const { rows, total } = await listPurchasesByVendor(admin, vendorId, params);

    return {
        items: rows.map(mapAdPriorityPurchaseRow),
        page: params.page,
        pageSize: params.pageSize,
        total,
    };
}

/**
 * 관리자: 전체 우선순위 슬롯 리포트
 */
export async function getAdminPriorityReport(
    _supabase: SupabaseClient<Database>,
): Promise<{ slots: { slot: AdPrioritySlot; activePurchases: number; categoryName: string }[] }> {
    void _supabase;
    const admin = createSupabaseAdminClient();
    await expirePriorityPurchases(admin);

    const slotsWithCategory = await listAllPrioritySlotsWithCategory(admin);

    const slotsResult = await Promise.all(
        slotsWithCategory.map(async (s) => {
            const activeCount = await countActivePurchasesBySlot(admin, s.id);
            return {
                slot: mapAdPrioritySlotRow(s),
                activePurchases: activeCount,
                categoryName: s.category_name,
            };
        }),
    );

    return { slots: slotsResult };
}

/**
 * 카테고리별 우선순위 슬롯 + 활성 구매 수 (구매 페이지용)
 */
export async function getPrioritySlotsByCategory(
    _supabase: SupabaseClient<Database>,
    categoryId: string,
): Promise<{ slots: { slot: AdPrioritySlot; activePurchases: number }[] }> {
    const admin = createSupabaseAdminClient();
    await expirePriorityPurchases(admin);

    const slotRows = await listPrioritySlotsByCategory(admin, categoryId);

    const slotsResult = await Promise.all(
        slotRows.map(async (s) => {
            const activeCount = await countActivePurchasesBySlot(admin, s.id);
            return {
                slot: mapAdPrioritySlotRow(s),
                activePurchases: activeCount,
            };
        }),
    );

    return { slots: slotsResult };
}
