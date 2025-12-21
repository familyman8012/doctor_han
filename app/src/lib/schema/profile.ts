import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zUuid } from "./common";

export const ProfileRoleSchema = z.enum(["doctor", "vendor", "admin"]);
export type ProfileRole = z.infer<typeof ProfileRoleSchema>;

export const ProfileStatusSchema = z.enum(["active", "inactive", "banned"]);
export type ProfileStatus = z.infer<typeof ProfileStatusSchema>;

export const ProfileViewSchema = z.object({
    id: zUuid,
    role: ProfileRoleSchema,
    status: ProfileStatusSchema,
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type ProfileView = z.infer<typeof ProfileViewSchema>;

export const ProfileCreateBodySchema = z.object({
    role: z.enum(["doctor", "vendor"]),
    displayName: zNonEmptyString,
    phone: z.string().trim().min(1).optional(),
}).strict();

export type ProfileCreateBody = z.infer<typeof ProfileCreateBodySchema>;

export const ProfilePatchBodySchema = z
    .object({
        displayName: zNonEmptyString.optional(),
        phone: z.union([z.string().trim().min(1), z.null()]).optional(),
    })
    .strict()
    .refine((value) => value.displayName !== undefined || value.phone !== undefined, {
        message: "수정할 필드가 없습니다.",
    });

export type ProfilePatchBody = z.infer<typeof ProfilePatchBodySchema>;

export const DoctorVerificationSummarySchema = z.object({
    status: z.enum(["pending", "approved", "rejected"]),
    reviewedAt: z.string().nullable(),
    rejectReason: z.string().nullable(),
});

export type DoctorVerificationSummary = z.infer<typeof DoctorVerificationSummarySchema>;

export const VendorVerificationSummarySchema = z.object({
    status: z.enum(["pending", "approved", "rejected"]),
    reviewedAt: z.string().nullable(),
    rejectReason: z.string().nullable(),
});

export type VendorVerificationSummary = z.infer<typeof VendorVerificationSummarySchema>;

export const MeUserSchema = z.object({
    id: zUuid,
    email: z.string().nullable(),
    phone: z.string().nullable(),
});

export type MeUser = z.infer<typeof MeUserSchema>;

export const MeDataSchema = z.object({
    user: MeUserSchema.nullable(),
    profile: ProfileViewSchema.nullable(),
    doctorVerification: DoctorVerificationSummarySchema.nullable(),
    vendorVerification: VendorVerificationSummarySchema.nullable(),
    onboardingRequired: z.boolean(),
});

export type MeData = z.infer<typeof MeDataSchema>;

export const MeResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: MeDataSchema,
    message: z.string().optional(),
});

export type MeResponse = z.infer<typeof MeResponseSchema>;

export const ProfileResponseSchema = z.object({
    code: z.literal(API_SUCCESS_CODE),
    data: z.object({
        profile: ProfileViewSchema,
    }),
    message: z.string().optional(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
