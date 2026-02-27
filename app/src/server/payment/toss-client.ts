import "server-only";

const TOSS_API_BASE = "https://api.tosspayments.com/v1";

function getSecretKey(): string {
    const key = process.env.TOSS_PAYMENTS_SECRET_KEY;
    if (!key) {
        throw new Error("Missing env: TOSS_PAYMENTS_SECRET_KEY");
    }
    return key;
}

export function getClientKey(): string {
    const key = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY;
    if (!key) {
        throw new Error("Missing env: NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY");
    }
    return key;
}

function getAuthHeader(): string {
    const encoded = Buffer.from(`${getSecretKey()}:`).toString("base64");
    return `Basic ${encoded}`;
}

export interface TossConfirmRequest {
    paymentKey: string;
    orderId: string;
    amount: number;
}

export interface TossConfirmResponse {
    paymentKey: string;
    orderId: string;
    status: string;
    method: string;
    totalAmount: number;
    approvedAt: string;
    [key: string]: unknown;
}

export async function confirmPayment(params: TossConfirmRequest): Promise<TossConfirmResponse> {
    const response = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
        method: "POST",
        headers: {
            "Authorization": getAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            paymentKey: params.paymentKey,
            orderId: params.orderId,
            amount: params.amount,
        }),
        signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            `TossPayments confirm failed: ${response.status} - ${(error as { message?: string }).message || "Unknown error"}`,
        );
    }

    return response.json() as Promise<TossConfirmResponse>;
}

export function getWebhookSecretKey(): string {
    const key = process.env.TOSS_PAYMENTS_WEBHOOK_SECRET;
    if (!key) {
        throw new Error("Missing env: TOSS_PAYMENTS_WEBHOOK_SECRET");
    }
    return key;
}

export async function verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
    const secret = getWebhookSecretKey();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedSignature = Buffer.from(signatureBuffer).toString("base64");

    // Timing-safe comparison
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length) {
        return false;
    }
    return timingSafeEqual(a, b);
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a[i]! ^ b[i]!;
    }
    return result === 0;
}
