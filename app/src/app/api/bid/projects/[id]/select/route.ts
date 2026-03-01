import { BidVendorSelectBodySchema } from "@/lib/schema/bidding";
import { zUuid } from "@/lib/schema/common";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedDoctor } from "@/server/auth/guards";
import { selectVendor } from "@/server/bidding/service";

export const PATCH = withApi(
    withApprovedDoctor<{ id: string }>(async (ctx) => {
        const projectId = zUuid.parse(ctx.params.id);
        const body = BidVendorSelectBodySchema.parse(await ctx.req.json());
        const project = await selectVendor(ctx.supabase, projectId, body.vendorId, ctx.user.id);
        return ok({ project });
    }),
);
