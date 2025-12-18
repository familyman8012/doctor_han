import type {
    AsAdminRequestDetail,
    AsAdminRequestListQuery,
    AsAdminRequestListResponse,
    AsAdminRequestPatchDTO,
    AsRequestCreateDTO,
    AsRequestCreateResponse,
    AsSessionInfo,
    AsSmsChallengeCreateResponse,
    AsSmsChallengeVerifyResponse,
} from "@/lib/schema/as";
import type { FileDirectUploadResponse, FileUsageListResponse } from "@/lib/schema/file";
import api, { apiUpload } from "./client";

export const asApi = {
    // ----------------------------
    // 고객(외부): OTP
    // ----------------------------
    createSmsChallenge: async (payload: { phone: string }): Promise<AsSmsChallengeCreateResponse> => {
        const response = await api.post<AsSmsChallengeCreateResponse>("/api/as/auth/sms/challenges", payload);
        return response.data;
    },
    verifySmsChallenge: async (challengeId: string, payload: { code: string }): Promise<AsSmsChallengeVerifyResponse> => {
        const response = await api.post<AsSmsChallengeVerifyResponse>(
            `/api/as/auth/sms/challenges/${challengeId}/verify`,
            payload,
        );
        return response.data;
    },
    getSession: async (): Promise<AsSessionInfo | null> => {
        try {
            const response = await api.get<AsSessionInfo>("/api/as/session");
            return response.data;
        } catch (error) {
            // AS 고객 로그인 화면에서는 "세션 없음(401)"이 정상 케이스다.
            const status = (error as any)?.status;
            const code = (error as any)?.code;
            if (status === 401 || code === "401") {
                return null;
            }
            throw error;
        }
    },

    // ----------------------------
    // 고객(외부): 파일
    // ----------------------------
    uploadFile: async (formData: FormData): Promise<FileDirectUploadResponse> => {
        return await apiUpload<FileDirectUploadResponse>("/api/as/files", formData);
    },
    listFileUsages: async (params: { domain: string; entityId: string }): Promise<FileUsageListResponse> => {
        const response = await api.get<FileUsageListResponse>("/api/as/files/usages", { params });
        return response.data;
    },
    deleteFileUsage: async (usageId: string): Promise<void> => {
        await api.delete(`/api/as/files/usages/${usageId}`);
    },
    fetchDownloadUrl: async (fileId: string): Promise<string> => {
        const response = await api.get<{ url: string }>(`/api/as/files/${fileId}/download`);
        return response.data.url;
    },

    // ----------------------------
    // 고객(외부): 접수
    // ----------------------------
    createRequest: async (payload: AsRequestCreateDTO): Promise<AsRequestCreateResponse> => {
        const response = await api.post<AsRequestCreateResponse>("/api/as/requests", payload);
        return response.data;
    },

    // ----------------------------
    // 관리자(내부): API만 (admin 프로젝트가 소비)
    // ----------------------------
    listAdminRequests: async (params: Partial<AsAdminRequestListQuery>): Promise<AsAdminRequestListResponse> => {
        const response = await api.get<AsAdminRequestListResponse>("/api/admin/as/requests", { params });
        return response.data;
    },
    getAdminRequestDetail: async (requestId: string): Promise<AsAdminRequestDetail> => {
        const response = await api.get<AsAdminRequestDetail>(`/api/admin/as/requests/${requestId}`);
        return response.data;
    },
    patchAdminRequest: async (requestId: string, payload: AsAdminRequestPatchDTO): Promise<AsAdminRequestDetail> => {
        const response = await api.patch<AsAdminRequestDetail>(`/api/admin/as/requests/${requestId}`, payload);
        return response.data;
    },
};
