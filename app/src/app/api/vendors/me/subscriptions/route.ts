import { SubscriptionPurchaseBodySchema } from "@/lib/schema/subscription";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { listSubscriptions, purchaseSubscription } from "@/server/subscription/service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

/**
 * GET /api/vendors/me/subscriptions
 * 구독 목록 조회
 */
export const GET = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const result = await listSubscriptions(ctx.supabase, vendorId);
        return ok(result);
    }),
);

/**
 * POST /api/vendors/me/subscriptions
 * 구독 구매
 */
export const POST = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const body = SubscriptionPurchaseBodySchema.parse(await ctx.req.json());
        const result = await purchaseSubscription(ctx.supabase, ctx.user.id, vendorId, body);
        return created(result);
    }),
);
