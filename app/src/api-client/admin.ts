import type {
    AdminVerificationListQuery,
    AdminVerificationListResponse,
    AdminVerificationApproveBody,
    AdminVerificationRejectBody,
    AdminVerificationActionResponse,
    AdminUserListQuery,
    AdminUserListResponse,
    AdminVendorListQuery,
    AdminVendorListResponse,
    AdminCategoryCreateBody,
    AdminCategoryPatchBody,
    AdminCategoryResponse,
    AdminCategoryDeleteResponse,
} from "@/lib/schema/admin";
import type { CategoryListResponse } from "@/lib/schema/category";
import type {
    AdminReportListQuery,
    AdminReportListResponse,
    AdminReportDetailResponse,
    AdminReportActionResponse,
    AdminReportResolveBody,
    AdminReportDismissBody,
    AdminSanctionListQuery,
    AdminSanctionListResponse,
    AdminSanctionActionResponse,
    AdminSanctionRevokeBody,
} from "@/lib/schema/report";
import type {
    AdminSupportTicketListQuery,
    AdminSupportTicketListResponse,
    AdminSupportTicketDetailResponse,
    AdminTicketStatusChangeBody,
    SupportMessageCreateBody,
    SupportMessageCreateResponse,
} from "@/lib/schema/support";
import api from "./client";

export const adminApi = {
    // 인증 요청 목록 조회
    getVerifications: async (params: AdminVerificationListQuery): Promise<AdminVerificationListResponse> => {
        const response = await api.get<AdminVerificationListResponse>("/api/admin/verifications", { params });
        return response.data;
    },

    // 인증 승인
    approveVerification: async (
        id: string,
        body?: AdminVerificationApproveBody,
    ): Promise<AdminVerificationActionResponse> => {
        const response = await api.post<AdminVerificationActionResponse>(
            `/api/admin/verifications/${id}/approve`,
            body ?? {},
        );
        return response.data;
    },

    // 인증 반려
    rejectVerification: async (
        id: string,
        body: AdminVerificationRejectBody,
    ): Promise<AdminVerificationActionResponse> => {
        const response = await api.post<AdminVerificationActionResponse>(
            `/api/admin/verifications/${id}/reject`,
            body,
        );
        return response.data;
    },

    // 사용자 목록 조회
    getUsers: async (params?: Partial<AdminUserListQuery>): Promise<AdminUserListResponse> => {
        const response = await api.get<AdminUserListResponse>("/api/admin/users", { params });
        return response.data;
    },

    // 업체 목록 조회
    getVendors: async (params?: Partial<AdminVendorListQuery>): Promise<AdminVendorListResponse> => {
        const response = await api.get<AdminVendorListResponse>("/api/admin/vendors", { params });
        return response.data;
    },

    // 카테고리 목록 조회
    getCategories: async (): Promise<CategoryListResponse> => {
        const response = await api.get<CategoryListResponse>("/api/categories");
        return response.data;
    },

    // 카테고리 생성
    createCategory: async (body: AdminCategoryCreateBody): Promise<AdminCategoryResponse> => {
        const response = await api.post<AdminCategoryResponse>("/api/admin/categories", body);
        return response.data;
    },

    // 카테고리 수정
    updateCategory: async (id: string, body: AdminCategoryPatchBody): Promise<AdminCategoryResponse> => {
        const response = await api.patch<AdminCategoryResponse>(`/api/admin/categories/${id}`, body);
        return response.data;
    },

    // 카테고리 삭제
    deleteCategory: async (id: string): Promise<AdminCategoryDeleteResponse> => {
        const response = await api.delete<AdminCategoryDeleteResponse>(`/api/admin/categories/${id}`);
        return response.data;
    },

    // ===========================
    // 신고 관리
    // ===========================

    // 신고 목록 조회
    getReports: async (params: AdminReportListQuery): Promise<AdminReportListResponse> => {
        const response = await api.get<AdminReportListResponse>("/api/admin/reports", { params });
        return response.data;
    },

    // 신고 상세 조회
    getReport: async (id: string): Promise<AdminReportDetailResponse> => {
        const response = await api.get<AdminReportDetailResponse>(`/api/admin/reports/${id}`);
        return response.data;
    },

    // 신고 심사 시작
    reviewReport: async (id: string): Promise<AdminReportActionResponse> => {
        const response = await api.post<AdminReportActionResponse>(`/api/admin/reports/${id}/review`);
        return response.data;
    },

    // 신고 처리 완료
    resolveReport: async (id: string, body: AdminReportResolveBody): Promise<AdminReportActionResponse> => {
        const response = await api.post<AdminReportActionResponse>(`/api/admin/reports/${id}/resolve`, body);
        return response.data;
    },

    // 신고 기각
    dismissReport: async (id: string, body: AdminReportDismissBody): Promise<AdminReportActionResponse> => {
        const response = await api.post<AdminReportActionResponse>(`/api/admin/reports/${id}/dismiss`, body);
        return response.data;
    },

    // ===========================
    // 제재 관리
    // ===========================

    // 제재 목록 조회
    getSanctions: async (params: AdminSanctionListQuery): Promise<AdminSanctionListResponse> => {
        const response = await api.get<AdminSanctionListResponse>("/api/admin/sanctions", { params });
        return response.data;
    },

    // 제재 해제
    revokeSanction: async (id: string, body: AdminSanctionRevokeBody): Promise<AdminSanctionActionResponse> => {
        const response = await api.post<AdminSanctionActionResponse>(`/api/admin/sanctions/${id}/revoke`, body);
        return response.data;
    },

    // ===========================
    // 고객지원 관리
    // ===========================

    // 고객지원 티켓 목록 조회
    getSupportTickets: async (params: AdminSupportTicketListQuery): Promise<AdminSupportTicketListResponse> => {
        const response = await api.get<AdminSupportTicketListResponse>("/api/admin/support/tickets", { params });
        return response.data;
    },

    // 고객지원 티켓 상세 조회
    getSupportTicket: async (id: string): Promise<AdminSupportTicketDetailResponse> => {
        const response = await api.get<AdminSupportTicketDetailResponse>(`/api/admin/support/tickets/${id}`);
        return response.data;
    },

    // 고객지원 티켓 상태 변경
    changeSupportTicketStatus: async (
        id: string,
        body: AdminTicketStatusChangeBody,
    ): Promise<AdminSupportTicketDetailResponse> => {
        const response = await api.patch<AdminSupportTicketDetailResponse>(
            `/api/admin/support/tickets/${id}/status`,
            body,
        );
        return response.data;
    },

    // 고객지원 메시지 발송 (관리자)
    sendSupportMessage: async (ticketId: string, body: SupportMessageCreateBody): Promise<SupportMessageCreateResponse> => {
        const response = await api.post<SupportMessageCreateResponse>(
            `/api/admin/support/tickets/${ticketId}/messages`,
            body,
        );
        return response.data;
    },
};
