import "server-only";

import type { LeadCharge, PriceBreakdownItem } from "@/lib/schema/lead";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { createPendingTransaction, getOrCreateCreditAccount } from "@/server/credit/repository";
import { mapLeadChargeRow } from "@/server/lead/mapper";
import type { LeadChargeRow } from "@/server/lead/mapper";
import {
    findDuplicateLeads,
    insertLeadCharge,
    updateLeadCharge,
} from "@/server/lead/repository";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { listVendorServicePrices } from "@/server/vendor/pricing-repository";

// ============================================
// 1. Calculate Charge Amount
// ============================================

interface CalculateChargeResult {
    totalAmount: number;
    priceBreakdown: PriceBreakdownItem[];
}

export async function calculateChargeAmount(
    vendorId: string,
    categoryIds: string[],
): Promise<CalculateChargeResult> {
    const admin = createSupabaseAdminClient();
    const uniqueCategoryIds = [...new Set(categoryIds)];

    // Validate that all requested categories belong to the vendor.
    const { data: vendorCategoryRows, error: vendorCategoryError } = await admin
        .from("vendor_categories")
        .select("category_id")
        .eq("vendor_id", vendorId)
        .in("category_id", uniqueCategoryIds);

    if (vendorCategoryError) {
        throw internalServerError("업체 카테고리 정보를 조회할 수 없습니다.", {
            message: vendorCategoryError.message,
            code: vendorCategoryError.code,
        });
    }

    const vendorCategoryIdSet = new Set((vendorCategoryRows ?? []).map((row) => row.category_id));
    const invalidCategoryIds = uniqueCategoryIds.filter((id) => !vendorCategoryIdSet.has(id));

    if (invalidCategoryIds.length > 0) {
        throw badRequest("업체에 등록되지 않은 카테고리가 포함되어 있습니다.");
    }

    // Fetch vendor's active service prices
    const prices = await listVendorServicePrices(admin, vendorId);

    // Filter to only the requested categoryIds
    const matchingPrices = prices.filter((p) => uniqueCategoryIds.includes(p.category_id));

    // Every requested category must have an active price.
    if (matchingPrices.length !== uniqueCategoryIds.length) {
        throw badRequest("단가가 설정되지 않은 카테고리가 포함되어 있습니다.");
    }

    if (matchingPrices.length === 0) {
        return { totalAmount: 0, priceBreakdown: [] };
    }

    // Fetch category names for the matching categories
    const matchingCategoryIds = matchingPrices.map((p) => p.category_id);
    const { data: categories, error: catError } = await admin
        .from("categories")
        .select("id, name")
        .in("id", matchingCategoryIds);

    if (catError) {
        throw internalServerError("카테고리 정보를 조회할 수 없습니다.", {
            message: catError.message,
            code: catError.code,
        });
    }

    const categoryNameMap = new Map(
        (categories ?? []).map((c) => [c.id, c.name]),
    );

    // Build price breakdown
    const priceBreakdown: PriceBreakdownItem[] = matchingPrices.map((p) => ({
        categoryId: p.category_id,
        categoryName: categoryNameMap.get(p.category_id) ?? "Unknown",
        price: p.price,
    }));

    const totalAmount = priceBreakdown.reduce((sum, item) => sum + item.price, 0);

    return { totalAmount, priceBreakdown };
}

// ============================================
// 2. Check Duplicate Lead
// ============================================

interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateOfLeadId: string | null;
}

export async function checkDuplicateLead(
    doctorUserId: string,
    vendorId: string,
    currentLeadId: string,
    days?: number,
): Promise<DuplicateCheckResult> {
    const admin = createSupabaseAdminClient();

    const duplicates = await findDuplicateLeads(admin, doctorUserId, vendorId, days ?? 30, currentLeadId);

    if (duplicates.length > 0) {
        return {
            isDuplicate: true,
            duplicateOfLeadId: duplicates[0].id,
        };
    }

    return { isDuplicate: false, duplicateOfLeadId: null };
}

// ============================================
// 3. Process Lead Charge (MAIN)
// ============================================

interface ProcessLeadChargeParams {
    leadId: string;
    vendorId: string;
    doctorUserId: string;
    categoryIds: string[];
}

