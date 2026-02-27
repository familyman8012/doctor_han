import { CreditChargeBodySchema } from "@/lib/schema/credit";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { prepareCharge } from "@/server/credit/service";
import { getVendorIdByUserId } from "../utils";

/**
 * POST /api/credits/charge
 * 충전 준비 → orderId 반환
 */
export const POST = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const body = CreditChargeBodySchema.parse(await ctx.req.json());
        const customerName = ctx.profile.display_name ?? "파트너";

        const result = await prepareCharge(
            ctx.supabase,
            ctx.user.id,
            vendorId,
            body.packageId,
            customerName,
        );

        return ok(result);
    }),
);
