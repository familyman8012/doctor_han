import "server-only";

import type { Database } from "@/lib/database.types";
import type { PaymentPurpose } from "@/lib/schema/payment";
import { internalServerError, badRequest } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { completeCharge } from "@/server/credit/service";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient<Database>;

type PaymentRow = {
    id: string;
    vendor_id: string;
    metadata: unknown;
};

function readMetadata(row: PaymentRow): Record<string, unknown> {
    const m = row.metadata;
    if (m && typeof m === "object" && !Array.isArray(m)) {
        return m as Record<string, unknown>;
    }
    return {};
}

export function getPaymentPurpose(row: PaymentRow): PaymentPurpose {
    const purpose = readMetadata(row).purpose;
    if (
        purpose === "credit_charge" ||
        purpose === "subscription" ||
        purpose === "membership" ||
        purpose === "ad_priority"
    ) {
        return purpose;
    }
    // legacy: purpose 필드가 없는 기존 payment는 credit_charge로 처리
    return "credit_charge";
}

/**
 * 결제 승인 후 purpose별 후처리 디스패처
 * - credit_charge: 크레딧 잔액 증가 (기존 로직 재사용)
 * - subscription: subscription 레코드 생성/연장
 * - membership: membership 레코드 생성/연장
 * - ad_priority: ad_priority_purchase 레코드 생성
 */
export async function dispatchPaymentFulfillment(
    admin: AdminClient,
    paymentRow: PaymentRow,
): Promise<{ purpose: PaymentPurpose; resultId: string | null }> {
    const purpose = getPaymentPurpose(paymentRow);
    const meta = readMetadata(paymentRow);

    if (purpose === "credit_charge") {
        await completeCharge(admin, paymentRow.id, paymentRow.vendor_id);
        return { purpose, resultId: null };
    }

    if (purpose === "subscription") {
        const planId = String(meta.planId ?? "");
        const categoryId = String(meta.categoryId ?? "");
        const autoRenew = Boolean(meta.autoRenew);
        if (!planId || !categoryId) {
            throw badRequest("구독 결제 메타데이터가 올바르지 않습니다.");
        }
        const { data, error } = await admin.rpc("purchase_vendor_subscription_direct", {
            p_vendor_id: paymentRow.vendor_id,
            p_category_id: categoryId,
            p_plan_id: planId,
            p_payment_id: paymentRow.id,
            p_auto_renew: autoRenew,
            p_extension_window_days: 7,
        });
        if (error) {
            throw internalServerError("구독 생성에 실패했습니다.", {
                message: error.message,
                code: error.code,
            });
        }
        const resultId = (data?.[0] as { subscription_id?: string } | undefined)?.subscription_id ?? null;
        return { purpose, resultId };
    }

    if (purpose === "membership") {
        const planId = String(meta.planId ?? "");
        const autoRenew = Boolean(meta.autoRenew);
        if (!planId) {
            throw badRequest("멤버십 결제 메타데이터가 올바르지 않습니다.");
        }
        const { data, error } = await admin.rpc("purchase_vendor_membership_direct", {
            p_vendor_id: paymentRow.vendor_id,
            p_plan_id: planId,
            p_payment_id: paymentRow.id,
            p_auto_renew: autoRenew,
        });
        if (error) {
            throw internalServerError("멤버십 생성에 실패했습니다.", {
                message: error.message,
                code: error.code,
            });
        }
        const resultId = (data?.[0] as { membership_id?: string } | undefined)?.membership_id ?? null;
        return { purpose, resultId };
    }

    if (purpose === "ad_priority") {
        const prioritySlotId = String(meta.prioritySlotId ?? "");
        if (!prioritySlotId) {
            throw badRequest("광고 우선순위 결제 메타데이터가 올바르지 않습니다.");
        }
        const { data, error } = await admin.rpc("purchase_ad_priority_slot_direct", {
            p_vendor_id: paymentRow.vendor_id,
            p_priority_slot_id: prioritySlotId,
            p_payment_id: paymentRow.id,
        });
        if (error) {
            throw internalServerError("광고 우선순위 생성에 실패했습니다.", {
                message: error.message,
                code: error.code,
            });
        }
        const resultId = (data?.[0] as { purchase_id?: string } | undefined)?.purchase_id ?? null;
        return { purpose, resultId };
    }

    // 도달 불가 (enum 완비)
    const _exhaustive: never = purpose;
    throw internalServerError(`지원하지 않는 purpose: ${String(_exhaustive)}`);
}

export { createSupabaseAdminClient };
