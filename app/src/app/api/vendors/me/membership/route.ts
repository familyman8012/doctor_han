import { MembershipPurchaseBodySchema } from "@/lib/schema/vendor-membership";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { getMembershipStatus, purchaseMembership } from "@/server/vendor/membership-service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

// GET /api/vendors/me/membership — 멤버십 상태 조회
export const GET = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const result = await getMembershipStatus(ctx.supabase, vendorId);
        return ok(result);
    }),
);

// POST /api/vendors/me/membership — 멤버십 구매
export const POST = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const body = MembershipPurchaseBodySchema.parse(await ctx.req.json());
        const result = await purchaseMembership(ctx.supabase, ctx.user.id, vendorId, body);
        return created(result);
    }),
);
