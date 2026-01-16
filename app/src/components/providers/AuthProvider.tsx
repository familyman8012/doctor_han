"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api-client/client";
import type { MeData, MeResponse } from "@/lib/schema/profile";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";
import { useAuthStore } from "@/stores/auth";
import { OnboardingModal } from "@/components/widgets/OnboardingModal";
import { RequiredConsentsModal } from "@/components/widgets/RequiredConsentsModal";

const GUEST_AUTH: MeData = {
    user: null,
    profile: null,
    doctorVerification: null,
    vendorVerification: null,
    onboardingRequired: false,
    onboarding: null,
    profileCompletion: null,
    requiredConsents: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const setAuth = useAuthStore((state) => state.setAuth);
    const queryClient = useQueryClient();
    const supabase = getSupabaseBrowserClient();
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const [showRequiredConsentsModal, setShowRequiredConsentsModal] = useState(false);
    const pathname = usePathname();

    // /api/me 호출하여 사용자 정보 가져오기
    const { data, isError } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: async (): Promise<MeData> => {
            const response = await api.get<MeResponse>("/api/me");
            return response.data.data;
        },
        staleTime: Infinity,
        retry: false,
    });

    // 온보딩 스킵 mutation
    const skipOnboardingMutation = useMutation({
        mutationFn: () => api.patch("/api/onboarding", { action: "skip" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            setShowOnboardingModal(false);
        },
    });

    const agreeRequiredConsentsMutation = useMutation({
        mutationFn: () => api.patch("/api/profile", { termsAgreed: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            setShowRequiredConsentsModal(false);
        },
    });

    // 인증 상태 변경 감지
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                // 세션이 있으면 /api/me 다시 호출
                queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            } else {
                // 세션이 없으면 게스트 상태로 초기화 (로딩 고정 방지)
                queryClient.setQueryData(["auth", "me"], GUEST_AUTH);
                setAuth(GUEST_AUTH);
                setShowOnboardingModal(false);
                setShowRequiredConsentsModal(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [queryClient, setAuth, supabase]);

    // 쿼리 실패 시에도 로딩 고정 방지
    useEffect(() => {
        if (!isError) return;
        queryClient.setQueryData(["auth", "me"], GUEST_AUTH);
        setAuth(GUEST_AUTH);
        setShowOnboardingModal(false);
        setShowRequiredConsentsModal(false);
    }, [isError, queryClient, setAuth]);

    // 데이터 변경 시 스토어 업데이트 + 온보딩 모달 표시 여부 결정
    useEffect(() => {
        if (data) {
            setAuth(data);

            const needsRequiredConsents =
                !data.onboardingRequired &&
                Boolean(data.profile) &&
                Boolean(data.requiredConsents) &&
                (
                    data.requiredConsents!.terms.agreedVersion !== data.requiredConsents!.terms.currentVersion ||
                    data.requiredConsents!.privacy.agreedVersion !== data.requiredConsents!.privacy.currentVersion ||
                    !data.requiredConsents!.terms.agreedAt ||
                    !data.requiredConsents!.privacy.agreedAt
                );

            const isLegalPage = pathname?.startsWith("/legal") ?? false;
            setShowRequiredConsentsModal(Boolean(needsRequiredConsents && !isLegalPage));

            // 온보딩 모달 표시 조건:
            // - 프로필 있음 (onboardingRequired가 false)
            // - 온보딩 데이터 있음
            // - 필수 스텝 미완료
            // - "나중에 하기" 안 함
            // - 완료 처리 안 함
            const shouldShowModal =
                !data.onboardingRequired &&
                data.onboarding &&
                !data.onboarding.requiredStepsCompleted &&
                !data.onboarding.skippedAt &&
                !data.onboarding.completedAt;

            setShowOnboardingModal(Boolean(shouldShowModal && !needsRequiredConsents));
        }
    }, [data, pathname, setAuth]);

    return (
        <>
            {children}
            {showRequiredConsentsModal && data?.requiredConsents && (
                <RequiredConsentsModal
                    currentTermsVersion={data.requiredConsents.terms.currentVersion}
                    currentPrivacyVersion={data.requiredConsents.privacy.currentVersion}
                    isLoading={agreeRequiredConsentsMutation.isPending}
                    onAgree={() => agreeRequiredConsentsMutation.mutate()}
                    onLogout={() => supabase.auth.signOut()}
                />
            )}
            {showOnboardingModal && !showRequiredConsentsModal && (
                <OnboardingModal
                    onClose={() => setShowOnboardingModal(false)}
                    onSkip={() => skipOnboardingMutation.mutate()}
                />
            )}
        </>
    );
}
