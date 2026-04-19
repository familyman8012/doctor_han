import type {
    MembershipPlanListResponse,
    MembershipPrepareResponse,
    MembershipPurchaseBody,
    MembershipStatusResponse,
} from "@/lib/schema/vendor-membership";
import type { ApiSuccessResponse } from "@/lib/api/types";
import api from "./client";

export const membershipApi = {
    getStatus: async (): Promise<MembershipStatusResponse> =>
        (await api.get<MembershipStatusResponse>("/api/vendors/me/membership")).data,

    listPlans: async (): Promise<MembershipPlanListResponse> =>
        (await api.get<MembershipPlanListResponse>("/api/vendors/me/membership/plans")).data,

    /** 토스 즉시결제 준비 */
    prepare: async (
        body: MembershipPurchaseBody,
    ): Promise<ApiSuccessResponse<MembershipPrepareResponse>> =>
        (
            await api.post<ApiSuccessResponse<MembershipPrepareResponse>>(
                "/api/vendors/me/membership/prepare",
                body,
            )
        ).data,
};
