import { AdminReportListQuerySchema } from "@/lib/schema/report";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getReportList } from "@/server/report/service";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = AdminReportListQuerySchema.parse({
            targetType: searchParams.get("targetType") ?? undefined,
            status: searchParams.get("status") ?? undefined,
            q: searchParams.get("q") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });

        const result = await getReportList(ctx.supabase, query);

        return ok({
            items: result.items,
            page: query.page,
            pageSize: query.pageSize,
            total: result.total,
        });
    }),
);
