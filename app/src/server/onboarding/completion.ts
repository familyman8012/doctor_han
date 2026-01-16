import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/database.types";
import type { ChecklistItemStatus, ProfileCompletion, ProfileCompletionItem, OnboardingState } from "@/lib/schema/profile";
import { internalServerError } from "@/server/api/errors";

interface CompletionContext {
    supabase: SupabaseClient<Database>;
    userId: string;
    profile: Tables<"profiles">;
}

// 조건부 분모 계산 헬퍼
function calculateScore(checklist: ProfileCompletionItem[]): { score: number; totalPoints: number; maxPoints: number } {
    const applicableItems = checklist.filter(
        item => item.status !== "waiting" && item.status !== "not_applicable"
    );
    const maxPoints = applicableItems.reduce((sum, item) => sum + item.maxPoints, 0);
    const totalPoints = applicableItems.filter(i => i.completed).reduce((sum, i) => sum + i.points, 0);
    const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
    return { score, totalPoints, maxPoints };
}

// Doctor 완성도 계산
export async function calculateDoctorCompletion(ctx: CompletionContext): Promise<ProfileCompletion> {
    const { supabase, userId, profile } = ctx;
    const checklist: ProfileCompletionItem[] = [];

    // 1. 프로필 작성 (20점): profiles 존재 + displayName, phone 입력
    const hasProfile = Boolean(profile.display_name && profile.phone);
    checklist.push({
        key: "profile_created",
        label: "프로필 작성",
        completed: hasProfile,
        points: hasProfile ? 20 : 0,
        maxPoints: 20,
        status: hasProfile ? "completed" : "pending",
        href: hasProfile ? undefined : "/mypage",
    });

    // 2. 인증 제출 (40점): doctor_verifications 레코드 존재
    const { data: verification, error: verificationError } = await supabase
        .from("doctor_verifications")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();

    if (verificationError) {
        throw internalServerError("검수 상태를 조회할 수 없습니다.", {
            message: verificationError.message,
            code: verificationError.code,
        });
    }

    const hasVerification = Boolean(verification);
    checklist.push({
        key: "verification_submitted",
        label: "면허 인증 제출",
        completed: hasVerification,
        points: hasVerification ? 40 : 0,
        maxPoints: 40,
        status: hasVerification ? "completed" : "pending",
        href: hasVerification ? undefined : "/verification/doctor",
    });

    // 3. 인증 승인 (20점): status = 'approved'
    const isApproved = verification?.status === "approved";
    const isPending = verification?.status === "pending";
    const verificationApprovalStatus: ChecklistItemStatus = isApproved
        ? "completed"
        : hasVerification && isPending
            ? "waiting"
            : "pending";
    checklist.push({
        key: "verification_approved",
        label: "면허 인증 승인",
        completed: isApproved,
        points: isApproved ? 20 : 0,
        maxPoints: 20,
        status: verificationApprovalStatus,
        href: verificationApprovalStatus === "pending" ? "/verification/doctor" : undefined,
    });

    // 4. 첫 문의 생성 (20점): leads WHERE doctor_user_id = userId 1건+
    const { count, error: leadCountError } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("doctor_user_id", userId);

    if (leadCountError) {
        throw internalServerError("문의 상태를 조회할 수 없습니다.", {
            message: leadCountError.message,
            code: leadCountError.code,
        });
    }

    const hasLeads = (count ?? 0) > 0;
    checklist.push({
        key: "first_lead_created",
        label: "첫 문의 생성",
        completed: hasLeads,
        points: hasLeads ? 20 : 0,
        maxPoints: 20,
        status: hasLeads ? "completed" : "pending",
        href: hasLeads ? undefined : "/vendors",
    });

    const { score, totalPoints, maxPoints } = calculateScore(checklist);
    return { score, totalPoints, maxPoints, checklist };
}

