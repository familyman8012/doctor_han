import "server-only";

import type { Database } from "@/lib/database.types";
import type { Payment } from "@/lib/schema/payment";
import { badRequest, notFound } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapPaymentRow } from "./mapper";
import {
    getPaymentByOrderId,
    insertWebhookLog,
    markWebhookProcessed,
    updatePaymentStatus,
} from "./repository";
import { confirmPayment as tossConfirmPayment, verifyWebhookSignature } from "./toss-client";
import { completeCharge } from "@/server/credit/service";
import { getPendingTransactionByPaymentId } from "@/server/credit/repository";

function mapTossMethodToEnum(method: string): Database["public"]["Enums"]["payment_method"] {
    const methodMap: Record<string, Database["public"]["Enums"]["payment_method"]> = {
        "카드": "card",
        "가상계좌": "virtual_account",
        "계좌이체": "transfer",
        "휴대폰": "mobile",
        "간편결제": "easy_pay",
    };
    return methodMap[method] ?? "etc";
}

/**
 * 결제 승인 (TossPayments confirm + DB 업데이트 + 크레딧 적립)
 */
export async function confirmPaymentAndCredit(
    _supabase: SupabaseClient<Database>,
    params: { paymentKey: string; orderId: string; amount: number },
    userId: string,
): Promise<{ payment: Payment; creditBalance: number }> {
    const admin = createSupabaseAdminClient();

    // 1. 결제 레코드 조회
    const paymentRow = await getPaymentByOrderId(admin, params.orderId);
    if (!paymentRow) {
        throw notFound("결제 정보를 찾을 수 없습니다.");
    }

    // 본인 결제 확인
    if (paymentRow.user_id !== userId) {
        throw badRequest("본인의 결제만 승인할 수 있습니다.");
    }

    // 이미 완료된 결제면 멱등하게 현재 상태 반환
    if (paymentRow.status === "done") {
        return {
            payment: mapPaymentRow(paymentRow),
            creditBalance: await completeCharge(admin, paymentRow.id, paymentRow.vendor_id),
        };
    }

    // 금액 검증
    if (paymentRow.amount !== params.amount) {
        throw badRequest("결제 금액이 일치하지 않습니다.");
    }

    // 크레딧 적립은 완료됐지만 결제 상태 업데이트만 실패한 케이스 복구
    const chargeTx = await getPendingTransactionByPaymentId(admin, paymentRow.id);
    if (chargeTx?.status === "completed") {
        const updatedRow = await updatePaymentStatus(admin, paymentRow.id, "done", params.paymentKey);
        return {
            payment: mapPaymentRow(updatedRow),
            creditBalance: await getCurrentBalance(admin, paymentRow.vendor_id),
        };
    }

    // 2. TossPayments API 승인 호출
    const tossResult = await tossConfirmPayment({
        paymentKey: params.paymentKey,
        orderId: params.orderId,
        amount: params.amount,
    });

    // 3. 크레딧 적립 (먼저 처리하고, 결제 상태는 뒤에서 업데이트)
    const creditBalance = await completeCharge(admin, paymentRow.id, paymentRow.vendor_id);

    // 4. payment 상태 업데이트
    const method = mapTossMethodToEnum(tossResult.method);
    const updatedRow = await updatePaymentStatus(
        admin,
        paymentRow.id,
        "done",
        params.paymentKey,
        method,
    );

    return {
        payment: mapPaymentRow(updatedRow),
        creditBalance,
    };
}

/**
 * 웹훅 처리
 */
export async function handleWebhook(
    rawBody: string,
    signature: string | null,
): Promise<void> {
    const admin = createSupabaseAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
        body = JSON.parse(rawBody);
    } catch {
        throw badRequest("Invalid webhook body");
    }

    const eventType = body.eventType ?? "unknown";
    const paymentKey = body.data?.paymentKey ?? null;

    // 웹훅 로그 저장
    const webhookId = await insertWebhookLog(admin, {
        eventType,
        paymentKey,
        rawBody: body,
        signature: signature ?? undefined,
    });

    try {
        // 서명은 필수
        if (!signature) {
            await markWebhookProcessed(admin, webhookId, "Missing signature");
            throw badRequest("Missing webhook signature");
        }

        // 서명 검증
        const valid = await verifyWebhookSignature(rawBody, signature);
        if (!valid) {
            await markWebhookProcessed(admin, webhookId, "Invalid signature");
            throw badRequest("Invalid webhook signature");
        }

        // PAYMENT_STATUS_CHANGED 이벤트 처리
        if (eventType === "PAYMENT_STATUS_CHANGED" && paymentKey) {
            const status = body.data?.status;
            if (status === "DONE") {
                // confirm 전에 브라우저가 닫힌 경우 웹훅으로 크레딧 적립
                const payment = await getPaymentByOrderId(admin, body.data?.orderId);
                if (payment) {
                    await completeCharge(admin, payment.id, payment.vendor_id);
                    if (payment.status !== "done") {
                        await updatePaymentStatus(admin, payment.id, "done", paymentKey);
                    }
                }
            }
        }

        await markWebhookProcessed(admin, webhookId);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await markWebhookProcessed(admin, webhookId, errorMessage);
        throw error;
    }
}

async function getCurrentBalance(
    supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<number> {
    const { data } = await supabase
        .from("credit_accounts")
        .select("balance")
        .eq("vendor_id", vendorId)
        .maybeSingle();

    return data?.balance ?? 0;
}
