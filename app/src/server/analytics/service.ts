import "server-only";

import type {
    AdAnalytics,
    AnalyticsQuery,
    FunnelAnalytics,
    LeadAnalytics,
    OperationsAnalytics,
    OverviewStats,
    RevenueAnalytics,
    UserAnalytics,
} from "@/lib/schema/analytics";
import { badRequest } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { toAdTimeSeries, toAmountTimeSeries, toTimeSeries } from "./mapper";
import {
    countActiveCampaigns,
    countContractedLeadsInPeriod,
    countDoctorRegistrationsInPeriod,
    countDoctorVerificationsInPeriod,
    countLeadsInPeriod,
    countNewProfilesInPeriod,
    countOpenTickets,
    countPendingRefunds,
    countPendingReports,
    countPendingVerifications,
    countProfilesByRole,
    countProfilesByStatus,
    countResolvedReportsInPeriod,
    countTotalCampaigns,
    countTotalLeads,
    countTotalProfiles,
    countTotalReviews,
    countVendorRegistrationsInPeriod,
    countVendorVerificationsInPeriod,
    getAdCampaignRevenueInPeriod,
    getAdImpressionsInPeriod,
    getAdPurchaseRevenueInPeriod,
    getBidCommissionRevenueInPeriod,
    getCreditChargeRevenueInPeriod,
    getLeadChargeRevenueInPeriod,
    getLeadsByStatusInPeriod,
    getLeadsTimeSeries,
    getMembershipRevenueInPeriod,
    getNewUsersTimeSeries,
    getPaymentsTimeSeries,
    getResolvedTicketsInPeriod,
    getSubscriptionRevenueInPeriod,
    getTicketsTimeSeries,
    getTotalPaymentRevenue,
} from "./repository";

// ============================================
// Period Helpers
// ============================================

const MAX_DAYS = 365;

const DAY_MS = 1000 * 60 * 60 * 24;

function parseDateOnly(value: string): Date {
    return new Date(value + "T00:00:00Z");
}

function formatDateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
}

function startOfTodayUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function validateAndNormalizePeriod(query: AnalyticsQuery): {
    fromDate: string;
    toDate: string;
    fromISO: string;
    toExclusiveISO: string;
} {
    const fromDate = parseDateOnly(query.from);
    let toDate = parseDateOnly(query.to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw badRequest("유효하지 않은 날짜 형식입니다.");
    }

    const today = startOfTodayUtc();
    if (toDate > today) {
        toDate = today;
    }

    if (fromDate > toDate) {
        throw badRequest("시작일은 종료일보다 이전이어야 합니다.");
    }

    const diffDaysInclusive = Math.floor((toDate.getTime() - fromDate.getTime()) / DAY_MS) + 1;
    if (diffDaysInclusive > MAX_DAYS) {
        throw badRequest(`최대 조회 기간은 ${MAX_DAYS}일입니다.`);
    }

    const toExclusiveDate = new Date(toDate);
    toExclusiveDate.setUTCDate(toExclusiveDate.getUTCDate() + 1);

    return {
        fromDate: formatDateOnly(fromDate),
        toDate: formatDateOnly(toDate),
        fromISO: fromDate.toISOString(),
        toExclusiveISO: toExclusiveDate.toISOString(),
    };
}

// ============================================
// 1. Overview
// ============================================

export async function getOverviewStats(query: AnalyticsQuery): Promise<OverviewStats> {
    const admin = createSupabaseAdminClient();
    const { fromISO, toExclusiveISO } = validateAndNormalizePeriod(query);

    const [
        totalUsers,
        roleCounts,
        totalLeads,
        totalRevenue,
        totalReviews,
        newUsersInPeriod,
        newLeadsInPeriod,
        revenueInPeriod,
    ] = await Promise.all([
        countTotalProfiles(admin),
        countProfilesByRole(admin),
        countTotalLeads(admin),
        getTotalPaymentRevenue(admin),
        countTotalReviews(admin),
        countNewProfilesInPeriod(admin, fromISO, toExclusiveISO),
        countLeadsInPeriod(admin, fromISO, toExclusiveISO),
        getCreditChargeRevenueInPeriod(admin, fromISO, toExclusiveISO),
    ]);

    return {
        totalUsers,
        totalDoctors: roleCounts.doctor,
        totalVendors: roleCounts.vendor,
        totalLeads,
        totalRevenue,
        totalReviews,
        newUsersInPeriod,
        newLeadsInPeriod,
        revenueInPeriod,
    };
}

// ============================================
// 2. Users Analytics
// ============================================

