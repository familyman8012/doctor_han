import "server-only";

import type { Settlement, SettlementItem, SettlementItemListQuery, SettlementListQuery } from "@/lib/schema/settlement";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { mapSettlementItemRow, mapSettlementRow } from "./mapper";
import {
    createSettlementWithItems,
    getAdPurchasesForPeriod,
    getBidCommissionsForPeriod,
    getLeadChargesForPeriod,
    getMembershipsForPeriod,
    getSettlementById,
    getSettlementsByPeriod,
    getSubscriptionsForPeriod,
    listSettlementItems,
    listSettlements,
    updateSettlementStatus,
    type RevenueSourceRow,
} from "./repository";

// ============================================
// Public API
// ============================================

export async function listSettlementsAdmin(
    query: SettlementListQuery,
): Promise<{
    items: Settlement[];
    page: number;
    pageSize: number;
    total: number;
}> {
    const admin = createSupabaseAdminClient();
    const { rows, total } = await listSettlements(admin, query);

    if (rows.length === 0) {
        return { items: [], page: query.page, pageSize: query.pageSize, total };
    }

    // Batch fetch vendor names
    const vendorIds = [...new Set(rows.map((r) => r.vendor_id))];
    const { data: vendorRows } = await admin
        .from("vendors")
        .select("id, name")
        .in("id", vendorIds);

    const vendorNameMap = new Map((vendorRows ?? []).map((v) => [v.id, v.name]));

    const items = rows.map((row) => mapSettlementRow(row, vendorNameMap.get(row.vendor_id)));

    return { items, page: query.page, pageSize: query.pageSize, total };
}

export async function getSettlementDetail(
    id: string,
    itemQuery: SettlementItemListQuery,
): Promise<{
    settlement: Settlement;
    items: SettlementItem[];
    itemPage: number;
    itemPageSize: number;
    itemTotal: number;
}> {
    const admin = createSupabaseAdminClient();
    const row = await getSettlementById(admin, id);

    if (!row) {
        throw notFound("정산을 찾을 수 없습니다.");
    }

    // Fetch vendor name
    const { data: vendorRow } = await admin
        .from("vendors")
        .select("id, name")
        .eq("id", row.vendor_id)
        .maybeSingle();

    const settlement = mapSettlementRow(row, vendorRow?.name);

    // Fetch items with pagination
    const { rows: itemRows, total: itemTotal } = await listSettlementItems(admin, id, itemQuery);

    return {
        settlement,
        items: itemRows.map(mapSettlementItemRow),
        itemPage: itemQuery.page,
        itemPageSize: itemQuery.pageSize,
        itemTotal,
    };
}

export async function approveSettlement(
    id: string,
    adminUserId: string,
    body: { notes?: string },
): Promise<{ settlement: Settlement }> {
    const admin = createSupabaseAdminClient();
    const row = await getSettlementById(admin, id);

    if (!row) {
        throw notFound("정산을 찾을 수 없습니다.");
    }

    if (row.status !== "pending") {
        throw badRequest("대기 상태의 정산만 승인할 수 있습니다.");
    }

    const updatedRow = await updateSettlementStatus(admin, id, {
        status: "confirmed",
        confirmed_by: adminUserId,
        confirmed_at: new Date().toISOString(),
        ...(body.notes ? { notes: body.notes } : {}),
    });

    // Fetch vendor name
    const { data: vendorRow } = await admin
        .from("vendors")
        .select("id, name")
        .eq("id", updatedRow.vendor_id)
        .maybeSingle();

    return { settlement: mapSettlementRow(updatedRow, vendorRow?.name) };
}

export async function markSettlementPaid(
    id: string,
    adminUserId: string,
    body: { notes?: string },
): Promise<{ settlement: Settlement }> {
    const admin = createSupabaseAdminClient();
    const row = await getSettlementById(admin, id);

    if (!row) {
        throw notFound("정산을 찾을 수 없습니다.");
    }

    if (row.status !== "confirmed") {
        throw badRequest("확인 완료 상태의 정산만 지급완료 처리할 수 있습니다.");
    }

    const updatedRow = await updateSettlementStatus(admin, id, {
        status: "paid",
        paid_by: adminUserId,
        paid_at: new Date().toISOString(),
        ...(body.notes ? { notes: body.notes } : {}),
    });

    // Fetch vendor name
    const { data: vendorRow } = await admin
        .from("vendors")
        .select("id, name")
        .eq("id", updatedRow.vendor_id)
        .maybeSingle();

    return { settlement: mapSettlementRow(updatedRow, vendorRow?.name) };
}

