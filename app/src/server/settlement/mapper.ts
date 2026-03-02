import type { Settlement, SettlementItem } from "@/lib/schema/settlement";

export type SettlementRow = {
    id: string;
    vendor_id: string;
    period_start: string;
    period_end: string;
    status: string;
    total_revenue: number;
    total_refunds: number;
    net_revenue: number;
    lead_charge_revenue: number;
    lead_charge_refunds: number;
    subscription_revenue: number;
    membership_revenue: number;
    ad_purchase_revenue: number;
    bid_commission_revenue: number;
    total_item_count: number;
    confirmed_by: string | null;
    confirmed_at: string | null;
    paid_by: string | null;
    paid_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type SettlementItemRow = {
    id: string;
    settlement_id: string;
    item_type: string;
    source_id: string;
    amount: number;
    refund_amount: number;
    net_amount: number;
    description: string | null;
    source_created_at: string | null;
    created_at: string;
};

export function mapSettlementRow(row: SettlementRow, vendorName?: string): Settlement {
    return {
        id: row.id,
        vendorId: row.vendor_id,
        ...(vendorName !== undefined ? { vendorName } : {}),
        periodStart: row.period_start,
        periodEnd: row.period_end,
        status: row.status as Settlement["status"],
        totalRevenue: row.total_revenue,
        totalRefunds: row.total_refunds,
        netRevenue: row.net_revenue,
        leadChargeRevenue: row.lead_charge_revenue,
        leadChargeRefunds: row.lead_charge_refunds,
        subscriptionRevenue: row.subscription_revenue,
        membershipRevenue: row.membership_revenue,
        adPurchaseRevenue: row.ad_purchase_revenue,
        bidCommissionRevenue: row.bid_commission_revenue,
        totalItemCount: row.total_item_count,
        confirmedBy: row.confirmed_by,
        confirmedAt: row.confirmed_at,
        paidBy: row.paid_by,
        paidAt: row.paid_at,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapSettlementItemRow(row: SettlementItemRow): SettlementItem {
    return {
        id: row.id,
        settlementId: row.settlement_id,
        itemType: row.item_type as SettlementItem["itemType"],
        sourceId: row.source_id,
        amount: row.amount,
        refundAmount: row.refund_amount,
        netAmount: row.net_amount,
        description: row.description,
        sourceCreatedAt: row.source_created_at,
        createdAt: row.created_at,
    };
}
