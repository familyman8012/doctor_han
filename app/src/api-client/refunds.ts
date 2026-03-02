import type {
    CreateRefundRequestBody,
    RefundRequestListQuery,
    RefundRequestListResponse,
    RefundRequestResponse,
    ReviewRefundRequestBody,
} from "@/lib/schema/refund";
import api from "./client";

export const refundsApi = {
    list: async (params?: Partial<RefundRequestListQuery>): Promise<RefundRequestListResponse> => {
        const response = await api.get<RefundRequestListResponse>("/api/refunds", { params });
        return response.data;
    },

    create: async (body: CreateRefundRequestBody): Promise<RefundRequestResponse> => {
        const response = await api.post<RefundRequestResponse>("/api/refunds", body);
        return response.data;
    },

    adminList: async (params?: Partial<RefundRequestListQuery>): Promise<RefundRequestListResponse> => {
        const response = await api.get<RefundRequestListResponse>("/api/admin/refunds", { params });
        return response.data;
    },

    adminReview: async (id: string, body: ReviewRefundRequestBody): Promise<RefundRequestResponse> => {
        const response = await api.patch<RefundRequestResponse>(`/api/admin/refunds/${id}`, body);
        return response.data;
    },
};
