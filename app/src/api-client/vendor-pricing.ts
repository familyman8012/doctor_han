import type {
    VendorServicePriceCreateBody,
    VendorServicePriceListResponse,
    VendorServicePricePatchBody,
    VendorServicePriceResponse,
} from "@/lib/schema/vendor-pricing";
import api from "./client";

export const vendorPricingApi = {
    list: async (): Promise<VendorServicePriceListResponse> => {
        const response = await api.get<VendorServicePriceListResponse>("/api/vendors/me/prices");
        return response.data;
    },

    create: async (body: VendorServicePriceCreateBody): Promise<VendorServicePriceResponse> => {
        const response = await api.post<VendorServicePriceResponse>("/api/vendors/me/prices", body);
        return response.data;
    },

    update: async (id: string, body: VendorServicePricePatchBody): Promise<VendorServicePriceResponse> => {
        const response = await api.patch<VendorServicePriceResponse>(`/api/vendors/me/prices/${id}`, body);
        return response.data;
    },

    remove: async (id: string): Promise<VendorServicePriceResponse> => {
        const response = await api.delete<VendorServicePriceResponse>(`/api/vendors/me/prices/${id}`);
        return response.data;
    },
};