// Vendor 완성도 계산
export async function calculateVendorCompletion(ctx: CompletionContext): Promise<ProfileCompletion> {
    const { supabase, userId, profile } = ctx;
    const checklist: ProfileCompletionItem[] = [];

    // 1. 프로필 작성 (15점): profiles 존재 + displayName, phone 입력
    const hasProfile = Boolean(profile.display_name && profile.phone);
    checklist.push({
        key: "profile_created",
        label: "프로필 작성",
        completed: hasProfile,
        points: hasProfile ? 15 : 0,
        maxPoints: 15,
        status: hasProfile ? "completed" : "pending",
        href: hasProfile ? undefined : "/partner",
    });

    // 2. 업체 정보 (15점): vendors 존재 + name, description, regionPrimary + vendor_categories 1건+
    const { data: vendor, error: vendorError } = await supabase
        .from("vendors")
        .select("id, name, description, region_primary")
        .eq("user_id", userId)
        .maybeSingle();

    if (vendorError) {
        throw internalServerError("업체 정보를 조회할 수 없습니다.", {
            message: vendorError.message,
            code: vendorError.code,
        });
    }

    let hasVendorInfo = false;
    if (vendor) {
        const { count: categoryCount, error: categoryCountError } = await supabase
            .from("vendor_categories")
            .select("id", { count: "exact", head: true })
            .eq("vendor_id", vendor.id);

        if (categoryCountError) {
            throw internalServerError("카테고리 정보를 조회할 수 없습니다.", {
                message: categoryCountError.message,
                code: categoryCountError.code,
            });
        }

        hasVendorInfo = Boolean(
            vendor.name && vendor.description && vendor.region_primary && (categoryCount ?? 0) > 0
        );
    }
    checklist.push({
        key: "vendor_info_added",
        label: "업체 정보 등록",
        completed: hasVendorInfo,
        points: hasVendorInfo ? 15 : 0,
        maxPoints: 15,
        status: hasVendorInfo ? "completed" : "pending",
        href: hasVendorInfo ? undefined : "/partner",
    });

    // 3. 포트폴리오 (20점): vendor_portfolios + vendor_portfolio_assets 1건+
    let hasPortfolio = false;
    if (vendor) {
        const { count: assetCount, error: assetCountError } = await supabase
            .from("vendor_portfolio_assets")
            .select("id, vendor_portfolios!inner(vendor_id)", { count: "exact", head: true })
            .eq("vendor_portfolios.vendor_id", vendor.id);

        if (assetCountError) {
            throw internalServerError("포트폴리오 정보를 조회할 수 없습니다.", {
                message: assetCountError.message,
                code: assetCountError.code,
            });
        }

        hasPortfolio = (assetCount ?? 0) > 0;
    }
    checklist.push({
        key: "portfolio_added",
        label: "포트폴리오 추가",
        completed: hasPortfolio,
        points: hasPortfolio ? 20 : 0,
        maxPoints: 20,
        status: hasPortfolio ? "completed" : "pending",
        href: hasPortfolio ? undefined : "/partner/portfolios",
    });

    // 4. 인증 제출 (30점): vendor_verifications 레코드 존재
    const { data: verification, error: verificationError } = await supabase
        .from("vendor_verifications")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();

    if (verificationError) {
        throw internalServerError("검수 상태를 조회할 수 없습니다.", {
            message: verificationError.message,
            code: verificationError.code,
        });
    }

    const hasVerification = Boolean(verification);
    checklist.push({
        key: "verification_submitted",
        label: "사업자 인증 제출",
        completed: hasVerification,
        points: hasVerification ? 30 : 0,
        maxPoints: 30,
        status: hasVerification ? "completed" : "pending",
        href: hasVerification ? undefined : "/verification/vendor",
    });

    // 5. 인증 승인 (10점): status = 'approved'
    const isApproved = verification?.status === "approved";
    const isPending = verification?.status === "pending";
    const verificationApprovalStatus: ChecklistItemStatus = isApproved
        ? "completed"
        : hasVerification && isPending
            ? "waiting"
            : "pending";
    checklist.push({
        key: "verification_approved",
        label: "사업자 인증 승인",
        completed: isApproved,
        points: isApproved ? 10 : 0,
        maxPoints: 10,
        status: verificationApprovalStatus,
        href: verificationApprovalStatus === "pending" ? "/verification/vendor" : undefined,
    });

    // 6. 첫 리드 응답 (10점): leads WHERE vendor_id IN (본인 vendors) AND status != 'submitted'
    let hasRespondedLead = false;
    let hasAnyLead = false;
    if (vendor) {
        const { count: totalLeadCount, error: totalLeadCountError } = await supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("vendor_id", vendor.id);

        if (totalLeadCountError) {
            throw internalServerError("리드 상태를 조회할 수 없습니다.", {
                message: totalLeadCountError.message,
                code: totalLeadCountError.code,
            });
        }

        hasAnyLead = (totalLeadCount ?? 0) > 0;

        if (hasAnyLead) {
            const { count: respondedCount, error: respondedCountError } = await supabase
                .from("leads")
                .select("id", { count: "exact", head: true })
                .eq("vendor_id", vendor.id)
                .neq("status", "submitted");

            if (respondedCountError) {
                throw internalServerError("리드 응답 상태를 조회할 수 없습니다.", {
                    message: respondedCountError.message,
                    code: respondedCountError.code,
                });
            }

            hasRespondedLead = (respondedCount ?? 0) > 0;
        }
    }

    const firstLeadResponseStatus: ChecklistItemStatus = hasAnyLead
        ? (hasRespondedLead ? "completed" : "pending")
        : "not_applicable";

    checklist.push({
        key: "first_lead_responded",
        label: "첫 리드 응답",
        completed: hasRespondedLead,
        points: hasRespondedLead ? 10 : 0,
        maxPoints: 10,
        status: firstLeadResponseStatus,
        href: hasRespondedLead || !hasAnyLead ? undefined : "/partner/leads",
    });

    const { score, totalPoints, maxPoints } = calculateScore(checklist);
    return { score, totalPoints, maxPoints, checklist };
}

