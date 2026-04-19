import type {
    AdminAdReportQuery,
    AdminAdReportResponse,
    AdminCampaignCreateBody,
    AdminCampaignCreateResponse,
    AdminCampaignDetailResponse,
    AdminCampaignListQuery,
    AdminCampaignListResponse,
    AdminCampaignPatchBody,
    AdminPriorityReportResponse,
    BannerClickBody,
    BannerClickResponse,
    BannerListQuery,
    BannerListResponse,
    JumpupResponse,
    PriorityPrepareResponse,
    PriorityPurchaseBody,
    PrioritySlotListQuery,
    PrioritySlotListResponse,
    PriorityVendorListResponse,
    VendorAdsQuery,
    VendorAdsResponse,
} from "@/lib/schema/ad";
import type { ApiSuccessResponse } from "@/lib/api/types";
import api from "./client";

export const adsApi = {
    // ============================================
    // Public: Banners
    // ============================================

    getBanners: async (params?: Partial<BannerListQuery>): Promise<BannerListResponse> => {
        const response = await api.get<BannerListResponse>("/api/ads/banners", { params });
        return response.data;
    },

    trackClick: async (campaignId: string, body: BannerClickBody): Promise<BannerClickResponse> => {
        const response = await api.post<BannerClickResponse>(
            `/api/ads/banners/${campaignId}/click`,
            body,
        );
        return response.data;
    },

    // ============================================
    // Public: Priority
    // ============================================

    getPriorityVendors: async (params: PrioritySlotListQuery): Promise<PriorityVendorListResponse> => {
        const response = await api.get<PriorityVendorListResponse>("/api/ads/priority", { params });
        return response.data;
    },

    getPrioritySlots: async (params: PrioritySlotListQuery): Promise<PrioritySlotListResponse> => {
        const response = await api.get<PrioritySlotListResponse>("/api/ads/priority", {
            params: { ...params, view: "slots" },
        });
        return response.data;
    },

    // ============================================
    // Vendor
    // ============================================

    /** 토스 즉시결제 준비 (우선순위 슬롯) */
    preparePrioritySlot: async (
        body: PriorityPurchaseBody,
    ): Promise<ApiSuccessResponse<PriorityPrepareResponse>> => {
        const response = await api.post<ApiSuccessResponse<PriorityPrepareResponse>>(
            "/api/ads/priority/prepare",
            body,
        );
        return response.data;
    },

    activateJumpup: async (purchaseId: string): Promise<JumpupResponse> => {
        const response = await api.post<JumpupResponse>(
            `/api/ads/priority/${purchaseId}/jumpup`,
        );
        return response.data;
    },

    getVendorAds: async (params?: Partial<VendorAdsQuery>): Promise<VendorAdsResponse> => {
        const response = await api.get<VendorAdsResponse>("/api/vendors/me/ads", { params });
        return response.data;
    },

    // ============================================
    // Admin: Slots
    // ============================================

    getAdminSlots: async (): Promise<{ code: string; data: { items: { id: string; name: string; position: string; maxCampaigns: number }[] } }> => {
        const response = await api.get("/api/admin/ads/slots");
        return response.data;
    },

    // Admin: Campaigns
    // ============================================

    getAdminCampaigns: async (params?: Partial<AdminCampaignListQuery>): Promise<AdminCampaignListResponse> => {
        const response = await api.get<AdminCampaignListResponse>("/api/admin/ads/campaigns", {
            params,
        });
        return response.data;
    },

    createAdminCampaign: async (body: AdminCampaignCreateBody): Promise<AdminCampaignCreateResponse> => {
        const response = await api.post<AdminCampaignCreateResponse>(
            "/api/admin/ads/campaigns",
            body,
        );
        return response.data;
    },

    getAdminCampaign: async (id: string): Promise<AdminCampaignDetailResponse> => {
        const response = await api.get<AdminCampaignDetailResponse>(
            `/api/admin/ads/campaigns/${id}`,
        );
        return response.data;
    },

    updateAdminCampaign: async (
        id: string,
        body: AdminCampaignPatchBody,
    ): Promise<AdminCampaignListResponse> => {
        const response = await api.patch<AdminCampaignListResponse>(
            `/api/admin/ads/campaigns/${id}`,
            body,
        );
        return response.data;
    },

    // ============================================
    // Admin: Reports
    // ============================================

    getAdminReport: async (params?: Partial<AdminAdReportQuery>): Promise<AdminAdReportResponse> => {
        const response = await api.get<AdminAdReportResponse>("/api/admin/ads/reports", { params });
        return response.data;
    },

    getAdminPriority: async (): Promise<AdminPriorityReportResponse> => {
        const response = await api.get<AdminPriorityReportResponse>("/api/admin/ads/priority");
        return response.data;
    },
};
