import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";

// ============================================
// Common Query Parameters
// ============================================

export const GranularitySchema = z.enum(["daily", "weekly", "monthly"]);
export type Granularity = z.infer<typeof GranularitySchema>;

export const AnalyticsQuerySchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다"),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다"),
    granularity: GranularitySchema.optional().default("daily"),
});
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

// ============================================
// Time Series Data Point
// ============================================

export const TimeSeriesPointSchema = z.object({
    date: z.string(),
    value: z.number(),
});
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;

// ============================================
// 1. Overview Response
// ============================================

export const OverviewStatsSchema = z.object({
    totalUsers: z.number().int(),
    totalDoctors: z.number().int(),
    totalVendors: z.number().int(),
    totalLeads: z.number().int(),
    totalRevenue: z.number().int(),
    totalReviews: z.number().int(),
    newUsersInPeriod: z.number().int(),
    newLeadsInPeriod: z.number().int(),
    revenueInPeriod: z.number().int(),
});
export type OverviewStats = z.infer<typeof OverviewStatsSchema>;

export const OverviewResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: OverviewStatsSchema,
    message: z.string().optional(),
});
export type OverviewResponse = z.infer<typeof OverviewResponseSchema>;

// ============================================
// 2. Users Analytics Response
// ============================================

export const UserAnalyticsSchema = z.object({
    totalUsers: z.number().int(),
    byRole: z.object({
        doctor: z.number().int(),
        vendor: z.number().int(),
        admin: z.number().int(),
    }),
    byStatus: z.object({
        active: z.number().int(),
        inactive: z.number().int(),
        banned: z.number().int(),
    }),
    newUsersTrend: z.array(TimeSeriesPointSchema),
});
export type UserAnalytics = z.infer<typeof UserAnalyticsSchema>;

export const UserAnalyticsResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: UserAnalyticsSchema,
    message: z.string().optional(),
});
export type UserAnalyticsResponse = z.infer<typeof UserAnalyticsResponseSchema>;

// ============================================
// 3. Leads Analytics Response
// ============================================

export const LeadAnalyticsSchema = z.object({
    totalLeads: z.number().int(),
    leadsInPeriod: z.number().int(),
    byStatus: z.record(z.string(), z.number().int()),
    leadsTrend: z.array(TimeSeriesPointSchema),
    avgLeadsPerDay: z.number(),
    conversionRate: z.number(),
});
export type LeadAnalytics = z.infer<typeof LeadAnalyticsSchema>;

export const LeadAnalyticsResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: LeadAnalyticsSchema,
    message: z.string().optional(),
});
export type LeadAnalyticsResponse = z.infer<typeof LeadAnalyticsResponseSchema>;

// ============================================
// 4. Revenue Analytics Response
// ============================================

export const RevenueBreakdownSchema = z.object({
    leadCharges: z.number().int(),
    subscriptions: z.number().int(),
    memberships: z.number().int(),
    adPurchases: z.number().int(),
    bidCommissions: z.number().int(),
    creditCharges: z.number().int(),
});
export type RevenueBreakdown = z.infer<typeof RevenueBreakdownSchema>;

export const RevenueAnalyticsSchema = z.object({
    totalRevenue: z.number().int(),
    revenueInPeriod: z.number().int(),
    refundsInPeriod: z.number().int(),
    netRevenueInPeriod: z.number().int(),
    breakdown: RevenueBreakdownSchema,
    revenueTrend: z.array(TimeSeriesPointSchema),
});
export type RevenueAnalytics = z.infer<typeof RevenueAnalyticsSchema>;

export const RevenueAnalyticsResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: RevenueAnalyticsSchema,
    message: z.string().optional(),
});
export type RevenueAnalyticsResponse = z.infer<typeof RevenueAnalyticsResponseSchema>;

// ============================================
// 5. Ads Analytics Response
// ============================================

export const AdAnalyticsSchema = z.object({
    totalCampaigns: z.number().int(),
    activeCampaigns: z.number().int(),
    totalImpressions: z.number().int(),
    totalClicks: z.number().int(),
    overallCtr: z.number(),
    adRevenue: z.number().int(),
    impressionsTrend: z.array(TimeSeriesPointSchema),
    clicksTrend: z.array(TimeSeriesPointSchema),
});
export type AdAnalytics = z.infer<typeof AdAnalyticsSchema>;

export const AdAnalyticsResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: AdAnalyticsSchema,
    message: z.string().optional(),
});
export type AdAnalyticsResponse = z.infer<typeof AdAnalyticsResponseSchema>;

// ============================================
// 6. Funnel Analytics Response
// ============================================

export const FunnelStepSchema = z.object({
    step: z.string(),
    count: z.number().int(),
    rate: z.number(),
});
export type FunnelStep = z.infer<typeof FunnelStepSchema>;

export const FunnelAnalyticsSchema = z.object({
    registrationToVerification: z.array(FunnelStepSchema),
    leadToContract: z.array(FunnelStepSchema),
});
export type FunnelAnalytics = z.infer<typeof FunnelAnalyticsSchema>;

export const FunnelAnalyticsResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: FunnelAnalyticsSchema,
    message: z.string().optional(),
});
export type FunnelAnalyticsResponse = z.infer<typeof FunnelAnalyticsResponseSchema>;

// ============================================
// 7. Operations Analytics Response
// ============================================

export const OperationsAnalyticsSchema = z.object({
    openTickets: z.number().int(),
    resolvedTicketsInPeriod: z.number().int(),
    avgResolutionHours: z.number().nullable(),
    pendingReports: z.number().int(),
    resolvedReportsInPeriod: z.number().int(),
    pendingVerifications: z.number().int(),
    pendingRefunds: z.number().int(),
    ticketsTrend: z.array(TimeSeriesPointSchema),
});
export type OperationsAnalytics = z.infer<typeof OperationsAnalyticsSchema>;

export const OperationsAnalyticsResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: OperationsAnalyticsSchema,
    message: z.string().optional(),
});
export type OperationsAnalyticsResponse = z.infer<typeof OperationsAnalyticsResponseSchema>;
