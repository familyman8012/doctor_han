import type {
    CreditAutoChargeBody,
    CreditAutoChargeResponse,
    CreditBalanceResponse,
    CreditChargeBody,
    CreditChargeResponse,
    CreditTransactionListQuery,
    CreditTransactionListResponse,
} from "@/lib/schema/credit";
import api from "./client";

export const creditsApi = {
    getBalance: async (): Promise<CreditBalanceResponse> => {
        const response = await api.get<CreditBalanceResponse>("/api/credits");
        return response.data;
    },

    getTransactions: async (
        params?: Partial<CreditTransactionListQuery>,
    ): Promise<CreditTransactionListResponse> => {
        const response = await api.get<CreditTransactionListResponse>("/api/credits/transactions", {
            params,
        });
        return response.data;
    },

    prepareCharge: async (body: CreditChargeBody): Promise<CreditChargeResponse> => {
        const response = await api.post<CreditChargeResponse>("/api/credits/charge", body);
        return response.data;
    },

    updateAutoCharge: async (body: CreditAutoChargeBody): Promise<CreditAutoChargeResponse> => {
        const response = await api.patch<CreditAutoChargeResponse>(
            "/api/credits/auto-charge",
            body,
        );
        return response.data;
    },
};
