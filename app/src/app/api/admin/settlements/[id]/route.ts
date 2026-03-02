import { SettlementItemListQuerySchema } from "@/lib/schema/settlement";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getSettlementDetail } from "@/server/settlement/service";

export const GET = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const { id } = ctx.params;
        const { searchParams } = new URL(ctx.req.url);
        const itemQuery = SettlementItemListQuerySchema.parse({
            itemType: searchParams.get("itemType") ?? undefined,
            page: searchParams.get("itemPage") ?? undefined,
            pageSize: searchParams.get("itemPageSize") ?? undefined,
        });

        const result = await getSettlementDetail(id, itemQuery);

        return ok({
            settlement: result.settlement,
            items: result.items,
            itemPage: result.itemPage,
            itemPageSize: result.itemPageSize,
            itemTotal: result.itemTotal,
        });
    }),
);
