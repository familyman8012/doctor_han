import { CreditAutoChargeBodySchema } from "@/lib/schema/credit";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { updateAutoCharge } from "@/server/credit/service";
import { getVendorIdByUserId } from "../utils";

/**
 * PATCH /api/credits/auto-charge
 * 자동충전 설정 변경
 */
export const PATCH = withApi(
    withApprovedVendor(async (ctx) => {
        const vendorId = await getVendorIdByUserId(ctx.supabase, ctx.user.id);
        const body = CreditAutoChargeBodySchema.parse(await ctx.req.json());
        const account = await updateAutoCharge(ctx.supabase, vendorId, body);
        return ok({ account });
    }),
);
