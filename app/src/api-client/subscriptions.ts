import type {
    SubscriptionAutoRenewBody,
    SubscriptionDetailResponse,
    SubscriptionListResponse,
    SubscriptionPlanListResponse,
    SubscriptionPurchaseBody,
    SubscriptionPurchaseResponse,
} from "@/lib/schema/subscription";
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

    purchase: async (body: SubscriptionPurchaseBody): Promise<SubscriptionPurchaseResponse> => {
        const response = await api.post<SubscriptionPurchaseResponse>(
            "/api/vendors/me/subscriptions",
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
