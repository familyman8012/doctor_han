import type { CategoryView } from "@/lib/schema/category";
import type { SubscriptionPlan, VendorSubscription } from "@/lib/schema/subscription";

export type SubscriptionPlanRow = {
    id: string;
    name: string;
    duration_days: number;
    price: number;
    daily_rate: number;
    discount_rate: number;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type VendorSubscriptionRow = {
    id: string;
    vendor_id: string;
    category_id: string;
    plan_id: string;
    status: string;
    price_paid: number;
    starts_at: string;
    expires_at: string;
    auto_renew: boolean;
    lead_count: number;
    credit_transaction_id: string | null;
    canceled_at: string | null;
    created_at: string;
    updated_at: string;
};

export function mapSubscriptionPlanRow(row: SubscriptionPlanRow): SubscriptionPlan {
    return {
        id: row.id,
        name: row.name,
        durationDays: row.duration_days,
        price: row.price,
        dailyRate: row.daily_rate,
        discountRate: Number(row.discount_rate),
        sortOrder: row.sort_order,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapVendorSubscriptionRow(
    row: VendorSubscriptionRow,
    plan?: SubscriptionPlan,
    category?: CategoryView,
): VendorSubscription {
    return {
        id: row.id,
        vendorId: row.vendor_id,
        categoryId: row.category_id,
        planId: row.plan_id,
        status: row.status as VendorSubscription["status"],
        pricePaid: row.price_paid,
        startsAt: row.starts_at,
        expiresAt: row.expires_at,
        autoRenew: row.auto_renew,
        leadCount: row.lead_count,
        creditTransactionId: row.credit_transaction_id,
        canceledAt: row.canceled_at,
        ...(plan ? { plan } : {}),
        ...(category ? { category } : {}),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
