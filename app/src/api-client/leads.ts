import type {
    LeadCreateBody,
    LeadDetailResponse,
    LeadListQuery,
    LeadListResponse,
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
};
