import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================
// User Counts
// ============================================

export async function countProfilesByRole(
    supabase: SupabaseClient<Database>,
): Promise<{ doctor: number; vendor: number; admin: number }> {
    const { data, error } = await supabase.from("profiles").select("role", { count: "exact", head: false });

    if (error) {
        throw internalServerError("사용자 역할별 수를 조회할 수 없습니다.", { message: error.message });
    }

    const counts = { doctor: 0, vendor: 0, admin: 0 };
    for (const row of data ?? []) {
        if (row.role === "doctor") counts.doctor++;
        else if (row.role === "vendor") counts.vendor++;
        else if (row.role === "admin") counts.admin++;
    }
    return counts;
}

export async function countProfilesByStatus(
    supabase: SupabaseClient<Database>,
): Promise<{ active: number; inactive: number; banned: number }> {
    const { data, error } = await supabase.from("profiles").select("status", { count: "exact", head: false });

    if (error) {
        throw internalServerError("사용자 상태별 수를 조회할 수 없습니다.", { message: error.message });
    }

    const counts = { active: 0, inactive: 0, banned: 0 };
    for (const row of data ?? []) {
        if (row.status === "active") counts.active++;
        else if (row.status === "inactive") counts.inactive++;
        else if (row.status === "banned") counts.banned++;
    }
    return counts;
}

export async function countTotalProfiles(supabase: SupabaseClient<Database>): Promise<number> {
    const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });

    if (error) {
        throw internalServerError("전체 사용자 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

export async function countNewProfilesInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("기간 내 신규 사용자 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

export async function getNewUsersTimeSeries(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<{ created_at: string }[]> {
    const { data, error } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", from)
        .lt("created_at", to)
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("사용자 트렌드 데이터를 조회할 수 없습니다.", { message: error.message });
    }

    return data ?? [];
}

// ============================================
// Lead Counts
// ============================================

export async function countTotalLeads(supabase: SupabaseClient<Database>): Promise<number> {
    const { count, error } = await supabase.from("leads").select("*", { count: "exact", head: true });

    if (error) {
        throw internalServerError("전체 리드 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

export async function countLeadsInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("기간 내 리드 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

export async function getLeadsByStatusInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<{ status: string }[]> {
    const { data, error } = await supabase
        .from("leads")
        .select("status")
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("리드 상태별 수를 조회할 수 없습니다.", { message: error.message });
    }

    return data ?? [];
}

export async function getLeadsTimeSeries(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<{ created_at: string }[]> {
    const { data, error } = await supabase
        .from("leads")
        .select("created_at")
        .gte("created_at", from)
        .lt("created_at", to)
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("리드 트렌드 데이터를 조회할 수 없습니다.", { message: error.message });
    }

    return data ?? [];
}

export async function countContractedLeadsInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "contracted")
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("계약 전환 리드 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

// ============================================
// Revenue
// ============================================

export async function getTotalPaymentRevenue(supabase: SupabaseClient<Database>): Promise<number> {
    const { data, error } = await supabase.from("payments").select("amount").eq("status", "done");

    if (error) {
        throw internalServerError("전체 결제 수익을 조회할 수 없습니다.", { message: error.message });
    }

    let sum = 0;
    for (const row of data ?? []) {
        sum += row.amount;
    }
    return sum;
}

export async function getLeadChargeRevenueInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<{ total: number; refunds: number }> {
    const { data, error } = await supabase
        .from("lead_charges")
        .select("total_amount, refund_amount, status")
        .in("status", ["charged", "refunded"])
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("리드 과금 수익을 조회할 수 없습니다.", { message: error.message });
    }

    let total = 0;
    let refunds = 0;
    for (const row of data ?? []) {
        total += row.total_amount;
        refunds += row.refund_amount ?? 0;
    }
    return { total, refunds };
}

export async function getSubscriptionRevenueInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { data, error } = await supabase
        .from("vendor_subscriptions")
        .select("price_paid")
        .not("credit_transaction_id", "is", null)
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("구독 수익을 조회할 수 없습니다.", { message: error.message });
    }

    let sum = 0;
    for (const row of data ?? []) {
        sum += row.price_paid;
    }
    return sum;
}

export async function getMembershipRevenueInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { data, error } = await supabase
        .from("vendor_memberships")
        .select("price_paid")
        .not("credit_transaction_id", "is", null)
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("멤버십 수익을 조회할 수 없습니다.", { message: error.message });
    }

    let sum = 0;
    for (const row of data ?? []) {
        sum += row.price_paid;
    }
    return sum;
}

export async function getAdPurchaseRevenueInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { data, error } = await supabase
        .from("ad_priority_purchases")
        .select("price_paid")
        .in("status", ["active", "expired"])
        .not("credit_transaction_id", "is", null)
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("광고 구매 수익을 조회할 수 없습니다.", { message: error.message });
    }

    let sum = 0;
    for (const row of data ?? []) {
        sum += row.price_paid;
    }
    return sum;
}

export async function getBidCommissionRevenueInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { data, error } = await supabase
        .from("bid_contracts")
        .select("commission_amount")
        .eq("commission_status", "charged")
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("비딩 수수료 수익을 조회할 수 없습니다.", { message: error.message });
    }

    let sum = 0;
    for (const row of data ?? []) {
        sum += row.commission_amount ?? 0;
    }
    return sum;
}

export async function getCreditChargeRevenueInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { data, error } = await supabase
        .from("payments")
        .select("amount")
        .eq("status", "done")
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("크레딧 충전 수익을 조회할 수 없습니다.", { message: error.message });
    }

    let sum = 0;
    for (const row of data ?? []) {
        sum += row.amount;
    }
    return sum;
}

