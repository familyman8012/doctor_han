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

export const LeadDetailSchema = LeadListItemSchema.extend({
    statusHistory: z.array(LeadStatusHistorySchema),
    attachments: z.array(LeadAttachmentSchema),
});

export type LeadDetail = z.infer<typeof LeadDetailSchema>;

export const LeadCreateBodySchema = z
    .object({
        vendorId: zUuid,
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
