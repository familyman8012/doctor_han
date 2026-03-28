import { AdminCreditAdjustBodySchema } from "@/lib/schema/credit";
import { zUuid } from "@/lib/schema/common";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { adminAdjustCredit } from "@/server/credit/service";

export const POST = withApi(
    withRole<{ vendorId: string }>(["admin"], async (ctx) => {
        const vendorId = zUuid.parse(ctx.params.vendorId);
        const body = AdminCreditAdjustBodySchema.parse(await ctx.req.json());

        const result = await adminAdjustCredit({
            vendorId,
            amount: body.amount,
            reason: body.reason,
            adjustType: body.adjustType,
            adminUserId: ctx.user.id,
        });

        return created(result);
    }),
);
