import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdCampaignRow, AdCreativeRow, AdSlotRow } from "./mapper";

export async function listActiveSlots(
    supabase: SupabaseClient<Database>,
): Promise<AdSlotRow[]> {
    const { data, error } = await supabase
        .from("ad_slots")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (error) {
        throw internalServerError("광고 슬롯을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as AdSlotRow[];
}

export async function getSlotById(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<AdSlotRow | null> {
    const { data, error } = await supabase
        .from("ad_slots")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw internalServerError("광고 슬롯을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as AdSlotRow) ?? null;
}

export async function listActiveCampaignsBySlot(
    supabase: SupabaseClient<Database>,
    slotId: string,
): Promise<(AdCampaignRow & { creatives: AdCreativeRow[] })[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*, ad_creatives(*)")
        .eq("ad_slot_id", slotId)
        .eq("status", "active")
        .lte("starts_at", now)
        .gt("ends_at", now);

    if (error) {
        throw internalServerError("활성 캠페인을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return ((data ?? []) as unknown as (AdCampaignRow & { ad_creatives: AdCreativeRow[] })[]).map(
        (row) => ({
            ...row,
            creatives: (row.ad_creatives ?? []).filter((c: AdCreativeRow) => c.is_active),
            ad_creatives: undefined,
        }),
    ) as (AdCampaignRow & { creatives: AdCreativeRow[] })[];
}

export async function listCampaigns(
    supabase: SupabaseClient<Database>,
    params: { page: number; pageSize: number; status?: string },
): Promise<{ rows: AdCampaignRow[]; total: number }> {
    let countQuery = supabase
        .from("ad_campaigns")
        .select("*", { count: "exact", head: true });

    if (params.status) {
        countQuery = countQuery.eq("status", params.status as Database["public"]["Enums"]["ad_campaign_status"]);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
        throw internalServerError("캠페인 개수를 조회할 수 없습니다.", {
            message: countError.message,
            code: countError.code,
        });
    }

    const total = count ?? 0;
    const offset = (params.page - 1) * params.pageSize;

    let dataQuery = supabase
        .from("ad_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + params.pageSize - 1);

    if (params.status) {
        dataQuery = dataQuery.eq("status", params.status as Database["public"]["Enums"]["ad_campaign_status"]);
    }

    const { data, error: dataError } = await dataQuery;

    if (dataError) {
        throw internalServerError("캠페인 목록을 조회할 수 없습니다.", {
            message: dataError.message,
            code: dataError.code,
        });
    }

    return { rows: (data ?? []) as AdCampaignRow[], total };
}

export async function getCampaignById(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<AdCampaignRow | null> {
    const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw internalServerError("캠페인을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as AdCampaignRow) ?? null;
}

export async function getCreativesByCampaignId(
    supabase: SupabaseClient<Database>,
    campaignId: string,
): Promise<AdCreativeRow[]> {
    const { data, error } = await supabase
        .from("ad_creatives")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("sort_order", { ascending: true });

    if (error) {
        throw internalServerError("크리에이티브를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as AdCreativeRow[];
}

export async function getCreativeById(
    supabase: SupabaseClient<Database>,
    creativeId: string,
): Promise<AdCreativeRow | null> {
    const { data, error } = await supabase
        .from("ad_creatives")
        .select("*")
        .eq("id", creativeId)
        .maybeSingle();

    if (error) {
        throw internalServerError("크리에이티브를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as AdCreativeRow) ?? null;
}

export async function createCampaign(
    supabase: SupabaseClient<Database>,
    payload: {
        adSlotId: string;
        vendorId?: string;
        advertiserName: string;
        status?: string;
        startsAt: string;
        endsAt: string;
        monthlyPrice: number;
        createdBy: string;
        creatives: {
            type?: string;
            title: string;
            imageUrl?: string;
            clickUrl: string;
            htmlContent?: string;
        }[];
    },
): Promise<AdCampaignRow> {
    // Insert campaign
    const { data: campaign, error: campaignError } = await supabase
        .from("ad_campaigns")
        .insert({
            ad_slot_id: payload.adSlotId,
            vendor_id: payload.vendorId ?? null,
            advertiser_name: payload.advertiserName,
            status: (payload.status ?? "draft") as Database["public"]["Enums"]["ad_campaign_status"],
            starts_at: payload.startsAt,
            ends_at: payload.endsAt,
            monthly_price: payload.monthlyPrice,
            created_by: payload.createdBy,
        })
        .select("*")
        .single();

    if (campaignError || !campaign) {
        throw internalServerError("캠페인을 생성할 수 없습니다.", {
            message: campaignError?.message,
            code: campaignError?.code,
        });
    }

    // Insert creatives
    if (payload.creatives.length > 0) {
        const { error: creativesError } = await supabase.from("ad_creatives").insert(
            payload.creatives.map((c, idx) => ({
                campaign_id: campaign.id,
                type: (c.type ?? "image") as Database["public"]["Enums"]["ad_creative_type"],
                title: c.title,
                image_url: c.imageUrl ?? null,
                click_url: c.clickUrl,
                html_content: c.htmlContent ?? null,
                sort_order: idx,
            })),
        );

        if (creativesError) {
            throw internalServerError("크리에이티브를 생성할 수 없습니다.", {
                message: creativesError.message,
                code: creativesError.code,
            });
        }
    }

    return campaign as AdCampaignRow;
}

export async function updateCampaign(
    supabase: SupabaseClient<Database>,
    id: string,
    payload: {
        status?: string;
        advertiserName?: string;
        startsAt?: string;
        endsAt?: string;
        monthlyPrice?: number;
        vendorId?: string | null;
    },
): Promise<AdCampaignRow> {
    const updateData: Database["public"]["Tables"]["ad_campaigns"]["Update"] = {
        updated_at: new Date().toISOString(),
    };

    if (payload.status !== undefined) {
        updateData.status = payload.status as Database["public"]["Enums"]["ad_campaign_status"];
    }
    if (payload.advertiserName !== undefined) {
        updateData.advertiser_name = payload.advertiserName;
    }
    if (payload.startsAt !== undefined) {
        updateData.starts_at = payload.startsAt;
    }
    if (payload.endsAt !== undefined) {
        updateData.ends_at = payload.endsAt;
    }
    if (payload.monthlyPrice !== undefined) {
        updateData.monthly_price = payload.monthlyPrice;
    }
    if (payload.vendorId !== undefined) {
        updateData.vendor_id = payload.vendorId;
    }

    const { data, error } = await supabase
        .from("ad_campaigns")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("캠페인을 수정할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as AdCampaignRow;
}

export async function countOverlappingCampaigns(
    supabase: SupabaseClient<Database>,
    params: {
        slotId: string;
        startsAt: string;
        endsAt: string;
        excludeCampaignId?: string;
    },
): Promise<number> {
    const { data, error } = await supabase
        .from("ad_campaigns")
        .select("id, status")
        .eq("ad_slot_id", params.slotId)
        .lt("starts_at", params.endsAt)
        .gt("ends_at", params.startsAt);

    if (error) {
        throw internalServerError("슬롯 중복 캠페인을 확인할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    type CampaignOverlapRow = {
        id: string;
        status: Database["public"]["Enums"]["ad_campaign_status"];
    };
    const rows = (data ?? []) as CampaignOverlapRow[];

    const unavailableCount = rows.filter((row) => {
        if (params.excludeCampaignId && row.id === params.excludeCampaignId) {
            return false;
        }
        return row.status !== "completed" && row.status !== "canceled";
    }).length;

    return unavailableCount;
}

export async function upsertDailyImpression(
    supabase: SupabaseClient<Database>,
    campaignId: string,
    date: string,
    count: number,
): Promise<void> {
    const { error } = await supabase.rpc("upsert_ad_impression" as never, {
        p_campaign_id: campaignId,
        p_date: date,
        p_impressions: count,
    } as never);

    // Fallback: If RPC doesn't exist, try direct upsert
    if (error) {
        const { data: existing } = await supabase
            .from("ad_impressions")
            .select("id, impressions")
            .eq("campaign_id", campaignId)
            .eq("date", date)
            .maybeSingle();

        if (existing) {
            const row = existing as { id: string; impressions: number };
            await supabase
                .from("ad_impressions")
                .update({
                    impressions: row.impressions + count,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", row.id);
        } else {
            await supabase.from("ad_impressions").insert({
                campaign_id: campaignId,
                date,
                impressions: count,
                clicks: 0,
            });
        }
    }
}

export async function incrementDailyClicks(
    supabase: SupabaseClient<Database>,
    campaignId: string,
    date: string,
): Promise<void> {
    const { data: existing } = await supabase
        .from("ad_impressions")
        .select("id, clicks")
        .eq("campaign_id", campaignId)
        .eq("date", date)
        .maybeSingle();

    if (existing) {
        const row = existing as { id: string; clicks: number };
        await supabase
            .from("ad_impressions")
            .update({
                clicks: row.clicks + 1,
                updated_at: new Date().toISOString(),
            })
            .eq("id", row.id);
    } else {
        await supabase.from("ad_impressions").insert({
            campaign_id: campaignId,
            date,
            impressions: 0,
            clicks: 1,
        });
    }
}

export async function insertClickLog(
    supabase: SupabaseClient<Database>,
    payload: {
        campaignId: string;
        creativeId: string;
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
    },
): Promise<void> {
    const { error } = await supabase.from("ad_click_logs").insert({
        campaign_id: payload.campaignId,
        creative_id: payload.creativeId,
        user_id: payload.userId ?? null,
        ip_address: payload.ipAddress ?? null,
        user_agent: payload.userAgent ?? null,
    });

    if (error) {
        throw internalServerError("클릭 로그를 기록할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }
}

export async function incrementCampaignImpressions(
    supabase: SupabaseClient<Database>,
    campaignId: string,
    count: number,
): Promise<void> {
    // Get current value and increment
    const { data: campaign, error: getError } = await supabase
        .from("ad_campaigns")
        .select("total_impressions")
        .eq("id", campaignId)
        .single();

    if (getError || !campaign) return;

    const row = campaign as { total_impressions: number };
    const { error } = await supabase
        .from("ad_campaigns")
        .update({
            total_impressions: row.total_impressions + count,
            updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

    if (error) {
        // Non-critical: log but don't throw
        console.error("[Ad] Failed to increment campaign impressions:", error.message);
    }
}

export async function incrementCampaignClicks(
    supabase: SupabaseClient<Database>,
    campaignId: string,
): Promise<void> {
    const { data: campaign, error: getError } = await supabase
        .from("ad_campaigns")
        .select("total_clicks")
        .eq("id", campaignId)
        .single();

    if (getError || !campaign) return;

    const row = campaign as { total_clicks: number };
    const { error } = await supabase
        .from("ad_campaigns")
        .update({
            total_clicks: row.total_clicks + 1,
            updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

    if (error) {
        console.error("[Ad] Failed to increment campaign clicks:", error.message);
    }
}

export async function getAdReport(
    supabase: SupabaseClient<Database>,
    params: {
        page: number;
        pageSize: number;
        startDate?: string;
        endDate?: string;
        campaignId?: string;
    },
): Promise<{
    rows: { campaign_id: string; advertiser_name: string; total_impressions: number; total_clicks: number }[];
    total: number;
}> {
    let countQuery = supabase
        .from("ad_campaigns")
        .select("*", { count: "exact", head: true });

    if (params.campaignId) {
        countQuery = countQuery.eq("id", params.campaignId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
        throw internalServerError("리포트 개수를 조회할 수 없습니다.", {
            message: countError.message,
            code: countError.code,
        });
    }

    const total = count ?? 0;
    const offset = (params.page - 1) * params.pageSize;

    let campaignsQuery = supabase
        .from("ad_campaigns")
        .select("id, advertiser_name")
        .order("created_at", { ascending: false })
        .range(offset, offset + params.pageSize - 1);

    if (params.campaignId) {
        campaignsQuery = campaignsQuery.eq("id", params.campaignId);
    }

    const { data: campaignsData, error: campaignsError } = await campaignsQuery;

    if (campaignsError) {
        throw internalServerError("리포트를 조회할 수 없습니다.", {
            message: campaignsError.message,
            code: campaignsError.code,
        });
    }

    type CampaignBaseRow = { id: string; advertiser_name: string };
    const campaigns = (campaignsData ?? []) as CampaignBaseRow[];

    if (campaigns.length === 0) {
        return { rows: [], total };
    }

    const campaignIds = campaigns.map((campaign) => campaign.id);

    let impressionsQuery = supabase
        .from("ad_impressions")
        .select("campaign_id, date, impressions, clicks")
        .in("campaign_id", campaignIds);

    if (params.startDate) {
        impressionsQuery = impressionsQuery.gte("date", params.startDate);
    }
    if (params.endDate) {
        impressionsQuery = impressionsQuery.lte("date", params.endDate);
    }

    const { data: impressionsData, error: impressionsError } = await impressionsQuery;

    if (impressionsError) {
        throw internalServerError("리포트 집계를 조회할 수 없습니다.", {
            message: impressionsError.message,
            code: impressionsError.code,
        });
    }

    type ImpressionAggregateRow = {
        campaign_id: string;
        impressions: number;
        clicks: number;
    };
    const aggregateByCampaign = new Map<string, { totalImpressions: number; totalClicks: number }>();

    for (const row of (impressionsData ?? []) as ImpressionAggregateRow[]) {
        const existing = aggregateByCampaign.get(row.campaign_id) ?? { totalImpressions: 0, totalClicks: 0 };
        existing.totalImpressions += row.impressions;
        existing.totalClicks += row.clicks;
        aggregateByCampaign.set(row.campaign_id, existing);
    }

    const rows = campaigns.map((campaign) => {
        const aggregate = aggregateByCampaign.get(campaign.id) ?? { totalImpressions: 0, totalClicks: 0 };
        return {
            campaign_id: campaign.id,
            advertiser_name: campaign.advertiser_name,
            total_impressions: aggregate.totalImpressions,
            total_clicks: aggregate.totalClicks,
        };
    });

    return { rows, total };
}
