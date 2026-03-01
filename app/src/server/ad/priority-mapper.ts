import type { AdPriorityPurchase, AdPrioritySlot } from "@/lib/schema/ad";

export type AdPrioritySlotRow = {
    id: string;
    category_id: string;
    tier: string;
    max_slots: number;
    price_weekly: number;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type AdPriorityPurchaseRow = {
    id: string;
    priority_slot_id: string;
    vendor_id: string;
    category_id: string;
    tier: string;
    status: string;
    starts_at: string;
    ends_at: string;
    price_paid: number;
    credit_transaction_id: string | null;
    jumpup_remaining: number;
    jumpup_last_used_at: string | null;
    created_at: string;
    updated_at: string;
};

export type AdPriorityJumpupRow = {
    id: string;
    purchase_id: string;
    activated_at: string;
    expires_at: string;
    created_at: string;
};

export function mapAdPrioritySlotRow(row: AdPrioritySlotRow): AdPrioritySlot {
    return {
        id: row.id,
        categoryId: row.category_id,
        tier: row.tier as AdPrioritySlot["tier"],
        maxSlots: row.max_slots,
        priceWeekly: row.price_weekly,
        sortOrder: row.sort_order,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapAdPriorityPurchaseRow(row: AdPriorityPurchaseRow): AdPriorityPurchase {
    return {
        id: row.id,
        prioritySlotId: row.priority_slot_id,
        vendorId: row.vendor_id,
        categoryId: row.category_id,
        tier: row.tier as AdPriorityPurchase["tier"],
        status: row.status as AdPriorityPurchase["status"],
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        pricePaid: row.price_paid,
        creditTransactionId: row.credit_transaction_id,
        jumpupRemaining: row.jumpup_remaining,
        jumpupLastUsedAt: row.jumpup_last_used_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