export async function getPaymentsTimeSeries(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<{ created_at: string; amount: number }[]> {
    const { data, error } = await supabase
        .from("payments")
        .select("created_at, amount")
        .eq("status", "done")
        .gte("created_at", from)
        .lt("created_at", to)
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("결제 트렌드 데이터를 조회할 수 없습니다.", { message: error.message });
    }

    return data ?? [];
}

// ============================================
// Reviews
// ============================================

export async function countTotalReviews(supabase: SupabaseClient<Database>): Promise<number> {
    const { count, error } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

    if (error) {
        throw internalServerError("전체 리뷰 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

// ============================================
// Ads Analytics
// ============================================

export async function countTotalCampaigns(supabase: SupabaseClient<Database>): Promise<number> {
    const { count, error } = await supabase.from("ad_campaigns").select("*", { count: "exact", head: true });

    if (error) {
        throw internalServerError("전체 캠페인 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

export async function countActiveCampaigns(supabase: SupabaseClient<Database>): Promise<number> {
    const { count, error } = await supabase
        .from("ad_campaigns")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

    if (error) {
        throw internalServerError("활성 캠페인 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

export async function getAdImpressionsInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<{ date: string; impressions: number; clicks: number }[]> {
    const { data, error } = await supabase
        .from("ad_impressions")
        .select("date, impressions, clicks")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true });

    if (error) {
        throw internalServerError("광고 노출 데이터를 조회할 수 없습니다.", { message: error.message });
    }

    return data ?? [];
}

export async function getAdCampaignRevenueInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { data, error } = await supabase
        .from("ad_campaigns")
        .select("monthly_price")
        .in("status", ["active", "completed"])
        .gte("starts_at", from)
        .lt("starts_at", to);

    if (error) {
        throw internalServerError("광고 캠페인 수익을 조회할 수 없습니다.", { message: error.message });
    }

    let sum = 0;
    for (const row of data ?? []) {
        sum += row.monthly_price;
    }
    return sum;
}

// ============================================
// Funnel Analytics
// ============================================

export async function countDoctorRegistrationsInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "doctor")
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("기간 내 의사 가입 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

export async function countDoctorVerificationsInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<{ submitted: number; approved: number }> {
    const { data, error } = await supabase
        .from("doctor_verifications")
        .select("status")
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("의사 인증 데이터를 조회할 수 없습니다.", { message: error.message });
    }

    let submitted = 0;
    let approved = 0;
    for (const row of data ?? []) {
        submitted++;
        if (row.status === "approved") approved++;
    }
    return { submitted, approved };
}

export async function countVendorRegistrationsInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "vendor")
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("기간 내 업체 가입 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

export async function countVendorVerificationsInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<{ submitted: number; approved: number }> {
    const { data, error } = await supabase
        .from("vendor_verifications")
        .select("status")
        .gte("created_at", from)
        .lt("created_at", to);

    if (error) {
        throw internalServerError("업체 인증 데이터를 조회할 수 없습니다.", { message: error.message });
    }

    let submitted = 0;
    let approved = 0;
    for (const row of data ?? []) {
        submitted++;
        if (row.status === "approved") approved++;
    }
    return { submitted, approved };
}

// ============================================
// Operations Analytics
// ============================================

export async function countOpenTickets(supabase: SupabaseClient<Database>): Promise<number> {
    const { count, error } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]);

    if (error) {
        throw internalServerError("미해결 티켓 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

export async function getResolvedTicketsInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<{ created_at: string; resolved_at: string | null }[]> {
    const { data, error } = await supabase
        .from("support_tickets")
        .select("created_at, resolved_at")
        .in("status", ["resolved", "closed"])
        .not("resolved_at", "is", null)
        .gte("resolved_at", from)
        .lt("resolved_at", to);

    if (error) {
        throw internalServerError("해결된 티켓 데이터를 조회할 수 없습니다.", { message: error.message });
    }

    return data ?? [];
}

export async function getTicketsTimeSeries(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<{ created_at: string }[]> {
    const { data, error } = await supabase
        .from("support_tickets")
        .select("created_at")
        .gte("created_at", from)
        .lt("created_at", to)
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("티켓 트렌드 데이터를 조회할 수 없습니다.", { message: error.message });
    }

    return data ?? [];
}

export async function countPendingReports(supabase: SupabaseClient<Database>): Promise<number> {
    const { count, error } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "reviewing"]);

    if (error) {
        throw internalServerError("대기 중 신고 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

export async function countResolvedReportsInPeriod(
    supabase: SupabaseClient<Database>,
    from: string,
    to: string,
): Promise<number> {
    const { count, error } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .in("status", ["resolved", "dismissed"])
        .gte("updated_at", from)
        .lt("updated_at", to);

    if (error) {
        throw internalServerError("처리된 신고 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}

export async function countPendingVerifications(supabase: SupabaseClient<Database>): Promise<number> {
    const [doctorResult, vendorResult] = await Promise.all([
        supabase
            .from("doctor_verifications")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
        supabase
            .from("vendor_verifications")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
    ]);

    if (doctorResult.error) {
        throw internalServerError("대기 중 의사 인증 수를 조회할 수 없습니다.", {
            message: doctorResult.error.message,
        });
    }
    if (vendorResult.error) {
        throw internalServerError("대기 중 업체 인증 수를 조회할 수 없습니다.", {
            message: vendorResult.error.message,
        });
    }

    return (doctorResult.count ?? 0) + (vendorResult.count ?? 0);
}

export async function countPendingRefunds(supabase: SupabaseClient<Database>): Promise<number> {
    const { count, error } = await supabase
        .from("refund_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

    if (error) {
        throw internalServerError("대기 중 환불 요청 수를 조회할 수 없습니다.", { message: error.message });
    }

    return count ?? 0;
}
