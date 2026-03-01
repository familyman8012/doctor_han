import "server-only";

import type { Database } from "@/lib/database.types";
import type { AdCampaign, AdCreative, AdSlot, BannerAd } from "@/lib/schema/ad";
import { badRequest, conflict, internalServerError, notFound } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapAdCampaignRow, mapAdCreativeRow, mapAdSlotRow } from "./mapper";
import {
    countOverlappingCampaigns,
    createCampaign,
    getCampaignById,
    getCreativeById,
    getCreativesByCampaignId,
    getSlotById,
    getAdReport as getAdReportRepo,
    incrementCampaignClicks,
    incrementCampaignImpressions,
    incrementDailyClicks,
    insertClickLog,
    listActiveCampaignsBySlot,
    listActiveSlots,
    listCampaigns,
    updateCampaign,
    upsertDailyImpression,
} from "./repository";

/**
 * Pick random items from an array (Fisher-Yates partial shuffle)
 */
function pickRandom<T>(arr: T[], count: number): T[] {
    if (arr.length <= count) return arr;
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

/**
 * 배너 광고 표시용 조회
 * - 활성 슬롯별로 활성 캠페인 조회
 * - display_count만큼 랜덤 선택
 * - 노출 기록 (admin client 사용)
 */
export async function getBannersForDisplay(
    _supabase: SupabaseClient<Database>,
    position?: string,
): Promise<BannerAd[]> {
    const admin = createSupabaseAdminClient();

    const allSlots = await listActiveSlots(admin);
    const slots = position ? allSlots.filter((s) => s.position === position) : allSlots;

    const banners: BannerAd[] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const slot of slots) {
        const campaigns = await listActiveCampaignsBySlot(admin, slot.id);
        const selected = pickRandom(campaigns, slot.display_count);

        for (const campaign of selected) {
            const activeCreatives = campaign.creatives.filter((c) => c.is_active);
            if (activeCreatives.length === 0) continue;

            // Pick the first creative (or random if multiple)
            const creative = activeCreatives[0];

            banners.push({
                campaignId: campaign.id,
                creativeId: creative.id,
                title: creative.title,
                imageUrl: creative.image_url,
                clickUrl: creative.click_url,
                position: slot.position as BannerAd["position"],
            });
        }

        // Track impressions in background (non-blocking)
        if (selected.length > 0) {
            const impressionPromises = selected.map((c) =>
                Promise.all([
                    upsertDailyImpression(admin, c.id, today, 1),
                    incrementCampaignImpressions(admin, c.id, 1),
                ]),
            );
            // Fire and forget - don't block the response
            Promise.all(impressionPromises).catch((err) => {
                console.error("[Ad] Failed to track impressions:", err);
            });
        }
    }

    return banners;
}

/**
 * 배너 클릭 추적
 */
export async function trackBannerClick(
    _supabase: SupabaseClient<Database>,
    campaignId: string,
    creativeId: string,
    metadata: { userId?: string; ipAddress?: string; userAgent?: string },
): Promise<void> {
    const admin = createSupabaseAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    // Verify campaign exists
    const campaign = await getCampaignById(admin, campaignId);
    if (!campaign) {
        throw notFound("캠페인을 찾을 수 없습니다.");
    }

    const creative = await getCreativeById(admin, creativeId);
    if (!creative) {
        throw notFound("크리에이티브를 찾을 수 없습니다.");
    }
    if (creative.campaign_id !== campaignId) {
        throw badRequest("캠페인과 크리에이티브가 일치하지 않습니다.");
    }
    if (!creative.is_active) {
        throw badRequest("비활성화된 크리에이티브입니다.");
    }

    await Promise.all([
        insertClickLog(admin, {
            campaignId,
            creativeId,
            userId: metadata.userId,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
        }),
        incrementDailyClicks(admin, campaignId, today),
        incrementCampaignClicks(admin, campaignId),
    ]);
}

/**
 * 관리자: 캠페인 생성
 */
export async function createAdCampaign(
    _supabase: SupabaseClient<Database>,
    userId: string,
    payload: {
        adSlotId: string;
        vendorId?: string;
        advertiserName: string;
        startsAt: string;
        endsAt: string;
        monthlyPrice: number;
        creatives: {
            type?: string;
            title: string;
            imageUrl?: string;
            clickUrl: string;
            htmlContent?: string;
        }[];
    },
): Promise<AdCampaign> {
    const admin = createSupabaseAdminClient();

    // Validate slot exists and is active
    const slot = await getSlotById(admin, payload.adSlotId);
    if (!slot) {
        throw notFound("광고 슬롯을 찾을 수 없습니다.");
    }
    if (!slot.is_active) {
        throw badRequest("비활성화된 광고 슬롯입니다.");
    }

    const startsAtDate = new Date(payload.startsAt);
    const endsAtDate = new Date(payload.endsAt);
    if (endsAtDate <= startsAtDate) {
        throw badRequest("종료일은 시작일보다 늦어야 합니다.");
    }

    // Check slot capacity with overlapping periods
    const overlapCount = await countOverlappingCampaigns(admin, {
        slotId: payload.adSlotId,
        startsAt: payload.startsAt,
        endsAt: payload.endsAt,
    });
    if (overlapCount >= slot.max_campaigns) {
        throw conflict(`이 슬롯의 최대 캠페인 수(${slot.max_campaigns})를 초과했습니다.`);
    }

    const campaign = await createCampaign(admin, {
        ...payload,
        createdBy: userId,
    });

    return mapAdCampaignRow(campaign);
}

