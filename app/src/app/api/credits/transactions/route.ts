import { CreditTransactionListQuerySchema } from "@/lib/schema/credit";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { getTransactions } from "@/server/credit/service";
import { getVendorIdByUserId } from "../utils";

/**
 * GET /api/credits/transactions
 * 거래 내역 조회 (페이지네이션 + type 필터)
 */
export const GET = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const query = CreditTransactionListQuerySchema.parse(
            Object.fromEntries(new URL(ctx.req.url).searchParams),
        );
        const result = await getTransactions(ctx.supabase, vendorId, query);
        return ok(result);
    }),
);
