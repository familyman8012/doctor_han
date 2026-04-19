import { MembershipPurchaseBodySchema } from "@/lib/schema/vendor-membership";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { prepareMembershipPayment } from "@/server/vendor/membership-service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

/**
 * POST /api/vendors/me/membership/prepare
 * 토스 즉시결제 준비
 */
export const POST = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const body = MembershipPurchaseBodySchema.parse(await ctx.req.json());
        const customerName = ctx.profile.display_name ?? "파트너";

        const result = await prepareMembershipPayment(
            ctx.supabase,
            ctx.user.id,
            vendorId,
            body,
            customerName,
        );

        return ok(result);
    }),
);
