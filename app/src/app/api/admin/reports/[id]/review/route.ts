import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { startReview } from "@/server/report/service";

export const POST = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const { id } = ctx.params;

        const result = await startReview(ctx.supabase, id, ctx.user.id);

        return ok({
            report: result.report,
        });
    }),
);
