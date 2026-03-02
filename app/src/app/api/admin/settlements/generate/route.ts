import { SettlementGenerateBodySchema } from "@/lib/schema/settlement";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { generateMonthlySettlements } from "@/server/settlement/service";

export const POST = withApi(
    withRole(["admin"], async (ctx) => {
        const body = SettlementGenerateBodySchema.parse(await ctx.req.json());

        const result = await generateMonthlySettlements(body.year, body.month);

        return created({
            created: result.created,
            skipped: result.skipped,
            total: result.total,
            settlements: result.settlements,
        });
    }),
);
