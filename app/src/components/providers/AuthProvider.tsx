"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api-client/client";
import type { MeData, MeResponse } from "@/lib/schema/profile";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";
import { useAuthStore } from "@/stores/auth";
import { OnboardingModal } from "@/components/widgets/OnboardingModal";

const GUEST_AUTH: MeData = {
    user: null,
    profile: null,
    doctorVerification: null,
    vendorVerification: null,
    onboardingRequired: false,
    onboarding: null,
    profileCompletion: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const setAuth = useAuthStore((state) => state.setAuth);
    const queryClient = useQueryClient();
    const supabase = getSupabaseBrowserClient();
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);

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
            }
        });

        return () => subscription.unsubscribe();
    }, [queryClient, setAuth, supabase]);

    // 쿼리 실패 시에도 로딩 고정 방지
    useEffect(() => {
        if (!isError) return;
        queryClient.setQueryData(["auth", "me"], GUEST_AUTH);
        setAuth(GUEST_AUTH);
    }, [isError, queryClient, setAuth]);

    // 데이터 변경 시 스토어 업데이트 + 온보딩 모달 표시 여부 결정
    useEffect(() => {
        if (data) {
            setAuth(data);

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

            setShowOnboardingModal(Boolean(shouldShowModal));
        }
    }, [data, setAuth]);

    return (
        <>
            {children}
            {showOnboardingModal && (
                <OnboardingModal
                    onClose={() => setShowOnboardingModal(false)}
                    onSkip={() => skipOnboardingMutation.mutate()}
                />
            )}
        </>
    );
}
