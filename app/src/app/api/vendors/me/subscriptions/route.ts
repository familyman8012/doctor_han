import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { listSubscriptions } from "@/server/subscription/service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

/**
 * GET /api/vendors/me/subscriptions
 * 구독 목록 조회
 *
 * 구매는 POST /api/vendors/me/subscriptions/prepare 로 이동 (토스 즉시결제)
 */
export const GET = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const result = await listSubscriptions(ctx.supabase, vendorId);
        return ok(result);
    }),
);
