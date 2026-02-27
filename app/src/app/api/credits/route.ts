import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { getBalance } from "@/server/credit/service";
import { getVendorIdByUserId } from "./utils";

/**
 * GET /api/credits
 * 잔액 + 패키지 목록 조회
 */
export const GET = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const result = await getBalance(ctx.supabase, vendorId);
        return ok(result);
    }),
);
