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
    getPublicCategories: async (): Promise<HelpCategoryListResponse> => {
        const response = await api.get<HelpCategoryListResponse>("/api/help/categories");
        return response.data;
    },

    getPublicArticles: async (params?: Partial<HelpArticleListQuery>): Promise<HelpArticleListResponse> => {
        const response = await api.get<HelpArticleListResponse>("/api/help/articles", { params });
        return response.data;
    },

    getPublicArticle: async (id: string): Promise<HelpArticleDetailResponse> => {
        const response = await api.get<HelpArticleDetailResponse>(`/api/help/articles/${id}`);
        return response.data;
    },

    getAdminCategories: async (): Promise<HelpCategoryListResponse> => {
        const response = await api.get<HelpCategoryListResponse>("/api/admin/help-center/categories");
        return response.data;
    },

    createCategory: async (body: HelpCategoryCreateBody): Promise<HelpCategoryDetailResponse> => {
        const response = await api.post<HelpCategoryDetailResponse>("/api/admin/help-center/categories", body);
        return response.data;
    },

    updateCategory: async (id: string, body: HelpCategoryPatchBody): Promise<HelpCategoryDetailResponse> => {
        const response = await api.patch<HelpCategoryDetailResponse>(`/api/admin/help-center/categories/${id}`, body);
        return response.data;
    },

    deleteCategory: async (id: string): Promise<HelpCategoryDeleteResponse> => {
        const response = await api.delete<HelpCategoryDeleteResponse>(`/api/admin/help-center/categories/${id}`);
        return response.data;
    },

    getAdminArticles: async (params?: Partial<AdminHelpArticleListQuery>): Promise<HelpArticleListResponse> => {
        const response = await api.get<HelpArticleListResponse>("/api/admin/help-center/articles", { params });
        return response.data;
    },

    getAdminArticle: async (id: string): Promise<HelpArticleDetailResponse> => {
        const response = await api.get<HelpArticleDetailResponse>(`/api/admin/help-center/articles/${id}`);
        return response.data;
    },

    createArticle: async (body: HelpArticleCreateBody): Promise<HelpArticleDetailResponse> => {
        const response = await api.post<HelpArticleDetailResponse>("/api/admin/help-center/articles", body);
        return response.data;
    },

    updateArticle: async (id: string, body: HelpArticlePatchBody): Promise<HelpArticleDetailResponse> => {
        const response = await api.patch<HelpArticleDetailResponse>(`/api/admin/help-center/articles/${id}`, body);
        return response.data;
    },

    deleteArticle: async (id: string): Promise<HelpArticleDeleteResponse> => {
        const response = await api.delete<HelpArticleDeleteResponse>(`/api/admin/help-center/articles/${id}`);
        return response.data;
    },
};
