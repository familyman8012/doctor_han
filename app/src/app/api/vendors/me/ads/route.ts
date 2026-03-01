import { VendorAdsQuerySchema } from "@/lib/schema/ad";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { getVendorAds } from "@/server/ad/priority-service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

/**
 * GET /api/vendors/me/ads
 * 내 광고 목록 조회 (업체 전용)
 */
export const GET = withApi(
    withApprovedVendor(async (ctx) => {
        const searchParams = Object.fromEntries(ctx.req.nextUrl.searchParams.entries());
        const query = VendorAdsQuerySchema.parse(searchParams);
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);

        const result = await getVendorAds(ctx.supabase, vendorId, query);

        return ok(result);
    }),
);