export async function processLeadCharge(params: ProcessLeadChargeParams): Promise<LeadCharge> {
    const admin = createSupabaseAdminClient();
    const { leadId, vendorId, doctorUserId, categoryIds } = params;

    // 1. Calculate charge amount
    const { totalAmount, priceBreakdown } = await calculateChargeAmount(vendorId, categoryIds);

    // 2. Check duplicate
    const { isDuplicate, duplicateOfLeadId } = await checkDuplicateLead(doctorUserId, vendorId, leadId);

    // 2a. Duplicate lead -> waived charge
    if (isDuplicate) {
        const account = await getOrCreateCreditAccount(admin, vendorId);
        const row = await insertLeadCharge(admin, {
            lead_id: leadId,
            vendor_id: vendorId,
            credit_account_id: account.id,
            total_amount: totalAmount,
            price_breakdown: priceBreakdown,
            status: "waived",
            is_duplicate: true,
            duplicate_of_lead_id: duplicateOfLeadId,
        });
        return mapLeadChargeRow(row);
    }

    // 3. Zero amount -> waived charge
    if (totalAmount === 0) {
        const account = await getOrCreateCreditAccount(admin, vendorId);
        const row = await insertLeadCharge(admin, {
            lead_id: leadId,
            vendor_id: vendorId,
            credit_account_id: account.id,
            total_amount: 0,
            price_breakdown: priceBreakdown,
            status: "waived",
            is_duplicate: false,
        });
        return mapLeadChargeRow(row);
    }

    // 4. Get or create credit account
    const account = await getOrCreateCreditAccount(admin, vendorId);

    // 5. Create pending credit transaction
    const pendingTx = await createPendingTransaction(admin, {
        creditAccountId: account.id,
        type: "deduct",
        amount: -totalAmount,
        description: "리드 과금",
    });

    // 6. Attempt atomic balance deduction via RPC
    try {
        const { data: rpcResult, error: rpcError } = await admin.rpc("credit_balance_update", {
            p_credit_account_id: account.id,
            p_transaction_id: pendingTx.id,
            p_amount: -totalAmount,
            p_type: "deduct",
            p_description: "리드 과금",
        });

        if (rpcError) {
            // Insufficient balance or other RPC failure -> pending charge
            console.warn(
                `[charge-service] RPC credit_balance_update failed for lead ${leadId}, vendor ${vendorId}: ${rpcError.message}`,
            );

            const row = await insertLeadCharge(admin, {
                lead_id: leadId,
                vendor_id: vendorId,
                credit_account_id: account.id,
                total_amount: totalAmount,
                price_breakdown: priceBreakdown,
                status: "pending",
                is_duplicate: false,
            });
            return mapLeadChargeRow(row);
        }

        // RPC success -> charged
        const transactionId = rpcResult?.[0]?.transaction_id ?? pendingTx.id;

        const row = await insertLeadCharge(admin, {
            lead_id: leadId,
            vendor_id: vendorId,
            credit_account_id: account.id,
            total_amount: totalAmount,
            price_breakdown: priceBreakdown,
            status: "charged",
            charge_transaction_id: transactionId,
            is_duplicate: false,
        });
        return mapLeadChargeRow(row);
    } catch (error) {
        // Unexpected error (e.g., RAISE EXCEPTION for insufficient balance) -> pending charge
        console.warn(
            `[charge-service] Unexpected error during charge for lead ${leadId}, vendor ${vendorId}:`,
            error instanceof Error ? error.message : error,
        );

        const row = await insertLeadCharge(admin, {
            lead_id: leadId,
            vendor_id: vendorId,
            credit_account_id: account.id,
            total_amount: totalAmount,
            price_breakdown: priceBreakdown,
            status: "pending",
            is_duplicate: false,
        });
        return mapLeadChargeRow(row);
    }
}

// ============================================
// 4. Refund Lead Charge
// ============================================

export async function refundLeadCharge(
    chargeId: string,
    reason: string,
    _adminUserId?: string, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<LeadCharge> {
    const admin = createSupabaseAdminClient();

    // 1. Fetch the charge by ID
    const { data: chargeRow, error: fetchError } = await admin
        .from("lead_charges")
        .select("*")
        .eq("id", chargeId)
        .maybeSingle();

    if (fetchError) {
        throw internalServerError("리드 과금 정보를 조회할 수 없습니다.", {
            message: fetchError.message,
            code: fetchError.code,
        });
    }

    if (!chargeRow) {
        throw notFound("리드 과금 정보를 찾을 수 없습니다.");
    }

    const charge = chargeRow as LeadChargeRow;

    // 2. Verify status is 'charged'
    if (charge.status !== "charged") {
        throw badRequest(
            `환불할 수 없는 상태입니다. 현재 상태: ${charge.status}. 'charged' 상태만 환불 가능합니다.`,
        );
    }

    // 3. Create pending recovery transaction
    const pendingTx = await createPendingTransaction(admin, {
        creditAccountId: charge.credit_account_id,
        type: "recovery",
        amount: charge.total_amount,
        description: `리드 과금 환불: ${reason}`,
    });

    // 4. Atomic balance recovery via RPC
    const { data: rpcResult, error: rpcError } = await admin.rpc("credit_balance_update", {
        p_credit_account_id: charge.credit_account_id,
        p_transaction_id: pendingTx.id,
        p_amount: charge.total_amount,
        p_type: "recovery",
        p_description: `리드 과금 환불: ${reason}`,
    });

    if (rpcError) {
        throw internalServerError("크레딧 환불에 실패했습니다.", {
            message: rpcError.message,
            code: rpcError.code,
        });
    }

    const transactionId = rpcResult?.[0]?.transaction_id ?? pendingTx.id;

    // 5. Update lead_charge record
    const updatedRow = await updateLeadCharge(admin, chargeId, {
        status: "refunded",
        refund_transaction_id: transactionId,
        refund_reason: reason,
        refund_amount: charge.total_amount,
        refunded_at: new Date().toISOString(),
    });

    return mapLeadChargeRow(updatedRow);
}
