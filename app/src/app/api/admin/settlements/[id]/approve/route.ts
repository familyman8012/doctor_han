import { SettlementActionBodySchema } from "@/lib/schema/settlement";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { approveSettlement } from "@/server/settlement/service";

export const POST = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const { id } = ctx.params;
        const body = SettlementActionBodySchema.parse(await ctx.req.json());

        const result = await approveSettlement(id, ctx.user.id, body);

        return ok({ settlement: result.settlement });
    }),
);
