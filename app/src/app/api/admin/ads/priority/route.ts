import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getAdminPriorityReport } from "@/server/ad/priority-service";

/**
 * GET /api/admin/ads/priority
 * 관리자: 우선순위 슬롯 리포트
 */
export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const result = await getAdminPriorityReport(ctx.supabase);

        return ok(result);
    }),
);
