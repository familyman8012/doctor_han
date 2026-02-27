import type { CreditAccount, CreditPackage, CreditTransaction } from "@/lib/schema/credit";

export type CreditAccountRow = {
    id: string;
    vendor_id: string;
    balance: number;
    auto_charge_enabled: boolean;
    auto_charge_amount: number | null;
    auto_charge_threshold: number;
    created_at: string;
    updated_at: string;
};

export type CreditPackageRow = {
    id: string;
    name: string;
    amount: number;
    bonus_rate: number;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type CreditTransactionRow = {
    id: string;
    credit_account_id: string;
    type: string;
    status: string;
    amount: number;
    balance_after: number;
    payment_id: string | null;
    description: string | null;
    expires_at: string | null;
    metadata: unknown;
    created_at: string;
    updated_at: string;
};

export function mapCreditAccountRow(row: CreditAccountRow): CreditAccount {
    return {
        id: row.id,
        vendorId: row.vendor_id,
        balance: row.balance,
        autoChargeEnabled: row.auto_charge_enabled,
        autoChargeAmount: row.auto_charge_amount,
        autoChargeThreshold: row.auto_charge_threshold,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapCreditPackageRow(row: CreditPackageRow): CreditPackage {
    return {
        id: row.id,
        name: row.name,
        amount: row.amount,
        bonusRate: Number(row.bonus_rate),
        sortOrder: row.sort_order,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapCreditTransactionRow(row: CreditTransactionRow): CreditTransaction {
    return {
        id: row.id,
        creditAccountId: row.credit_account_id,
        type: row.type as CreditTransaction["type"],
        status: row.status as CreditTransaction["status"],
        amount: row.amount,
        balanceAfter: row.balance_after,
        paymentId: row.payment_id,
        description: row.description,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
