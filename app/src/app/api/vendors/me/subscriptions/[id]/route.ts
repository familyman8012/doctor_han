import { zUuid } from "@/lib/schema/common";
import { SubscriptionAutoRenewBodySchema } from "@/lib/schema/subscription";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { getSubscriptionDetail, toggleAutoRenew } from "@/server/subscription/service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

/**
 * GET /api/vendors/me/subscriptions/:id
 * 구독 상세 조회
 */
export const GET = withApi(
    withApprovedVendor<{ id: string }>(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const id = zUuid.parse(ctx.params.id);
        const result = await getSubscriptionDetail(ctx.supabase, vendorId, id);
        return ok(result);
    }),
);

/**
 * PATCH /api/vendors/me/subscriptions/:id
 * 자동갱신 토글
 */
export const PATCH = withApi(
    withApprovedVendor<{ id: string }>(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const id = zUuid.parse(ctx.params.id);
        const body = SubscriptionAutoRenewBodySchema.parse(await ctx.req.json());
        const result = await toggleAutoRenew(ctx.supabase, vendorId, id, body.autoRenew);
        return ok(result);
    }),
);
