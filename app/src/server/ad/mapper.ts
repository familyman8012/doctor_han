import type { AdCampaign, AdCreative, AdSlot } from "@/lib/schema/ad";

export type AdSlotRow = {
    id: string;
    position: string;
    name: string;
    max_campaigns: number;
    display_count: number;
    price_monthly: number;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
};

export type AdCampaignRow = {
    id: string;
    ad_slot_id: string;
    vendor_id: string | null;
    advertiser_name: string;
    status: string;
    starts_at: string;
    ends_at: string;
    monthly_price: number;
    total_impressions: number;
    total_clicks: number;
    created_by: string;
    created_at: string;
    updated_at: string;
};

export type AdCreativeRow = {
    id: string;
    campaign_id: string;
    type: string;
    title: string;
    image_url: string | null;
    click_url: string;
    html_content: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
};

export type AdImpressionRow = {
    id: string;
    campaign_id: string;
    date: string;
    impressions: number;
    clicks: number;
    created_at: string;
    updated_at: string;
};

export function mapAdSlotRow(row: AdSlotRow): AdSlot {
    return {
        id: row.id,
        position: row.position as AdSlot["position"],
        name: row.name,
        maxCampaigns: row.max_campaigns,
        displayCount: row.display_count,
        priceMonthly: row.price_monthly,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapAdCampaignRow(row: AdCampaignRow): AdCampaign {
    return {
        id: row.id,
        adSlotId: row.ad_slot_id,
        vendorId: row.vendor_id,
        advertiserName: row.advertiser_name,
        status: row.status as AdCampaign["status"],
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        monthlyPrice: row.monthly_price,
        totalImpressions: row.total_impressions,
        totalClicks: row.total_clicks,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapAdCreativeRow(row: AdCreativeRow): AdCreative {
    return {
        id: row.id,
        campaignId: row.campaign_id,
        type: row.type as AdCreative["type"],
        title: row.title,
        imageUrl: row.image_url,
        clickUrl: row.click_url,
        htmlContent: row.html_content,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
