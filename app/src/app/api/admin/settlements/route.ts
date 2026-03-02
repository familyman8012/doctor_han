import { SettlementListQuerySchema } from "@/lib/schema/settlement";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { exportSettlementsCsv, listSettlementsAdmin } from "@/server/settlement/service";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = SettlementListQuerySchema.parse({
            status: searchParams.get("status") ?? undefined,
            vendorId: searchParams.get("vendorId") ?? undefined,
            year: searchParams.get("year") ?? undefined,
            month: searchParams.get("month") ?? undefined,
            format: searchParams.get("format") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });

        // CSV export
        if (query.format === "csv") {
            const csv = await exportSettlementsCsv(query);
            return new Response(csv, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="settlements-${query.year ?? "all"}-${query.month ?? "all"}.csv"`,
                },
            });
        }

        const result = await listSettlementsAdmin(query);

        return ok({
            items: result.items,
            page: result.page,
            pageSize: result.pageSize,
            total: result.total,
        });
    }),
);
