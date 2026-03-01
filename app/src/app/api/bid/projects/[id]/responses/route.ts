import { BidResponseSubmitBodySchema } from "@/lib/schema/bidding";
import { zUuid } from "@/lib/schema/common";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { submitBidResponse } from "@/server/bidding/service";
import { getVendorIdByUserId } from "@/server/vendor/utils";

export const POST = withApi(
    withApprovedVendor<{ id: string }>(async (ctx) => {
        const projectId = zUuid.parse(ctx.params.id);
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const body = BidResponseSubmitBodySchema.parse(await ctx.req.json());
        const response = await submitBidResponse(ctx.supabase, projectId, vendorId, body);
        return created({ response });
    }),
);
