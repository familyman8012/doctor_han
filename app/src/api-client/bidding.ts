import type {
    BidContractActionResponse,
    BidProjectCreateBody,
    BidProjectDetailResponse,
    BidProjectListQuery,
    BidProjectListResponse,
    BidProjectStatus,
    BidResponseActionResponse,
    BidResponseSubmitBody,
} from "@/lib/schema/bidding";
import api from "./client";

export const biddingApi = {
    // 프로젝트 생성
    create: async (payload: BidProjectCreateBody): Promise<BidProjectDetailResponse> => {
        const response = await api.post<BidProjectDetailResponse>("/api/bid/projects", payload);
        return response.data;
    },

    // 프로젝트 목록 조회
    list: async (params?: Partial<BidProjectListQuery>): Promise<BidProjectListResponse> => {
        const response = await api.get<BidProjectListResponse>("/api/bid/projects", { params });
        return response.data;
    },

    // 프로젝트 상세 조회
    getDetail: async (id: string): Promise<BidProjectDetailResponse> => {
        const response = await api.get<BidProjectDetailResponse>(`/api/bid/projects/${id}`);
        return response.data;
    },

    // 업체 선정
    selectVendor: async (projectId: string, vendorId: string): Promise<BidProjectDetailResponse> => {
        const response = await api.patch<BidProjectDetailResponse>(
            `/api/bid/projects/${projectId}/select`,
            { vendorId },
        );
        return response.data;
    },

    // 프로젝트 취소
    cancel: async (projectId: string): Promise<BidProjectDetailResponse> => {
        const response = await api.patch<BidProjectDetailResponse>(
            `/api/bid/projects/${projectId}/cancel`,
        );
        return response.data;
    },

    // 입찰 제출 (vendor)
    submitResponse: async (
        projectId: string,
        payload: BidResponseSubmitBody,
    ): Promise<BidResponseActionResponse> => {
        const response = await api.post<BidResponseActionResponse>(
            `/api/bid/projects/${projectId}/responses`,
            payload,
        );
        return response.data;
    },

    // 입찰 철회 (vendor)
    withdrawResponse: async (projectId: string): Promise<BidResponseActionResponse> => {
        const response = await api.patch<BidResponseActionResponse>(
            `/api/bid/projects/${projectId}/responses/withdraw`,
        );
        return response.data;
    },

    // Admin: 프로젝트 목록
    adminList: async (params?: Partial<BidProjectListQuery>): Promise<BidProjectListResponse> => {
        const response = await api.get<BidProjectListResponse>("/api/admin/bid-projects", { params });
        return response.data;
    },

    // Admin: 상태 변경
    adminUpdateStatus: async (
        projectId: string,
        status: BidProjectStatus,
    ): Promise<BidProjectDetailResponse> => {
        const response = await api.patch<BidProjectDetailResponse>(
            `/api/admin/bid-projects/${projectId}/status`,
            { status },
        );
        return response.data;
    },

    // Admin: 수수료 정산
    adminSettle: async (projectId: string): Promise<BidContractActionResponse> => {
        const response = await api.post<BidContractActionResponse>(
            `/api/admin/bid-projects/${projectId}/settle`,
        );
        return response.data;
    },
};
