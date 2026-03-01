import { zUuid } from "@/lib/schema/common";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedDoctor } from "@/server/auth/guards";
import { cancelProject } from "@/server/bidding/service";

export const PATCH = withApi(
    withApprovedDoctor<{ id: string }>(async (ctx) => {
        const projectId = zUuid.parse(ctx.params.id);
        const project = await cancelProject(ctx.supabase, projectId, ctx.user.id);
        return ok({ project });
    }),
);
