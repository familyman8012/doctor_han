import { PaymentConfirmBodySchema } from "@/lib/schema/payment";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { confirmPaymentAndCredit } from "@/server/payment/service";

/**
 * POST /api/payments/confirm
 * 결제 승인 (Toss API 호출 → 크레딧 적립)
 */
export const POST = withApi(
    withApprovedVendor(async (ctx) => {
        const body = PaymentConfirmBodySchema.parse(await ctx.req.json());
        const result = await confirmPaymentAndCredit(ctx.supabase, body, ctx.user.id);
        return ok(result);
    }),
);