export async function generateMonthlySettlements(
    year: number,
    month: number,
): Promise<{
    created: number;
    skipped: number;
    total: number;
    settlements: Settlement[];
}> {
    const admin = createSupabaseAdminClient();

    // 1. Period calculation
    const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const periodEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const periodStartTs = `${periodStart}T00:00:00+09:00`;
    const periodEndTs = `${periodEnd}T00:00:00+09:00`;

    // 2. Idempotency check: find already existing settlements for this period
    const existingSettlements = await getSettlementsByPeriod(admin, periodStart, periodEnd);
    const existingVendorIds = new Set(existingSettlements.map((s) => s.vendor_id));

    // 3. Fetch all 5 revenue sources for the period
    const [leadCharges, subscriptions, memberships, adPurchases, bidCommissions] = await Promise.all([
        getLeadChargesForPeriod(admin, periodStartTs, periodEndTs),
        getSubscriptionsForPeriod(admin, periodStartTs, periodEndTs),
        getMembershipsForPeriod(admin, periodStartTs, periodEndTs),
        getAdPurchasesForPeriod(admin, periodStartTs, periodEndTs),
        getBidCommissionsForPeriod(admin, periodStartTs, periodEndTs),
    ]);

    // 4. Group by vendor_id
    type VendorData = {
        leadCharges: RevenueSourceRow[];
        subscriptions: RevenueSourceRow[];
        memberships: RevenueSourceRow[];
        adPurchases: RevenueSourceRow[];
        bidCommissions: RevenueSourceRow[];
    };

    const vendorMap = new Map<string, VendorData>();

    const ensureVendor = (vendorId: string): VendorData => {
        let entry = vendorMap.get(vendorId);
        if (!entry) {
            entry = { leadCharges: [], subscriptions: [], memberships: [], adPurchases: [], bidCommissions: [] };
            vendorMap.set(vendorId, entry);
        }
        return entry;
    };

    for (const row of leadCharges) ensureVendor(row.vendor_id).leadCharges.push(row);
    for (const row of subscriptions) ensureVendor(row.vendor_id).subscriptions.push(row);
    for (const row of memberships) ensureVendor(row.vendor_id).memberships.push(row);
    for (const row of adPurchases) ensureVendor(row.vendor_id).adPurchases.push(row);
    for (const row of bidCommissions) ensureVendor(row.vendor_id).bidCommissions.push(row);

    // 5. Create settlements for each vendor
    let created = 0;
    let skipped = 0;
    const createdSettlements: Settlement[] = [];

    // Fetch vendor names in batch
    const allVendorIds = [...vendorMap.keys()];
    const { data: vendorRows } = await admin
        .from("vendors")
        .select("id, name")
        .in("id", allVendorIds.length > 0 ? allVendorIds : ["__none__"]);

    const vendorNameMap = new Map((vendorRows ?? []).map((v) => [v.id, v.name]));

    for (const [vendorId, data] of vendorMap.entries()) {
        // Skip if settlement already exists for this vendor/period
        if (existingVendorIds.has(vendorId)) {
            skipped += 1;
            continue;
        }

        // Calculate totals
        const leadChargeRev = data.leadCharges.reduce((sum, r) => sum + r.amount, 0);
        const leadChargeRef = data.leadCharges.reduce((sum, r) => sum + r.refund_amount, 0);
        const subscriptionRev = data.subscriptions.reduce((sum, r) => sum + r.amount, 0);
        const membershipRev = data.memberships.reduce((sum, r) => sum + r.amount, 0);
        const adPurchaseRev = data.adPurchases.reduce((sum, r) => sum + r.amount, 0);
        const bidCommissionRev = data.bidCommissions.reduce((sum, r) => sum + r.amount, 0);

        const totalRevenue = leadChargeRev + subscriptionRev + membershipRev + adPurchaseRev + bidCommissionRev;
        const totalRefunds = leadChargeRef;
        const netRevenue = totalRevenue - totalRefunds;

        const totalItemCount =
            data.leadCharges.length +
            data.subscriptions.length +
            data.memberships.length +
            data.adPurchases.length +
            data.bidCommissions.length;

        // Build item payloads once and insert atomically with settlement row.
        const items = [
            ...data.leadCharges.map((r) => ({
                item_type: "lead_charge" as const,
                source_id: r.id,
                amount: r.amount,
                refund_amount: r.refund_amount,
                net_amount: r.amount - r.refund_amount,
                description: r.description,
                source_created_at: r.created_at,
            })),
            ...data.subscriptions.map((r) => ({
                item_type: "subscription" as const,
                source_id: r.id,
                amount: r.amount,
                refund_amount: 0,
                net_amount: r.amount,
                description: r.description,
                source_created_at: r.created_at,
            })),
            ...data.memberships.map((r) => ({
                item_type: "membership" as const,
                source_id: r.id,
                amount: r.amount,
                refund_amount: 0,
                net_amount: r.amount,
                description: r.description,
                source_created_at: r.created_at,
            })),
            ...data.adPurchases.map((r) => ({
                item_type: "ad_purchase" as const,
                source_id: r.id,
                amount: r.amount,
                refund_amount: 0,
                net_amount: r.amount,
                description: r.description,
                source_created_at: r.created_at,
            })),
            ...data.bidCommissions.map((r) => ({
                item_type: "bid_commission" as const,
                source_id: r.id,
                amount: r.amount,
                refund_amount: 0,
                net_amount: r.amount,
                description: r.description,
                source_created_at: r.created_at,
            })),
        ];

        const { row: settlementRow, inserted } = await createSettlementWithItems(admin, {
            vendor_id: vendorId,
            period_start: periodStart,
            period_end: periodEnd,
            status: "pending",
            total_revenue: totalRevenue,
            total_refunds: totalRefunds,
            net_revenue: netRevenue,
            lead_charge_revenue: leadChargeRev,
            lead_charge_refunds: leadChargeRef,
            subscription_revenue: subscriptionRev,
            membership_revenue: membershipRev,
            ad_purchase_revenue: adPurchaseRev,
            bid_commission_revenue: bidCommissionRev,
            total_item_count: totalItemCount,
            items,
        });

        if (!inserted) {
            skipped += 1;
            continue;
        }

        createdSettlements.push(mapSettlementRow(settlementRow, vendorNameMap.get(vendorId)));
        created += 1;
    }

    return {
        created,
        skipped,
        total: created + skipped,
        settlements: createdSettlements,
    };
}

