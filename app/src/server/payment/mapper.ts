import type { Payment } from "@/lib/schema/payment";

export type PaymentRow = {
    id: string;
    order_id: string;
    payment_key: string | null;
    vendor_id: string;
    user_id: string;
    amount: number;
    status: string;
    method: string | null;
    metadata: unknown;
    created_at: string;
    updated_at: string;
};

export function mapPaymentRow(row: PaymentRow): Payment {
    return {
        id: row.id,
        orderId: row.order_id,
        paymentKey: row.payment_key,
        vendorId: row.vendor_id,
        userId: row.user_id,
        amount: row.amount,
        status: row.status as Payment["status"],
        method: row.method as Payment["method"],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
