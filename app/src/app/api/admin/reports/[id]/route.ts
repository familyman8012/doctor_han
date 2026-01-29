import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getReportDetail } from "@/server/report/service";

export const GET = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const { id } = ctx.params;

        const result = await getReportDetail(ctx.supabase, id);

        return ok({
            report: result.report,
            targetReportCount: result.targetReportCount,
            sanctions: result.sanctions,
        });
    }),
);
