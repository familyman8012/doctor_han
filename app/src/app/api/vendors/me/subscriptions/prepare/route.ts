import { SubscriptionPurchaseBodySchema } from "@/lib/schema/subscription";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { prepareSubscriptionPayment } from "@/server/subscription/service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

/**
 * POST /api/vendors/me/subscriptions/prepare
 * 토스 즉시결제 준비 → orderId/clientKey 반환
 * 승인 완료 후 /api/payments/confirm 호출하면 구독 자동 생성됨
 */
export const POST = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const body = SubscriptionPurchaseBodySchema.parse(await ctx.req.json());
        const customerName = ctx.profile.display_name ?? "파트너";

        const result = await prepareSubscriptionPayment(
            ctx.supabase,
            ctx.user.id,
            vendorId,
            body,
            customerName,
        );

        return ok(result);
    }),
);
