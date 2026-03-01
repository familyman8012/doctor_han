import { BidAdminStatusPatchBodySchema } from "@/lib/schema/bidding";
import { zUuid } from "@/lib/schema/common";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { adminUpdateProjectStatus } from "@/server/bidding/service";

export const PATCH = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const projectId = zUuid.parse(ctx.params.id);
        const body = BidAdminStatusPatchBodySchema.parse(await ctx.req.json());
        const project = await adminUpdateProjectStatus(
            ctx.supabase,
            projectId,
            body.status,
            ctx.user.id,
        );
        return ok({ project });
    }),
);