export async function exportSettlementsCsv(
    query: SettlementListQuery,
): Promise<string> {
    const admin = createSupabaseAdminClient();

    // Fetch all settlements matching filter (no pagination for CSV)
    let qb = admin.from("settlements").select("*");

    if (query.status) {
        qb = qb.eq("status", query.status);
    }
    if (query.vendorId) {
        qb = qb.eq("vendor_id", query.vendorId);
    }
    if (query.year && query.month) {
        const periodStart = `${query.year}-${String(query.month).padStart(2, "0")}-01`;
        qb = qb.eq("period_start", periodStart);
    }

    qb = qb.order("created_at", { ascending: false });

    const { data, error } = await qb;

    if (error) {
        throw internalServerError("정산 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const rows = data ?? [];

    if (rows.length === 0) {
        return "업체명,기간시작,기간종료,상태,총수익,환불,순수익,리드과금,리드환불,구독,입점비,광고,비딩수수료,항목수\n";
    }

    // Fetch vendor names
    const vendorIds = [...new Set(rows.map((r) => r.vendor_id))];
    const { data: vendorRows } = await admin
        .from("vendors")
        .select("id, name")
        .in("id", vendorIds);

    const vendorNameMap = new Map((vendorRows ?? []).map((v) => [v.id, v.name]));

    const header = "업체명,기간시작,기간종료,상태,총수익,환불,순수익,리드과금,리드환불,구독,입점비,광고,비딩수수료,항목수";
    const statusLabels: Record<string, string> = {
        pending: "대기",
        confirmed: "확인",
        paid: "지급완료",
    };

    const csvRows = rows.map((row) => {
        const vendorName = (vendorNameMap.get(row.vendor_id) ?? "").replace(/,/g, " ");
        return [
            vendorName,
            row.period_start,
            row.period_end,
            statusLabels[row.status] ?? row.status,
            row.total_revenue,
            row.total_refunds,
            row.net_revenue,
            row.lead_charge_revenue,
            row.lead_charge_refunds,
            row.subscription_revenue,
            row.membership_revenue,
            row.ad_purchase_revenue,
            row.bid_commission_revenue,
            row.total_item_count,
        ].join(",");
    });

    return [header, ...csvRows].join("\n");
}
