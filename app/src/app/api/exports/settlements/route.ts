import { ExportSettlementsQuerySchema } from "@/lib/schema/export";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { exportSettlementsCsv } from "@/server/settlement/service";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const exportQuery = ExportSettlementsQuerySchema.parse({
            status: searchParams.get("status") ?? undefined,
            vendorId: searchParams.get("vendorId") ?? undefined,
            year: searchParams.get("year") ?? undefined,
            month: searchParams.get("month") ?? undefined,
        });

        // Adapt to SettlementListQuery shape for the existing function
        const csv = await exportSettlementsCsv({
            ...exportQuery,
            format: "csv",
            page: 1,
            pageSize: 20,
        });

        const today = new Date().toISOString().slice(0, 10);

        return new Response(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="settlements-${today}.csv"`,
            },
        });
    }),
);
