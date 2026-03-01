import { zUuid } from "@/lib/schema/common";
import { forbidden } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { getProjectDetail } from "@/server/bidding/service";

export const GET = withApi(
    withAuth<{ id: string }>(async (ctx) => {
        if (
            ctx.profile.role !== "doctor" &&
            ctx.profile.role !== "vendor" &&
            ctx.profile.role !== "admin"
        ) {
            throw forbidden();
        }

        const projectId = zUuid.parse(ctx.params.id);
        const project = await getProjectDetail(ctx.supabase, projectId);
        return ok({ project });
    }),
);
