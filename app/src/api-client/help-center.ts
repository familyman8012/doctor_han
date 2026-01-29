import type {
    HelpArticleListQuery,
    HelpArticleListResponse,
    HelpArticleDetailResponse,
    HelpCategoryListResponse,
    HelpCategoryDetailResponse,
    HelpCategoryDeleteResponse,
    HelpArticleDeleteResponse,
    AdminHelpArticleListQuery,
    HelpCategoryCreateBody,
    HelpCategoryPatchBody,
    HelpArticleCreateBody,
    HelpArticlePatchBody,
} from "@/lib/schema/help-center";
import api from "./client";

export const helpCenterApi = {
    // =====================
    // Public APIs
    // =====================

    // Get public categories (is_active = true)
    getPublicCategories: async (): Promise<HelpCategoryListResponse> => {
        const response = await api.get<HelpCategoryListResponse>("/api/help/categories");
        return response.data;
    },

    // Get public articles (is_published = true)
    getPublicArticles: async (params?: Partial<HelpArticleListQuery>): Promise<HelpArticleListResponse> => {
        const response = await api.get<HelpArticleListResponse>("/api/help/articles", { params });
        return response.data;
    },

    // Get public article detail (is_published = true)
    getPublicArticle: async (id: string): Promise<HelpArticleDetailResponse> => {
        const response = await api.get<HelpArticleDetailResponse>(`/api/help/articles/${id}`);
        return response.data;
    },

    // =====================
    // Admin APIs - Categories
    // =====================

    // Get admin categories (all)
    getAdminCategories: async (): Promise<HelpCategoryListResponse> => {
        const response = await api.get<HelpCategoryListResponse>("/api/admin/help-center/categories");
        return response.data;
    },

    // Create category
    createCategory: async (body: HelpCategoryCreateBody): Promise<HelpCategoryDetailResponse> => {
        const response = await api.post<HelpCategoryDetailResponse>("/api/admin/help-center/categories", body);
        return response.data;
    },

    // Update category
    updateCategory: async (id: string, body: HelpCategoryPatchBody): Promise<HelpCategoryDetailResponse> => {
        const response = await api.patch<HelpCategoryDetailResponse>(`/api/admin/help-center/categories/${id}`, body);
        return response.data;
    },

    // Delete category
    deleteCategory: async (id: string): Promise<HelpCategoryDeleteResponse> => {
        const response = await api.delete<HelpCategoryDeleteResponse>(`/api/admin/help-center/categories/${id}`);
        return response.data;
    },

    // =====================
    // Admin APIs - Articles
    // =====================

    // Get admin articles (all)
    getAdminArticles: async (params?: Partial<AdminHelpArticleListQuery>): Promise<HelpArticleListResponse> => {
        const response = await api.get<HelpArticleListResponse>("/api/admin/help-center/articles", { params });
        return response.data;
    },

    // Get admin article detail
    getAdminArticle: async (id: string): Promise<HelpArticleDetailResponse> => {
        const response = await api.get<HelpArticleDetailResponse>(`/api/admin/help-center/articles/${id}`);
        return response.data;
    },

    // Create article
    createArticle: async (body: HelpArticleCreateBody): Promise<HelpArticleDetailResponse> => {
        const response = await api.post<HelpArticleDetailResponse>("/api/admin/help-center/articles", body);
        return response.data;
    },

    // Update article
    updateArticle: async (id: string, body: HelpArticlePatchBody): Promise<HelpArticleDetailResponse> => {
        const response = await api.patch<HelpArticleDetailResponse>(`/api/admin/help-center/articles/${id}`, body);
        return response.data;
    },

    // Delete article
    deleteArticle: async (id: string): Promise<HelpArticleDeleteResponse> => {
        const response = await api.delete<HelpArticleDeleteResponse>(`/api/admin/help-center/articles/${id}`);
        return response.data;
    },
};
