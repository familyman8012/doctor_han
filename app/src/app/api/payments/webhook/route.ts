import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { handleWebhook } from "@/server/payment/service";
import type { NextRequest } from "next/server";

/**
 * POST /api/payments/webhook
 * TossPayments 웹훅 수신 (인증 없음 - 서명 검증으로 대체)
 */
export const POST = withApi(async (req: NextRequest) => {
    const rawBody = await req.text();
    const signature = req.headers.get("x-tosspayments-signature");
    await handleWebhook(rawBody, signature);
    return ok({ received: true });
});
