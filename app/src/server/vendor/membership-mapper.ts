import type { MembershipPlan, VendorMembership } from "@/lib/schema/vendor-membership";

export type MembershipPlanRow = {
    id: string;
    name: string;
    duration_days: number;
    price: number;
    promo_price: number | null;
    promo_expires_at: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type VendorMembershipRow = {
    id: string;
    vendor_id: string;
    plan_id: string;
    status: string;
    price_paid: number;
    starts_at: string;
    expires_at: string;
    auto_renew: boolean;
    credit_transaction_id: string | null;
    payment_id: string | null;
    canceled_at: string | null;
    created_at: string;
    updated_at: string;
};

function computeEffectivePrice(row: MembershipPlanRow): number {
    if (
        row.promo_price !== null &&
        (row.promo_expires_at === null || new Date(row.promo_expires_at).getTime() > Date.now())
    ) {
        return row.promo_price;
    }
    return row.price;
}

export function mapMembershipPlanRow(row: MembershipPlanRow): MembershipPlan {
    return {
        id: row.id,
        name: row.name,
        durationDays: row.duration_days,
        price: row.price,
        promoPrice: row.promo_price,
        promoExpiresAt: row.promo_expires_at,
        effectivePrice: computeEffectivePrice(row),
        sortOrder: row.sort_order,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapVendorMembershipRow(
    row: VendorMembershipRow,
    plan?: MembershipPlan,
): VendorMembership {
    return {
        id: row.id,
        vendorId: row.vendor_id,
        planId: row.plan_id,
        status: row.status as VendorMembership["status"],
        pricePaid: row.price_paid,
        startsAt: row.starts_at,
        expiresAt: row.expires_at,
        autoRenew: row.auto_renew,
        creditTransactionId: row.credit_transaction_id,
        paymentId: row.payment_id,
        canceledAt: row.canceled_at,
        ...(plan ? { plan } : {}),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
