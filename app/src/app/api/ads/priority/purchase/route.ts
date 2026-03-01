import { PriorityPurchaseBodySchema } from "@/lib/schema/ad";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { purchasePrioritySlot } from "@/server/ad/priority-service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

/**
 * POST /api/ads/priority/purchase
 * 우선순위 슬롯 구매 (업체 전용)
 */
export const POST = withApi(
    withApprovedVendor(async (ctx) => {
        const body = PriorityPurchaseBodySchema.parse(await ctx.req.json());
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);

        const purchase = await purchasePrioritySlot(ctx.supabase, vendorId, body.prioritySlotId);

        return created({ purchase });
    }),
);