/**
 * 관리자: 캠페인 수정
 */
export async function updateAdCampaign(
    _supabase: SupabaseClient<Database>,
    id: string,
    payload: {
        status?: string;
        advertiserName?: string;
        startsAt?: string;
        endsAt?: string;
        monthlyPrice?: number;
        vendorId?: string | null;
    },
): Promise<AdCampaign> {
    const admin = createSupabaseAdminClient();

    const existing = await getCampaignById(admin, id);
    if (!existing) {
        throw notFound("캠페인을 찾을 수 없습니다.");
    }

    const startsAt = payload.startsAt ?? existing.starts_at;
    const endsAt = payload.endsAt ?? existing.ends_at;
    if (new Date(endsAt) <= new Date(startsAt)) {
        throw badRequest("종료일은 시작일보다 늦어야 합니다.");
    }

    const nextStatus = payload.status ?? existing.status;
    if (nextStatus !== "completed" && nextStatus !== "canceled") {
        const slot = await getSlotById(admin, existing.ad_slot_id);
        if (!slot) {
            throw internalServerError("캠페인에 연결된 슬롯을 찾을 수 없습니다.");
        }

        const overlapCount = await countOverlappingCampaigns(admin, {
            slotId: existing.ad_slot_id,
            startsAt,
            endsAt,
            excludeCampaignId: existing.id,
        });
        if (overlapCount >= slot.max_campaigns) {
            throw conflict(`이 슬롯의 최대 캠페인 수(${slot.max_campaigns})를 초과했습니다.`);
        }
    }

    const updated = await updateCampaign(admin, id, payload);
    return mapAdCampaignRow(updated);
}

/**
 * 관리자: 캠페인 목록 조회 (페이지네이션)
 */
export async function getAdCampaignList(
    _supabase: SupabaseClient<Database>,
    params: { page: number; pageSize: number; status?: string },
): Promise<{ items: AdCampaign[]; page: number; pageSize: number; total: number }> {
    const admin = createSupabaseAdminClient();

    const { rows, total } = await listCampaigns(admin, params);

    return {
        items: rows.map(mapAdCampaignRow),
        page: params.page,
        pageSize: params.pageSize,
        total,
    };
}

/**
 * 관리자: 캠페인 상세 조회 (캠페인 + 크리에이티브 + 슬롯)
 */
export async function getAdCampaignDetail(
    _supabase: SupabaseClient<Database>,
    id: string,
): Promise<{ campaign: AdCampaign; creatives: AdCreative[]; slot: AdSlot }> {
    const admin = createSupabaseAdminClient();

    const campaign = await getCampaignById(admin, id);
    if (!campaign) {
        throw notFound("캠페인을 찾을 수 없습니다.");
    }

    const [creativeRows, slot] = await Promise.all([
        getCreativesByCampaignId(admin, id),
        getSlotById(admin, campaign.ad_slot_id),
    ]);

    if (!slot) {
        throw internalServerError("캠페인에 연결된 슬롯을 찾을 수 없습니다.");
    }

    return {
        campaign: mapAdCampaignRow(campaign),
        creatives: creativeRows.map(mapAdCreativeRow),
        slot: mapAdSlotRow(slot),
    };
}

/**
 * 관리자: 광고 리포트 조회
 */
export async function getAdReport(
    _supabase: SupabaseClient<Database>,
    params: { page: number; pageSize: number; startDate?: string; endDate?: string; campaignId?: string },
): Promise<{
    items: { campaignId: string; advertiserName: string; totalImpressions: number; totalClicks: number; ctr: number }[];
    page: number;
    pageSize: number;
    total: number;
}> {
    const admin = createSupabaseAdminClient();

    const { rows, total } = await getAdReportRepo(admin, params);

    return {
        items: rows.map((r) => {
            const impressions = r.total_impressions;
            const clicks = r.total_clicks;
            const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
            return {
                campaignId: r.campaign_id,
                advertiserName: r.advertiser_name,
                totalImpressions: impressions,
                totalClicks: clicks,
                ctr,
            };
        }),
        page: params.page,
        pageSize: params.pageSize,
        total,
    };
}
