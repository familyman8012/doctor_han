import { AdminAdReportQuerySchema } from "@/lib/schema/ad";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getAdReport } from "@/server/ad/service";

/**
 * GET /api/admin/ads/reports
 * 관리자: 광고 리포트 조회
 */
export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const searchParams = Object.fromEntries(ctx.req.nextUrl.searchParams.entries());
        const query = AdminAdReportQuerySchema.parse(searchParams);

        const result = await getAdReport(ctx.supabase, query);

        return ok(result);
    }),
);
