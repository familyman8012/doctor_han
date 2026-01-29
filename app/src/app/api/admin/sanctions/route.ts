import { AdminSanctionListQuerySchema } from "@/lib/schema/report";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getSanctionList } from "@/server/report/service";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = AdminSanctionListQuerySchema.parse({
            targetType: searchParams.get("targetType") ?? undefined,
            targetId: searchParams.get("targetId") ?? undefined,
            status: searchParams.get("status") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });

        const result = await getSanctionList(ctx.supabase, query);

        return ok({
            items: result.items,
            page: query.page,
            pageSize: query.pageSize,
            total: result.total,
        });
    }),
);
