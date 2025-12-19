import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zUuid } from "./common";

const zDateString = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다.");

export const VerificationStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const DoctorVerificationViewSchema = z.object({
    id: zUuid,
    userId: zUuid,
    licenseNo: zNonEmptyString,
    fullName: zNonEmptyString,
    birthDate: zDateString.nullable(),
    clinicName: z.string().nullable(),
    licenseFileId: zUuid.nullable(),
    status: VerificationStatusSchema,
    reviewedBy: zUuid.nullable(),
    reviewedAt: z.string().nullable(),
    rejectReason: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type DoctorVerificationView = z.infer<typeof DoctorVerificationViewSchema>;

export const VendorVerificationViewSchema = z.object({
    id: zUuid,
    userId: zUuid,
    businessNo: zNonEmptyString,
    companyName: zNonEmptyString,
    contactName: z.string().nullable(),
    contactPhone: z.string().nullable(),
    contactEmail: z.string().nullable(),
    businessLicenseFileId: zUuid.nullable(),
    status: VerificationStatusSchema,
    reviewedBy: zUuid.nullable(),
    reviewedAt: z.string().nullable(),
    rejectReason: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type VendorVerificationView = z.infer<typeof VendorVerificationViewSchema>;

export const DoctorVerificationUpsertBodySchema = z
    .object({
        licenseNo: zNonEmptyString,
        fullName: zNonEmptyString,
        birthDate: zDateString.optional().nullable(),
        clinicName: z.string().trim().min(1).optional().nullable(),
        licenseFileId: zUuid.optional().nullable(),
    })
    .strict();

export type DoctorVerificationUpsertBody = z.infer<typeof DoctorVerificationUpsertBodySchema>;

export const VendorVerificationUpsertBodySchema = z
    .object({
        businessNo: zNonEmptyString,
        companyName: zNonEmptyString,
        contactName: z.string().trim().min(1).optional().nullable(),
        contactPhone: z.string().trim().min(1).optional().nullable(),
        contactEmail: z.string().trim().email().optional().nullable(),
        businessLicenseFileId: zUuid.optional().nullable(),
    })
    .strict();

export type VendorVerificationUpsertBody = z.infer<typeof VendorVerificationUpsertBodySchema>;

export const DoctorVerificationGetResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        verification: DoctorVerificationViewSchema.nullable(),
    }),
    message: z.string().optional(),
});

export type DoctorVerificationGetResponse = z.infer<typeof DoctorVerificationGetResponseSchema>;

export const VendorVerificationGetResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        verification: VendorVerificationViewSchema.nullable(),
    }),
    message: z.string().optional(),
});

export type VendorVerificationGetResponse = z.infer<typeof VendorVerificationGetResponseSchema>;

export const DoctorVerificationUpsertResponseSchema = DoctorVerificationGetResponseSchema;
export type DoctorVerificationUpsertResponse = z.infer<typeof DoctorVerificationUpsertResponseSchema>;

export const VendorVerificationUpsertResponseSchema = VendorVerificationGetResponseSchema;
export type VendorVerificationUpsertResponse = z.infer<typeof VendorVerificationUpsertResponseSchema>;
