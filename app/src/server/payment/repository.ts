import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentRow } from "./mapper";

export async function createPayment(
    supabase: SupabaseClient<Database>,
    payload: {
        orderId: string;
        vendorId: string;
        userId: string;
        amount: number;
        metadata?: Record<string, unknown>;
    },
): Promise<PaymentRow> {
    const { data, error } = await supabase
        .from("payments")
        .insert({
            order_id: payload.orderId,
            vendor_id: payload.vendorId,
            user_id: payload.userId,
            amount: payload.amount,
            status: "ready",
            metadata: (payload.metadata ?? {}) as Database["public"]["Tables"]["payments"]["Insert"]["metadata"],
        })
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("결제 레코드를 생성할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as PaymentRow;
}

export async function getPaymentByOrderId(
    supabase: SupabaseClient<Database>,
    orderId: string,
): Promise<PaymentRow | null> {
    const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

    if (error) {
        throw internalServerError("결제 정보를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as PaymentRow) ?? null;
}

export async function getPaymentById(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<PaymentRow | null> {
    const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw internalServerError("결제 정보를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data as PaymentRow) ?? null;
}

export async function updatePaymentStatus(
    supabase: SupabaseClient<Database>,
    id: string,
    status: Database["public"]["Enums"]["payment_status"],
    paymentKey?: string,
    method?: Database["public"]["Enums"]["payment_method"],
): Promise<PaymentRow> {
    const updatePayload: Database["public"]["Tables"]["payments"]["Update"] = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (paymentKey) {
        updatePayload.payment_key = paymentKey;
    }
    if (method) {
        updatePayload.method = method;
    }

    const { data, error } = await supabase
        .from("payments")
        .update(updatePayload)
        .eq("id", id)
        .select("*")
        .single();

    if (error || !data) {
        throw internalServerError("결제 상태를 업데이트할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data as PaymentRow;
}

export async function insertWebhookLog(
    supabase: SupabaseClient<Database>,
    payload: {
        eventType: string;
        paymentKey?: string;
        rawBody: unknown;
        signature?: string;
    },
): Promise<string> {
    const { data, error } = await supabase
        .from("payment_webhooks")
        .insert({
            event_type: payload.eventType,
            payment_key: payload.paymentKey ?? null,
            raw_body: payload.rawBody as Database["public"]["Tables"]["payment_webhooks"]["Insert"]["raw_body"],
            signature: payload.signature ?? null,
        })
        .select("id")
        .single();

    if (error || !data) {
        throw internalServerError("웹훅 로그를 저장할 수 없습니다.", {
            message: error?.message,
            code: error?.code,
        });
    }

    return data.id;
}

export async function markWebhookProcessed(
    supabase: SupabaseClient<Database>,
    webhookId: string,
    errorMessage?: string,
): Promise<void> {
    const { error } = await supabase
        .from("payment_webhooks")
        .update({
            processed: true,
            error_message: errorMessage ?? null,
        })
        .eq("id", webhookId);

    if (error) {
        console.error("[PaymentWebhook] Failed to mark webhook as processed", error);
    }
}
