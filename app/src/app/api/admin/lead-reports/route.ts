import { LeadReportListQuerySchema } from "@/lib/schema/lead";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapLeadReportRow } from "@/server/lead/mapper";
import { listLeadReports } from "@/server/lead/repository";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = LeadReportListQuerySchema.parse({
            status: searchParams.get("status") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });

        const admin = createSupabaseAdminClient();
        const { rows, total } = await listLeadReports(admin, query);

        return ok({
            items: rows.map(mapLeadReportRow),
            page: query.page,
            pageSize: query.pageSize,
            total,
        });
    }),
);
