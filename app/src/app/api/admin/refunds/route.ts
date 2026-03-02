import { RefundRequestListQuerySchema } from "@/lib/schema/refund";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getAdminRefundRequests } from "@/server/refund/service";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const url = new URL(ctx.req.url);
        const query = RefundRequestListQuerySchema.parse({
            status: url.searchParams.get("status") ?? undefined,
            page: url.searchParams.get("page") ?? undefined,
            pageSize: url.searchParams.get("pageSize") ?? undefined,
        });

        const result = await getAdminRefundRequests(query);
        return ok(result);
    }),
);
