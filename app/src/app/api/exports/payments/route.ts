import { ExportPaymentsQuerySchema } from "@/lib/schema/export";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { exportPaymentsCsv } from "@/server/payment/service";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = ExportPaymentsQuerySchema.parse({
            status: searchParams.get("status") ?? undefined,
            dateFrom: searchParams.get("dateFrom") ?? undefined,
            dateTo: searchParams.get("dateTo") ?? undefined,
        });

        const csv = await exportPaymentsCsv(query);
        const today = new Date().toISOString().slice(0, 10);

        return new Response(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="payments-${today}.csv"`,
            },
        });
    }),
);
