import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { getMembershipStatus } from "@/server/vendor/membership-service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

// GET /api/vendors/me/membership — 멤버십 상태 조회
// 구매는 POST /api/vendors/me/membership/prepare (토스 즉시결제) 로 이동
export const GET = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const result = await getMembershipStatus(ctx.supabase, vendorId);
        return ok(result);
    }),
);
