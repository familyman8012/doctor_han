"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Building2, Stethoscope, ExternalLink } from "lucide-react";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import type { ProfileResponse } from "@/lib/schema/profile";
import { TERMS_URLS } from "@/lib/constants/terms";
import { cn } from "@/components/utils";
import { useAuthStore } from "@/stores/auth";

type UserRole = "doctor" | "vendor";

interface OnboardingFormData {
    nickname: string;
    termsAgreed: boolean;
    marketingAgreed: boolean;
}

function OnboardingForm() {
    const router = useRouter();
    const { user, profile, onboardingRequired, isLoading: authLoading, isInitialized } = useAuthStore();
    const queryClient = useQueryClient();
    const [role, setRole] = useState<UserRole>("doctor");

    const { register, handleSubmit, watch, formState: { errors } } = useForm<OnboardingFormData>();
    const termsAgreed = watch("termsAgreed");

    const profileMutation = useMutation({
        mutationFn: async (payload: { role: UserRole; displayName: string; termsAgreed: true; marketingAgreed?: boolean }) => {
            const response = await api.post<ProfileResponse>("/api/profile", payload);
            return response.data.data.profile;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
    });

    const onSubmit = async (data: OnboardingFormData) => {
        try {
            await profileMutation.mutateAsync({
                role,
                displayName: data.nickname.trim(),
                termsAgreed: true,
                marketingAgreed: data.marketingAgreed || false,
            });

            toast.success("프로필이 생성되었습니다");

            // 역할에 따라 다음 단계로 이동
            if (role === "doctor") {
                router.push("/verification/doctor");
            } else {
                router.push("/verification/vendor");
            }
        } catch {
            // 에러는 중앙화된 핸들러에서 처리
        }
    };

    useEffect(() => {
        if (!isInitialized || authLoading) return;

        if (!user) {
            router.replace("/login?returnUrl=/onboarding");
            return;
        }

        if (!onboardingRequired && profile) {
            router.replace("/");
        }
    }, [authLoading, isInitialized, onboardingRequired, profile, router, user]);

    if (!isInitialized || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#0a3b41]">메디허브에 오신 것을 환영합니다</h1>
                    <p className="text-gray-500 mt-2">시작하기 전에 프로필을 설정해주세요</p>
                </div>

                {/* 역할 선택 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-[#0a3b41] mb-2">
                        회원 유형을 선택해주세요
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <RoleCard
                            icon={<Stethoscope className="w-6 h-6" />}
                            label="한의사"
                            description="업체를 찾고 문의하기"
                            selected={role === "doctor"}
                            onClick={() => setRole("doctor")}
                        />
                        <RoleCard
                            icon={<Building2 className="w-6 h-6" />}
                            label="업체"
                            description="서비스 등록 및 홍보"
                            selected={role === "vendor"}
                            onClick={() => setRole("vendor")}
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="닉네임"
                        type="text"
                        placeholder="사용할 닉네임을 입력하세요"
                        error={errors.nickname?.message}
                        required
                        {...register("nickname", {
                            required: "닉네임을 입력해주세요",
                            minLength: {
                                value: 2,
                                message: "닉네임은 2자 이상이어야 합니다",
                            },
                        })}
                    />

                    {/* 약관 동의 */}
                    <div className="space-y-3 pt-2">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#62e3d5] focus:ring-[#62e3d5]"
                                {...register("termsAgreed", { required: true })}
                            />
                            <span className="text-sm text-gray-700">
                                <span className="text-red-500">(필수)</span>{" "}
                                <a
                                    href={TERMS_URLS.terms}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#0a3b41] underline hover:text-[#62e3d5] inline-flex items-center gap-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    이용약관
                                    <ExternalLink className="h-3 w-3" />
                                </a>{" "}
                                및{" "}
                                <a
                                    href={TERMS_URLS.privacy}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#0a3b41] underline hover:text-[#62e3d5] inline-flex items-center gap-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    개인정보처리방침
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                                에 동의합니다
                            </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#62e3d5] focus:ring-[#62e3d5]"
                                {...register("marketingAgreed")}
                            />
                            <span className="text-sm text-gray-700">
                                <span className="text-gray-400">(선택)</span> 마케팅 정보 수신에 동의합니다
                            </span>
                        </label>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={profileMutation.isPending}
                        disabled={profileMutation.isPending || !termsAgreed}
                    >
                        시작하기
                    </Button>
                </form>
            </div>
        </div>
    );
}

function RoleCard({
    icon,
    label,
    description,
    selected,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                selected
                    ? "border-[#62e3d5] bg-[#62e3d5]/5"
                    : "border-gray-100 hover:border-gray-200"
            )}
        >
            <div
                className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full",
                    selected ? "bg-[#62e3d5]/20 text-[#0a3b41]" : "bg-gray-100 text-gray-400"
                )}
            >
                {icon}
            </div>
            <span className={cn("font-medium", selected ? "text-[#0a3b41]" : "text-gray-600")}>
                {label}
            </span>
            <span className="text-xs text-gray-500 text-center">{description}</span>
        </button>
    );
}

function OnboardingSkeleton() {
    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
                <div className="text-center mb-8">
                    <div className="h-8 w-64 bg-gray-200 rounded mx-auto" />
                    <div className="h-4 w-48 bg-gray-200 rounded mx-auto mt-2" />
                </div>
                <div className="mb-6">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-28 bg-gray-200 rounded-xl" />
                        <div className="h-28 bg-gray-200 rounded-xl" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                </div>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<OnboardingSkeleton />}>
            <OnboardingForm />
        </Suspense>
    );
}
