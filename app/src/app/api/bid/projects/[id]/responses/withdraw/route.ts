import { zUuid } from "@/lib/schema/common";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { withdrawBidResponse } from "@/server/bidding/service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

export const PATCH = withApi(
    withApprovedVendor<{ id: string }>(async (ctx) => {
        const projectId = zUuid.parse(ctx.params.id);
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const response = await withdrawBidResponse(ctx.supabase, projectId, vendorId);
        return ok({ response });
    }),
);
