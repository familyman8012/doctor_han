import { AdminAuditLogListQuerySchema } from "@/lib/schema/audit";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { listAuditLogs } from "@/server/audit/service";
import { withRole } from "@/server/auth/guards";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = AdminAuditLogListQuerySchema.parse({
            action: searchParams.get("action") ?? undefined,
            targetType: searchParams.get("targetType") ?? undefined,
            actorId: searchParams.get("actorId") ?? undefined,
            startDate: searchParams.get("startDate") ?? undefined,
            endDate: searchParams.get("endDate") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });

        const { items, total } = await listAuditLogs(ctx.supabase, query);

        return ok({
            items,
            page: query.page,
            pageSize: query.pageSize,
            total,
        });
    }),
);
