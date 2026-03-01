import { internalServerError, unauthorized } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { sendSubscriptionExpiryReminders } from "@/server/subscription/service";
import { withApi } from "@/server/api/with-api";
import type { NextRequest } from "next/server";

function getCronSecretFromRequest(req: NextRequest): string | null {
    const headerSecret = req.headers.get("x-cron-secret");
    if (headerSecret) {
        return headerSecret;
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
        return null;
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
        return null;
    }

    return token;
}

/**
 * POST /api/internal/cron/subscriptions/expiry-reminders
 * 구독 만료 7일/1일 전 알림 발송
 */
export const POST = withApi(async (req: NextRequest) => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        throw internalServerError("CRON_SECRET 환경변수가 설정되지 않았습니다.");
    }

    const requestSecret = getCronSecretFromRequest(req);
    if (!requestSecret || requestSecret !== cronSecret) {
        throw unauthorized("유효하지 않은 cron 요청입니다.");
    }

    const result = await sendSubscriptionExpiryReminders([7, 1]);
    return ok(result);
});
