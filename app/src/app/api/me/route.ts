import type { Tables } from "@/lib/database.types";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/constants/terms";
import type { DoctorVerificationSummary, VendorVerificationSummary, OnboardingState, ProfileCompletion, RequiredConsents } from "@/lib/schema/profile";
import { internalServerError } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { calculateDoctorCompletion, calculateVendorCompletion, fetchOnboardingState } from "@/server/onboarding/completion";
import { mapProfileRow } from "@/server/profile/mapper";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

type DoctorVerificationSummaryRow = Pick<Tables<"doctor_verifications">, "status" | "reviewed_at" | "reject_reason">;
type VendorVerificationSummaryRow = Pick<Tables<"vendor_verifications">, "status" | "reviewed_at" | "reject_reason">;

function mapDoctorVerification(row: DoctorVerificationSummaryRow): DoctorVerificationSummary {
    return {
        status: row.status,
        reviewedAt: row.reviewed_at,
        rejectReason: row.reject_reason,
    };
}

function mapVendorVerification(row: VendorVerificationSummaryRow): VendorVerificationSummary {
    return {
        status: row.status,
        reviewedAt: row.reviewed_at,
        rejectReason: row.reject_reason,
    };
}

export const GET = withApi(async (_req: NextRequest) => {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.getUser();
    const user = data.user;

    // 게스트(세션 없음)는 정상 케이스로 처리한다.
    if (!user) {
        if (error) {
            console.warn("[GET /api/me] supabase.auth.getUser() returned no user", { error });
        }

        return ok({
            user: null,
            profile: null,
            doctorVerification: null,
            vendorVerification: null,
            onboardingRequired: false,
            onboarding: null,
            profileCompletion: null,
            requiredConsents: null,
        });
    }

    const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
        throw internalServerError("프로필을 조회할 수 없습니다.", {
            message: profileError.message,
            code: profileError.code,
        });
    }

    let doctorVerification: DoctorVerificationSummary | null = null;
    let vendorVerification: VendorVerificationSummary | null = null;

    if (profileRow?.role === "doctor") {
        const { data: row, error: verificationError } = await supabase
            .from("doctor_verifications")
            .select("status, reviewed_at, reject_reason")
            .eq("user_id", user.id)
            .maybeSingle();

        if (verificationError) {
            throw internalServerError("검수 상태를 조회할 수 없습니다.", {
                message: verificationError.message,
                code: verificationError.code,
            });
        }

        if (row) {
            doctorVerification = mapDoctorVerification(row);
        }
    }

    if (profileRow?.role === "vendor") {
        const { data: row, error: verificationError } = await supabase
            .from("vendor_verifications")
            .select("status, reviewed_at, reject_reason")
            .eq("user_id", user.id)
            .maybeSingle();

        if (verificationError) {
            throw internalServerError("검수 상태를 조회할 수 없습니다.", {
                message: verificationError.message,
                code: verificationError.code,
            });
        }

        if (row) {
            vendorVerification = mapVendorVerification(row);
        }
    }

    // 프로필 완성도 계산 (프로필 있는 경우에만)
    let profileCompletion: ProfileCompletion | null = null;
    let onboarding: OnboardingState | null = null;

    if (profileRow && (profileRow.role === "doctor" || profileRow.role === "vendor")) {
        const ctx = { supabase, userId: user.id, profile: profileRow };

        try {
            profileCompletion = profileRow.role === "doctor"
                ? await calculateDoctorCompletion(ctx)
                : await calculateVendorCompletion(ctx);

            onboarding = await fetchOnboardingState(supabase, user.id, profileCompletion, profileRow.role);
        } catch (error) {
            console.warn("[GET /api/me] failed to compute onboarding/profile completion", { error });
            profileCompletion = null;
            onboarding = null;
        }
    }

    // 약관/정책 동의 정보
    const requiredConsents: RequiredConsents | null = profileRow
        ? {
            terms: {
                currentVersion: CURRENT_TERMS_VERSION,
                agreedVersion: profileRow.terms_agreed_version,
                agreedAt: profileRow.terms_agreed_at,
            },
            privacy: {
                currentVersion: CURRENT_PRIVACY_VERSION,
                agreedVersion: profileRow.privacy_agreed_version,
                agreedAt: profileRow.privacy_agreed_at,
            },
        }
        : null;

    return ok({
        user: {
            id: user.id,
            email: user.email ?? null,
            phone: user.phone ?? null,
        },
        profile: profileRow ? mapProfileRow(profileRow) : null,
        doctorVerification,
        vendorVerification,
        onboardingRequired: Boolean(user && !profileRow),
        onboarding,
        profileCompletion,
        requiredConsents,
    });
});
