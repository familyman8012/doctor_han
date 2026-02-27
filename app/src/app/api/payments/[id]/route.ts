import { zUuid } from "@/lib/schema/common";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { notFound } from "@/server/api/errors";
import { getPaymentById } from "@/server/payment/repository";
import { mapPaymentRow } from "@/server/payment/mapper";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

/**
 * GET /api/payments/[id]
 * 결제 상세 조회
 */
export const GET = withApi(
    withApprovedVendor<{ id: string }>(async (ctx) => {
        const paymentId = zUuid.parse(ctx.params.id);
        const admin = createSupabaseAdminClient();

        const payment = await getPaymentById(admin, paymentId);
        if (!payment) {
            throw notFound("결제 정보를 찾을 수 없습니다.");
        }

        // 본인 결제만 조회 가능
        if (payment.user_id !== ctx.user.id) {
            throw notFound("결제 정보를 찾을 수 없습니다.");
        }

        return ok({ payment: mapPaymentRow(payment) });
    }),
);
