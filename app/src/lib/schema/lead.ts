import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zPaginationQuery, zUuid } from "./common";

export const LeadStatusSchema = z.enum([
    "submitted",
    "in_progress",
    "quote_pending",
    "negotiating",
    "contracted",
    "hold",
    "canceled",
    "closed",
]);

export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const LeadVendorSummarySchema = z.object({
    id: zUuid,
    name: z.string(),
});

export type LeadVendorSummary = z.infer<typeof LeadVendorSummarySchema>;

export const LeadListItemSchema = z.object({
    id: zUuid,
    doctorUserId: zUuid,
    vendorId: zUuid,
    categoryIds: z.array(zUuid),
    serviceName: z.string().nullable(),
    contactName: z.string().nullable(),
    contactPhone: z.string().nullable(),
    contactEmail: z.string().nullable(),
    preferredChannel: z.string().nullable(),
    preferredTime: z.string().nullable(),
    content: z.string().nullable(),
    status: LeadStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
    vendor: LeadVendorSummarySchema.nullable(),
});

export type LeadListItem = z.infer<typeof LeadListItemSchema>;

export const LeadStatusHistorySchema = z.object({
    id: zUuid,
    leadId: zUuid,
    fromStatus: LeadStatusSchema.nullable(),
    toStatus: LeadStatusSchema,
    changedBy: zUuid.nullable(),
    createdAt: z.string(),
});

export type LeadStatusHistory = z.infer<typeof LeadStatusHistorySchema>;

export const LeadAttachmentSchema = z.object({
    id: zUuid,
    leadId: zUuid,
    fileId: zUuid,
    createdBy: zUuid.nullable(),
    createdAt: z.string(),
});

export type LeadAttachment = z.infer<typeof LeadAttachmentSchema>;

// ============================================
// Lead Charge
// ============================================

export const LeadChargeStatusSchema = z.enum([
    "charged",
    "pending",
    "refunded",
    "waived",
    "failed",
]);

export type LeadChargeStatus = z.infer<typeof LeadChargeStatusSchema>;

export const LeadChargeRefundReasonSchema = z.enum([
    "duplicate_30d",
    "no_response_72h",
    "fraud_auto_filter",
    "fraud_vendor_report",
    "admin_manual",
]);

export type LeadChargeRefundReason = z.infer<typeof LeadChargeRefundReasonSchema>;

export const PriceBreakdownItemSchema = z.object({
    categoryId: zUuid,
    categoryName: z.string(),
    price: z.number().int(),
});

export type PriceBreakdownItem = z.infer<typeof PriceBreakdownItemSchema>;

