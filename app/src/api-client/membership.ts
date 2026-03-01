import type {
    MembershipPlanListResponse,
    MembershipPurchaseBody,
    MembershipPurchaseResponse,
    MembershipStatusResponse,
} from "@/lib/schema/vendor-membership";
import api from "./client";

export const membershipApi = {
    getStatus: async (): Promise<MembershipStatusResponse> =>
        (await api.get<MembershipStatusResponse>("/api/vendors/me/membership")).data,

    listPlans: async (): Promise<MembershipPlanListResponse> =>
        (await api.get<MembershipPlanListResponse>("/api/vendors/me/membership/plans")).data,

    purchase: async (body: MembershipPurchaseBody): Promise<MembershipPurchaseResponse> =>
        (await api.post<MembershipPurchaseResponse>("/api/vendors/me/membership", body)).data,
};