export async function getUserAnalytics(query: AnalyticsQuery): Promise<UserAnalytics> {
    const admin = createSupabaseAdminClient();
    const { fromDate, toDate, fromISO, toExclusiveISO } = validateAndNormalizePeriod(query);

    const [totalUsers, byRole, byStatus, newUsersRaw] = await Promise.all([
        countTotalProfiles(admin),
        countProfilesByRole(admin),
        countProfilesByStatus(admin),
        getNewUsersTimeSeries(admin, fromISO, toExclusiveISO),
    ]);

    const newUsersTrend = toTimeSeries(newUsersRaw, fromDate, toDate, query.granularity);

    return {
        totalUsers,
        byRole,
        byStatus,
        newUsersTrend,
    };
}

// ============================================
// 3. Leads Analytics
// ============================================

export async function getLeadAnalytics(query: AnalyticsQuery): Promise<LeadAnalytics> {
    const admin = createSupabaseAdminClient();
    const { fromDate, toDate, fromISO, toExclusiveISO } = validateAndNormalizePeriod(query);

    const [totalLeads, leadsInPeriod, statusRows, leadsRaw, contractedCount] = await Promise.all([
        countTotalLeads(admin),
        countLeadsInPeriod(admin, fromISO, toExclusiveISO),
        getLeadsByStatusInPeriod(admin, fromISO, toExclusiveISO),
        getLeadsTimeSeries(admin, fromISO, toExclusiveISO),
        countContractedLeadsInPeriod(admin, fromISO, toExclusiveISO),
    ]);

    // Aggregate by status
    const byStatus: Record<string, number> = {};
    for (const row of statusRows) {
        byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    }

    const leadsTrend = toTimeSeries(leadsRaw, fromDate, toDate, query.granularity);

    // Calculate avg leads per day
    const normalizedFromDate = parseDateOnly(fromDate);
    const normalizedToDate = parseDateOnly(toDate);
    const daysDiff =
        Math.max(1, Math.floor((normalizedToDate.getTime() - normalizedFromDate.getTime()) / DAY_MS) + 1);
    const avgLeadsPerDay = Number((leadsInPeriod / daysDiff).toFixed(2));

    // Conversion rate: contracted / total in period
    const conversionRate = leadsInPeriod > 0 ? Number(((contractedCount / leadsInPeriod) * 100).toFixed(2)) : 0;

    return {
        totalLeads,
        leadsInPeriod,
        byStatus,
        leadsTrend,
        avgLeadsPerDay,
        conversionRate,
    };
}

// ============================================
// 4. Revenue Analytics
// ============================================

export async function getRevenueAnalytics(query: AnalyticsQuery): Promise<RevenueAnalytics> {
    const admin = createSupabaseAdminClient();
    const { fromDate, toDate, fromISO, toExclusiveISO } = validateAndNormalizePeriod(query);

    const [
        totalRevenue,
        leadChargeData,
        subscriptionRevenue,
        membershipRevenue,
        adPurchaseRevenue,
        bidCommissionRevenue,
        creditChargeRevenue,
        paymentsRaw,
    ] = await Promise.all([
        getTotalPaymentRevenue(admin),
        getLeadChargeRevenueInPeriod(admin, fromISO, toExclusiveISO),
        getSubscriptionRevenueInPeriod(admin, fromISO, toExclusiveISO),
        getMembershipRevenueInPeriod(admin, fromISO, toExclusiveISO),
        getAdPurchaseRevenueInPeriod(admin, fromISO, toExclusiveISO),
        getBidCommissionRevenueInPeriod(admin, fromISO, toExclusiveISO),
        getCreditChargeRevenueInPeriod(admin, fromISO, toExclusiveISO),
        getPaymentsTimeSeries(admin, fromISO, toExclusiveISO),
    ]);

    const revenueInPeriod =
        leadChargeData.total + subscriptionRevenue + membershipRevenue + adPurchaseRevenue + bidCommissionRevenue;
    const refundsInPeriod = leadChargeData.refunds;
    const netRevenueInPeriod = revenueInPeriod - refundsInPeriod;

    const revenueTrend = toAmountTimeSeries(paymentsRaw, fromDate, toDate, query.granularity);

    return {
        totalRevenue,
        revenueInPeriod,
        refundsInPeriod,
        netRevenueInPeriod,
        breakdown: {
            leadCharges: leadChargeData.total,
            subscriptions: subscriptionRevenue,
            memberships: membershipRevenue,
            adPurchases: adPurchaseRevenue,
            bidCommissions: bidCommissionRevenue,
            creditCharges: creditChargeRevenue,
        },
        revenueTrend,
    };
}

// ============================================
// 5. Ads Analytics
// ============================================