// 온보딩 상태 조회
export async function fetchOnboardingState(
    supabase: SupabaseClient<Database>,
    userId: string,
    profileCompletion: ProfileCompletion | null,
    role: string
): Promise<OnboardingState | null> {
    if (role !== "doctor" && role !== "vendor") {
        return null;
    }

    const { data, error } = await supabase
        .from("user_onboarding_steps")
        .select("skipped_at, completed_at")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw internalServerError("온보딩 상태를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    // 필수 스텝 완료 여부 계산 (런타임)
    let requiredStepsCompleted = false;
    if (profileCompletion) {
        if (role === "doctor") {
            // doctor: 프로필 + 인증 제출 필수
            const profileItem = profileCompletion.checklist.find(i => i.key === "profile_created");
            const verificationItem = profileCompletion.checklist.find(i => i.key === "verification_submitted");
            requiredStepsCompleted = Boolean(profileItem?.completed && verificationItem?.completed);
        } else if (role === "vendor") {
            // vendor: 프로필 + 인증 제출 필수
            const profileItem = profileCompletion.checklist.find(i => i.key === "profile_created");
            const verificationItem = profileCompletion.checklist.find(i => i.key === "verification_submitted");
            requiredStepsCompleted = Boolean(profileItem?.completed && verificationItem?.completed);
        }
    }

    let skippedAt = data?.skipped_at ?? null;
    let completedAt = data?.completed_at ?? null;

    // 필수 스텝 완료 시 completed_at 자동 설정 (1회성)
    if (requiredStepsCompleted && !completedAt) {
        const now = new Date().toISOString();
        await upsertOnboardingStep(supabase, userId, { completed_at: now, skipped_at: null });
        skippedAt = null;
        completedAt = now;
    }

    return { requiredStepsCompleted, skippedAt, completedAt };
}

// 온보딩 row upsert ("나중에 하기" 또는 완료 처리용)
export async function upsertOnboardingStep(
    supabase: SupabaseClient<Database>,
    userId: string,
    updates: { skipped_at?: string | null; completed_at?: string | null }
): Promise<void> {
    const { error } = await supabase
        .from("user_onboarding_steps")
        .upsert({
            user_id: userId,
            ...updates,
        }, {
            onConflict: "user_id",
        });

    if (error) {
        throw internalServerError("온보딩 상태를 저장할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }
}
