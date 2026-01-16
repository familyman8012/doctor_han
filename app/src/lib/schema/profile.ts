import { API_SUCCESS_CODE } from "@/lib/api/types";
import { z } from "zod";
import { zNonEmptyString, zUuid } from "./common";

// === 온보딩 & 프로필 완성도 스키마 ===

export const ChecklistItemStatusSchema = z.enum([
    "completed",       // 완료됨
    "pending",         // 미완료 (사용자 행동 필요)
    "waiting",         // 대기중 (admin 승인 등, 사용자 행동 불가)
    "not_applicable",  // 해당 없음 (조건 미충족으로 분모에서 제외)
]);
export type ChecklistItemStatus = z.infer<typeof ChecklistItemStatusSchema>;

export const OnboardingStateSchema = z.object({
    requiredStepsCompleted: z.boolean(),  // 필수 스텝 완료 여부 (런타임 계산)
    skippedAt: z.string().nullable(),     // "나중에 하기" 시점
    completedAt: z.string().nullable(),   // 온보딩 완료 시점
});
export type OnboardingState = z.infer<typeof OnboardingStateSchema>;

export const ProfileCompletionItemSchema = z.object({
    key: z.string(),
    label: z.string(),
    completed: z.boolean(),
    points: z.number(),
    maxPoints: z.number(),
    status: ChecklistItemStatusSchema,
    href: z.string().optional(),  // pending 상태일 때만
});
export type ProfileCompletionItem = z.infer<typeof ProfileCompletionItemSchema>;

export const ProfileCompletionSchema = z.object({
    score: z.number().min(0).max(100),  // 조건부 분모 기준
    totalPoints: z.number(),            // 획득 점수
    maxPoints: z.number(),              // 분모 (waiting/not_applicable 제외)
    checklist: z.array(ProfileCompletionItemSchema),
});
export type ProfileCompletion = z.infer<typeof ProfileCompletionSchema>;

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
    termsAgreed: z.literal(true),
    marketingAgreed: z.boolean().optional(),
}).strict();

export type ProfileCreateBody = z.infer<typeof ProfileCreateBodySchema>;

export const ProfilePatchBodySchema = z
    .object({
        displayName: zNonEmptyString.optional(),
        phone: z.union([z.string().trim().min(1), z.null()]).optional(),
        avatarFileId: z.union([zUuid, z.null()]).optional(),
    })
    .strict()
    .refine((value) => value.displayName !== undefined || value.phone !== undefined || value.avatarFileId !== undefined, {
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

export const TermsConsentSchema = z.object({
    currentVersion: z.string(),
    agreedVersion: z.string().nullable(),
    agreedAt: z.string().nullable(),
});

export type TermsConsent = z.infer<typeof TermsConsentSchema>;

export const MeDataSchema = z.object({
    user: MeUserSchema.nullable(),
    profile: ProfileViewSchema.nullable(),
    doctorVerification: DoctorVerificationSummarySchema.nullable(),
    vendorVerification: VendorVerificationSummarySchema.nullable(),
    onboardingRequired: z.boolean(),
    onboarding: OnboardingStateSchema.nullable(),
    profileCompletion: ProfileCompletionSchema.nullable(),
    termsConsent: TermsConsentSchema.nullable(),
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
