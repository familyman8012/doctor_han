import type {
    PaymentConfirmBody,
    PaymentConfirmResponse,
    PaymentDetailResponse,
} from "@/lib/schema/payment";
import api from "./client";

export const paymentsApi = {
    confirm: async (body: PaymentConfirmBody): Promise<PaymentConfirmResponse> => {
        const response = await api.post<PaymentConfirmResponse>("/api/payments/confirm", body);
        return response.data;
    },

    getDetail: async (id: string): Promise<PaymentDetailResponse> => {
        const response = await api.get<PaymentDetailResponse>(`/api/payments/${id}`);
        return response.data;
    },
};
