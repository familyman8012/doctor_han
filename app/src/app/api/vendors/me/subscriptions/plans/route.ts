import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { listPlans } from "@/server/subscription/service";

/**
 * GET /api/vendors/me/subscriptions/plans
 * 구독 플랜 목록 조회
 */
export const GET = withApi(
    withApprovedVendor(async () => {
        const result = await listPlans();
        return ok(result);
    }),
);
