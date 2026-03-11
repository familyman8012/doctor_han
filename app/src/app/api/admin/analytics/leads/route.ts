import { AnalyticsQuerySchema } from "@/lib/schema/analytics";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { getLeadAnalytics } from "@/server/analytics/service";
import { withRole } from "@/server/auth/guards";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = AnalyticsQuerySchema.parse({
            from: searchParams.get("from") ?? undefined,
            to: searchParams.get("to") ?? undefined,
            granularity: searchParams.get("granularity") ?? undefined,
        });

        const data = await getLeadAnalytics(query);

        return ok(data);
    }),
);
