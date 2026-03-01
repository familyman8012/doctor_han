import { zUuid } from "@/lib/schema/common";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { activateJumpup } from "@/server/ad/priority-service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

/**
 * POST /api/ads/priority/[id]/jumpup
 * 루키 점프업 활성화 (업체 전용)
 */
export const POST = withApi(
    withApprovedVendor<{ id: string }>(async (ctx) => {
        const purchaseId = zUuid.parse(ctx.params.id);
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);

        const result = await activateJumpup(ctx.supabase, vendorId, purchaseId);

        return ok(result);
    }),
);
