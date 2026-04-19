import type {
    SubscriptionAutoRenewBody,
    SubscriptionDetailResponse,
    SubscriptionListResponse,
    SubscriptionPlanListResponse,
    SubscriptionPrepareResponse,
    SubscriptionPurchaseBody,
} from "@/lib/schema/subscription";
import type { ApiSuccessResponse } from "@/lib/api/types";
import api from "./client";

export const subscriptionsApi = {
    listPlans: async (): Promise<SubscriptionPlanListResponse> => {
        const response = await api.get<SubscriptionPlanListResponse>(
            "/api/vendors/me/subscriptions/plans",
        );
        return response.data;
    },

    list: async (): Promise<SubscriptionListResponse> => {
        const response = await api.get<SubscriptionListResponse>(
            "/api/vendors/me/subscriptions",
        );
        return response.data;
    },

    getDetail: async (id: string): Promise<SubscriptionDetailResponse> => {
        const response = await api.get<SubscriptionDetailResponse>(
            `/api/vendors/me/subscriptions/${id}`,
        );
        return response.data;
    },

    /** 토스 즉시결제 준비 (orderId/clientKey 반환) */
    prepare: async (
        body: SubscriptionPurchaseBody,
    ): Promise<ApiSuccessResponse<SubscriptionPrepareResponse>> => {
        const response = await api.post<ApiSuccessResponse<SubscriptionPrepareResponse>>(
            "/api/vendors/me/subscriptions/prepare",
            body,
        );
        return response.data;
    },

    updateAutoRenew: async (
        id: string,
        body: SubscriptionAutoRenewBody,
    ): Promise<SubscriptionDetailResponse> => {
        const response = await api.patch<SubscriptionDetailResponse>(
            `/api/vendors/me/subscriptions/${id}`,
            body,
        );
        return response.data;
    },
};
