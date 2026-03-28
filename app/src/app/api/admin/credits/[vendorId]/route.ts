import { zUuid } from "@/lib/schema/common";
import { CreditTransactionListQuerySchema } from "@/lib/schema/credit";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getBalance, getTransactions } from "@/server/credit/service";

export const GET = withApi(
    withRole<{ vendorId: string }>(["admin"], async (ctx) => {
        const vendorId = zUuid.parse(ctx.params.vendorId);
        const { searchParams } = new URL(ctx.req.url);

        const query = CreditTransactionListQuerySchema.parse({
            page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
            pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
            type: searchParams.get("type") ?? undefined,
        });

        const [balanceResult, transactionsResult] = await Promise.all([
            getBalance(ctx.supabase, vendorId),
            getTransactions(ctx.supabase, vendorId, {
                page: query.page ?? 1,
                pageSize: query.pageSize ?? 20,
                type: query.type,
            }),
        ]);

        return ok({
            account: balanceResult.account,
            transactions: transactionsResult,
        });
    }),
);
