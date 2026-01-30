import { AdminReportDismissBodySchema } from "@/lib/schema/report";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { dismissReport } from "@/server/report/service";

export const POST = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const { id } = ctx.params;
        const body = AdminReportDismissBodySchema.parse(await ctx.req.json());

        const result = await dismissReport(ctx.supabase, id, ctx.user.id, body.reason);

        return ok({
            report: result.report,
        });
    }),
);
