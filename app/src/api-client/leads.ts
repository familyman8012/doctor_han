import type {
    LeadCreateBody,
    LeadDetailResponse,
    LeadListQuery,
    LeadListResponse,
    LeadMessageCreateBody,
    LeadMessageReadPatchBody,
    LeadMessageResponse,
    LeadMessagesListQuery,
    LeadMessagesListResponse,
    LeadStatus,
} from "@/lib/schema/lead";
import api from "./client";

export const leadsApi = {
    // 리드 목록 조회
    list: async (params?: Partial<LeadListQuery>): Promise<LeadListResponse> => {
        const response = await api.get<LeadListResponse>("/api/leads", { params });
        return response.data;
    },

    // 리드 생성
    create: async (payload: LeadCreateBody): Promise<LeadDetailResponse> => {
        const response = await api.post<LeadDetailResponse>("/api/leads", payload);
        return response.data;
    },

    // 리드 상세 조회
    getDetail: async (id: string): Promise<LeadDetailResponse> => {
        const response = await api.get<LeadDetailResponse>(`/api/leads/${id}`);
        return response.data;
    },

    // 리드 상태 변경
    updateStatus: async (id: string, status: LeadStatus): Promise<LeadDetailResponse> => {
        const response = await api.patch<LeadDetailResponse>(`/api/leads/${id}/status`, { status });
        return response.data;
    },

    // 메시지 목록 조회
    getMessages: async (
        leadId: string,
        params?: Partial<LeadMessagesListQuery>,
    ): Promise<LeadMessagesListResponse> => {
        const response = await api.get<LeadMessagesListResponse>(
            `/api/leads/${leadId}/messages`,
            { params },
        );
        return response.data;
    },

    // 메시지 발송
    sendMessage: async (
        leadId: string,
        payload: LeadMessageCreateBody,
    ): Promise<LeadMessageResponse> => {
        const response = await api.post<LeadMessageResponse>(
            `/api/leads/${leadId}/messages`,
            payload,
        );
        return response.data;
    },

    // 메시지 읽음 표시
    markMessagesAsRead: async (
        leadId: string,
        payload: LeadMessageReadPatchBody,
    ): Promise<void> => {
        await api.patch(`/api/leads/${leadId}/messages/read`, payload);
    },
};
