import { AdminReportResolveBodySchema } from "@/lib/schema/report";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { resolveReport } from "@/server/report/service";

export const POST = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const { id } = ctx.params;
        const body = AdminReportResolveBodySchema.parse(await ctx.req.json());

        const result = await resolveReport(ctx.supabase, id, ctx.user.id, body);

        return ok({
            report: result.report,
            sanction: result.sanction,
        });
    }),
);
