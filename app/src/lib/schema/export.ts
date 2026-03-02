import { z } from "zod";
import { zUuid } from "./common";
import { LeadStatusSchema } from "./lead";
import { PaymentStatusSchema } from "./payment";
import { SettlementStatusSchema } from "./settlement";

// ============================================
// Export Query Schemas
// ============================================

const zDateYmd = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다");

export const ExportPaymentsQuerySchema = z.object({
    status: PaymentStatusSchema.optional(),
    dateFrom: zDateYmd.optional(),
    dateTo: zDateYmd.optional(),
});

export type ExportPaymentsQuery = z.infer<typeof ExportPaymentsQuerySchema>;

export const ExportSettlementsQuerySchema = z.object({
    status: SettlementStatusSchema.optional(),
    vendorId: zUuid.optional(),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
});

export type ExportSettlementsQuery = z.infer<typeof ExportSettlementsQuerySchema>;

export const ExportLeadsQuerySchema = z.object({
    status: LeadStatusSchema.optional(),
    dateFrom: zDateYmd.optional(),
    dateTo: zDateYmd.optional(),
});

export type ExportLeadsQuery = z.infer<typeof ExportLeadsQuerySchema>;
