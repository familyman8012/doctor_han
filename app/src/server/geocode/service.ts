import "server-only";

import type { GeocodeResponseData } from "@/lib/schema/geocode";

const KAKAO_GEOCODE_URL = "https://dapi.kakao.com/v2/local/search/address.json";
const TIMEOUT_MS = 5000;
const MAX_RETRIES = 1;

type KakaoAddressDocument = {
    x: string; // longitude
    y: string; // latitude
};

type KakaoGeocodeResponse = {
    documents: KakaoAddressDocument[];
};

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Geocode an address string using the Kakao REST API.
 * Returns latitude/longitude or null if the API key is missing,
 * the address cannot be resolved, or an error occurs.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResponseData | null> {
    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
        console.warn("[geocode] KAKAO_REST_API_KEY is not set. Skipping geocode.");
        return null;
    }

    const url = `${KAKAO_GEOCODE_URL}?query=${encodeURIComponent(address)}`;
    const headers = {
        Authorization: `KakaoAK ${apiKey}`,
    };

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetchWithTimeout(url, { method: "GET", headers }, TIMEOUT_MS);

            if (!response.ok) {
                console.error(`[geocode] Kakao API returned ${response.status}: ${response.statusText}`);
                if (attempt < MAX_RETRIES) continue;
                return null;
            }

            const data = (await response.json()) as KakaoGeocodeResponse;

            if (!data.documents || data.documents.length === 0) {
                return null;
            }

            const doc = data.documents[0];
            const latitude = parseFloat(doc.y);
            const longitude = parseFloat(doc.x);

            if (isNaN(latitude) || isNaN(longitude)) {
                return null;
            }

            return { latitude, longitude };
        } catch (error) {
            if (attempt < MAX_RETRIES) {
                console.warn(`[geocode] Attempt ${attempt + 1} failed, retrying...`, error);
                continue;
            }
            console.error("[geocode] All attempts failed:", error);
            return null;
        }
    }

    return null;
}