export async function getAdAnalytics(query: AnalyticsQuery): Promise<AdAnalytics> {
    const admin = createSupabaseAdminClient();
    const { fromDate, toDate, fromISO, toExclusiveISO } = validateAndNormalizePeriod(query);

    const [totalCampaigns, activeCampaigns, impressionsData, adRevenue] = await Promise.all([
        countTotalCampaigns(admin),
        countActiveCampaigns(admin),
        getAdImpressionsInPeriod(admin, fromDate, toDate),
        getAdCampaignRevenueInPeriod(admin, fromISO, toExclusiveISO),
    ]);

    let totalImpressions = 0;
    let totalClicks = 0;
    for (const row of impressionsData) {
        totalImpressions += row.impressions;
        totalClicks += row.clicks;
    }

    const overallCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

    const adSeries = toAdTimeSeries(impressionsData, fromDate, toDate, query.granularity);

    return {
        totalCampaigns,
        activeCampaigns,
        totalImpressions,
        totalClicks,
        overallCtr,
        adRevenue,
        impressionsTrend: adSeries.impressions,
        clicksTrend: adSeries.clicks,
    };
}

// ============================================
// 6. Funnel Analytics
// ============================================

export async function getFunnelAnalytics(query: AnalyticsQuery): Promise<FunnelAnalytics> {
    const admin = createSupabaseAdminClient();
    const { fromISO, toExclusiveISO } = validateAndNormalizePeriod(query);

    const [
        doctorRegistrations,
        doctorVerifications,
        vendorRegistrations,
        vendorVerifications,
        leadsInPeriod,
        contractedLeads,
    ] = await Promise.all([
        countDoctorRegistrationsInPeriod(admin, fromISO, toExclusiveISO),
        countDoctorVerificationsInPeriod(admin, fromISO, toExclusiveISO),
        countVendorRegistrationsInPeriod(admin, fromISO, toExclusiveISO),
        countVendorVerificationsInPeriod(admin, fromISO, toExclusiveISO),
        countLeadsInPeriod(admin, fromISO, toExclusiveISO),
        countContractedLeadsInPeriod(admin, fromISO, toExclusiveISO),
    ]);

    const totalRegistrations = doctorRegistrations + vendorRegistrations;
    const totalVerificationSubmitted = doctorVerifications.submitted + vendorVerifications.submitted;
    const totalVerificationApproved = doctorVerifications.approved + vendorVerifications.approved;

    const registrationToVerification = [
        {
            step: "registration",
            count: totalRegistrations,
            rate: 100,
        },
        {
            step: "verification_submitted",
            count: totalVerificationSubmitted,
            rate: totalRegistrations > 0 ? Number(((totalVerificationSubmitted / totalRegistrations) * 100).toFixed(2)) : 0,
        },
        {
            step: "verification_approved",
            count: totalVerificationApproved,
            rate: totalRegistrations > 0 ? Number(((totalVerificationApproved / totalRegistrations) * 100).toFixed(2)) : 0,
        },
    ];

    const leadToContract = [
        {
            step: "lead_created",
            count: leadsInPeriod,
            rate: 100,
        },
        {
            step: "contracted",
            count: contractedLeads,
            rate: leadsInPeriod > 0 ? Number(((contractedLeads / leadsInPeriod) * 100).toFixed(2)) : 0,
        },
    ];

    return {
        registrationToVerification,
        leadToContract,
    };
}

// ============================================
// 7. Operations Analytics
// ============================================

export async function getOperationsAnalytics(query: AnalyticsQuery): Promise<OperationsAnalytics> {
    const admin = createSupabaseAdminClient();
    const { fromDate, toDate, fromISO, toExclusiveISO } = validateAndNormalizePeriod(query);

    const [
        openTickets,
        resolvedTicketsRaw,
        pendingReports,
        resolvedReportsInPeriod,
        pendingVerifications,
        pendingRefunds,
        ticketsRaw,
    ] = await Promise.all([
        countOpenTickets(admin),
        getResolvedTicketsInPeriod(admin, fromISO, toExclusiveISO),
        countPendingReports(admin),
        countResolvedReportsInPeriod(admin, fromISO, toExclusiveISO),
        countPendingVerifications(admin),
        countPendingRefunds(admin),
        getTicketsTimeSeries(admin, fromISO, toExclusiveISO),
    ]);

    // Calculate average resolution time in hours
    let avgResolutionHours: number | null = null;
    if (resolvedTicketsRaw.length > 0) {
        let totalHours = 0;
        let validCount = 0;
        for (const ticket of resolvedTicketsRaw) {
            if (ticket.resolved_at) {
                const created = new Date(ticket.created_at).getTime();
                const resolved = new Date(ticket.resolved_at).getTime();
                const hours = (resolved - created) / (1000 * 60 * 60);
                totalHours += hours;
                validCount++;
            }
        }
        if (validCount > 0) {
            avgResolutionHours = Number((totalHours / validCount).toFixed(1));
        }
    }

    const ticketsTrend = toTimeSeries(ticketsRaw, fromDate, toDate, query.granularity);

    return {
        openTickets,
        resolvedTicketsInPeriod: resolvedTicketsRaw.length,
        avgResolutionHours,
        pendingReports,
        resolvedReportsInPeriod,
        pendingVerifications,
        pendingRefunds,
        ticketsTrend,
    };
}
