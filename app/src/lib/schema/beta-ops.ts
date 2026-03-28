import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zPaginationQuery, zUuid } from "./common";
import { LeadStatusSchema } from "./lead";

// ============================================
// Daily Check Metrics
// ============================================

export const DailyCheckMetricsSchema = z.object({
    leadsCreatedToday: z.number().int(),
    vendorResponseRate: z.number(),
    avgResponseTimeMinutes: z.number().nullable(),
    unviewedOver24h: z.number().int(),
    notificationFailuresToday: z.number().int(),
    stuckSubmittedLeads: z.number().int(),
});

export type DailyCheckMetrics = z.infer<typeof DailyCheckMetricsSchema>;

export const DailyCheckMetricsResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: DailyCheckMetricsSchema,
    message: z.string().optional(),
});

export type DailyCheckMetricsResponse = z.infer<typeof DailyCheckMetricsResponseSchema>;

// ============================================
// Admin Lead Operations List
// ============================================

export const AdminLeadOpsListQuerySchema = z
    .object({
        status: LeadStatusSchema.optional(),
        vendorId: zUuid.optional(),
        from: z.string().optional(),
        to: z.string().optional(),
    })
    .merge(zPaginationQuery);

export type AdminLeadOpsListQuery = z.infer<typeof AdminLeadOpsListQuerySchema>;

export const AdminLeadOpsItemSchema = z.object({
    id: zUuid,
    doctorName: z.string().nullable(),
    vendorName: z.string().nullable(),
    vendorId: zUuid,
    status: LeadStatusSchema,
    createdAt: z.string(),
    viewedAt: z.string().nullable(),
    responseTimeMinutes: z.number().nullable(),
});

export type AdminLeadOpsItem = z.infer<typeof AdminLeadOpsItemSchema>;

export const AdminLeadOpsListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(AdminLeadOpsItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type AdminLeadOpsListResponse = z.infer<typeof AdminLeadOpsListResponseSchema>;

// ============================================
// Vendor Grade Classification
// ============================================

export const VendorGradeSchema = z.enum(["A", "B", "C"]);

export type VendorGrade = z.infer<typeof VendorGradeSchema>;

export const VendorGradeItemSchema = z.object({
    vendorId: zUuid,
    vendorName: z.string(),
    totalLeads: z.number().int(),
    respondedLeads: z.number().int(),
    responseRate: z.number(),
    avgResponseTimeMinutes: z.number().nullable(),
    unviewedRepeatCount: z.number().int(),
    grade: VendorGradeSchema,
});

export type VendorGradeItem = z.infer<typeof VendorGradeItemSchema>;

export const VendorGradeListQuerySchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
});

export type VendorGradeListQuery = z.infer<typeof VendorGradeListQuerySchema>;

export const VendorGradeListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(VendorGradeItemSchema),
    }),
    message: z.string().optional(),
});

export type VendorGradeListResponse = z.infer<typeof VendorGradeListResponseSchema>;

// ============================================
// Status Change History
// ============================================

export const AdminStatusHistoryQuerySchema = z
    .object({
        leadId: zUuid.optional(),
        vendorId: zUuid.optional(),
        from: z.string().optional(),
        to: z.string().optional(),
    })
    .merge(zPaginationQuery);

export type AdminStatusHistoryQuery = z.infer<typeof AdminStatusHistoryQuerySchema>;

export const AdminStatusHistoryItemSchema = z.object({
    id: zUuid,
    leadId: zUuid,
    fromStatus: LeadStatusSchema.nullable(),
    toStatus: LeadStatusSchema,
    changedByName: z.string().nullable(),
    createdAt: z.string(),
    leadCreatedAt: z.string(),
    timeSinceLeadCreationMinutes: z.number(),
    timeSincePreviousChangeMinutes: z.number().nullable(),
});

export type AdminStatusHistoryItem = z.infer<typeof AdminStatusHistoryItemSchema>;

export const AdminStatusHistoryListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(AdminStatusHistoryItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type AdminStatusHistoryListResponse = z.infer<typeof AdminStatusHistoryListResponseSchema>;