export const LeadChargeSchema = z.object({
    id: zUuid,
    leadId: zUuid,
    vendorId: zUuid,
    creditAccountId: zUuid,
    totalAmount: z.number().int(),
    priceBreakdown: z.array(PriceBreakdownItemSchema),
    status: LeadChargeStatusSchema,
    chargeTransactionId: zUuid.nullable(),
    refundTransactionId: zUuid.nullable(),
    refundReason: LeadChargeRefundReasonSchema.nullable(),
    refundAmount: z.number().int().nullable(),
    refundedAt: z.string().nullable(),
    isDuplicate: z.boolean(),
    duplicateOfLeadId: zUuid.nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type LeadCharge = z.infer<typeof LeadChargeSchema>;

// ============================================
// Lead Report
// ============================================

export const LeadReportReasonSchema = z.enum([
    "wrong_contact",
    "test_inquiry",
    "competitor",
    "inappropriate",
    "other",
]);

export type LeadReportReason = z.infer<typeof LeadReportReasonSchema>;

export const LeadReportStatusSchema = z.enum(["pending", "approved", "dismissed"]);

export type LeadReportStatus = z.infer<typeof LeadReportStatusSchema>;

export const LeadReportBodySchema = z
    .object({
        reason: LeadReportReasonSchema,
        detail: z.string().trim().max(2000).optional(),
    })
    .strict();

export type LeadReportBody = z.infer<typeof LeadReportBodySchema>;

export const LeadReportSchema = z.object({
    id: zUuid,
    leadId: zUuid,
    reporterUserId: zUuid,
    reason: LeadReportReasonSchema,
    detail: z.string().nullable(),
    status: LeadReportStatusSchema,
    reviewedBy: zUuid.nullable(),
    reviewedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type LeadReport = z.infer<typeof LeadReportSchema>;

export const LeadReportReviewBodySchema = z
    .object({
        action: z.enum(["approve", "dismiss"]),
    })
    .strict();

export type LeadReportReviewBody = z.infer<typeof LeadReportReviewBodySchema>;

export const LeadReportListQuerySchema = z
    .object({
        status: LeadReportStatusSchema.optional(),
    })
    .merge(zPaginationQuery)
    .strict();

export type LeadReportListQuery = z.infer<typeof LeadReportListQuerySchema>;

// ============================================
// Lead Detail (extended)
// ============================================

export const LeadDetailSchema = LeadListItemSchema.extend({
    statusHistory: z.array(LeadStatusHistorySchema),
    attachments: z.array(LeadAttachmentSchema),
    charge: LeadChargeSchema.nullable(),
});

export type LeadDetail = z.infer<typeof LeadDetailSchema>;

export const LeadCreateBodySchema = z
    .object({
        vendorId: zUuid,
        categoryIds: z.array(zUuid).min(1).max(10),
        serviceName: z.string().trim().min(1).optional().nullable(),
        contactName: zNonEmptyString,
        contactPhone: zNonEmptyString,
        contactEmail: z.string().trim().email().optional().nullable(),
        preferredChannel: z.string().trim().min(1).optional().nullable(),
        preferredTime: z.string().trim().min(1).optional().nullable(),
        content: zNonEmptyString,
        attachmentFileIds: z.array(zUuid).max(10).optional(),
    })
    .strict();

export type LeadCreateBody = z.infer<typeof LeadCreateBodySchema>;

export const LeadListQuerySchema = z
    .object({
        status: LeadStatusSchema.optional(),
    })
    .merge(zPaginationQuery)
    .strict();

export type LeadListQuery = z.infer<typeof LeadListQuerySchema>;

export const LeadStatusPatchBodySchema = z
    .object({
        status: LeadStatusSchema,
    })
    .strict();

export type LeadStatusPatchBody = z.infer<typeof LeadStatusPatchBodySchema>;

export const LeadListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(LeadListItemSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type LeadListResponse = z.infer<typeof LeadListResponseSchema>;

export const LeadDetailResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        lead: LeadDetailSchema,
    }),
    message: z.string().optional(),
});

export type LeadDetailResponse = z.infer<typeof LeadDetailResponseSchema>;

// ============================================
// Lead Messages
// ============================================

export const LeadMessageAttachmentSchema = z.object({
    id: zUuid,
    messageId: zUuid,
    fileId: zUuid,
    createdAt: z.string(),
});

export type LeadMessageAttachment = z.infer<typeof LeadMessageAttachmentSchema>;

export const LeadMessageSchema = z.object({
    id: zUuid,
    leadId: zUuid,
    senderId: zUuid,
    content: z.string(),
    readAt: z.string().nullable(),
    createdAt: z.string(),
    attachments: z.array(LeadMessageAttachmentSchema),
});

export type LeadMessage = z.infer<typeof LeadMessageSchema>;

export const LeadMessageCreateBodySchema = z
    .object({
        content: z.string().trim().min(1).max(5000),
        attachmentFileIds: z.array(zUuid).max(5).optional(),
    })
    .strict();

export type LeadMessageCreateBody = z.infer<typeof LeadMessageCreateBodySchema>;

export const LeadMessagesListQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(50).default(20),
    })
    .strict();

export type LeadMessagesListQuery = z.infer<typeof LeadMessagesListQuerySchema>;

export const LeadMessagesListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(LeadMessageSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
        unreadCount: z.number().int(),
    }),
    message: z.string().optional(),
});

export type LeadMessagesListResponse = z.infer<
    typeof LeadMessagesListResponseSchema
>;

export const LeadMessageResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        message: LeadMessageSchema,
    }),
    message: z.string().optional(),
});

export type LeadMessageResponse = z.infer<typeof LeadMessageResponseSchema>;

export const LeadMessageReadPatchBodySchema = z
    .object({
        messageIds: z.array(zUuid).min(1),
    })
    .strict();

export type LeadMessageReadPatchBody = z.infer<
    typeof LeadMessageReadPatchBodySchema
>;

// ============================================
// Lead Report Responses
// ============================================

export const LeadReportResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        report: LeadReportSchema,
    }),
    message: z.string().optional(),
});

export type LeadReportResponse = z.infer<typeof LeadReportResponseSchema>;

export const LeadReportListResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        items: z.array(LeadReportSchema),
        page: z.number().int(),
        pageSize: z.number().int(),
        total: z.number().int(),
    }),
    message: z.string().optional(),
});

export type LeadReportListResponse = z.infer<typeof LeadReportListResponseSchema>;
