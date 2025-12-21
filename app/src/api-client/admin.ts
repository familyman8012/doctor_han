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
};
