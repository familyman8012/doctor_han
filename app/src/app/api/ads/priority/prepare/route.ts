import { PriorityPurchaseBodySchema } from "@/lib/schema/ad";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { preparePrioritySlotPayment } from "@/server/ad/priority-service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

/**
 * POST /api/ads/priority/prepare
 * 우선순위 슬롯 토스 즉시결제 준비
 */
export const POST = withApi(
    withApprovedVendor(async (ctx) => {
        const body = PriorityPurchaseBodySchema.parse(await ctx.req.json());
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const customerName = ctx.profile.display_name ?? "파트너";

        const result = await preparePrioritySlotPayment(
            ctx.supabase,
            ctx.user.id,
            vendorId,
            body.prioritySlotId,
            customerName,
        );

        return ok(result);
    }),
);
