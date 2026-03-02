import { ReviewRefundRequestBodySchema } from "@/lib/schema/refund";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { reviewRefundRequest } from "@/server/refund/service";

export const PATCH = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const { id } = ctx.params;
        const body = ReviewRefundRequestBodySchema.parse(await ctx.req.json());

        const result = await reviewRefundRequest({
            requestId: id,
            action: body.action,
            adminUserId: ctx.user.id,
            adminNote: body.adminNote,
        });

        return ok(result);
    }),
);
