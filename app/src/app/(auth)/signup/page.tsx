"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Building2, Stethoscope } from "lucide-react";
import api from "@/api-client/client";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import type { ProfileResponse } from "@/lib/schema/profile";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";
import { cn } from "@/components/utils";

type UserRole = "doctor" | "vendor";

function getSignupErrorMessage(rawError: string): string {
    if (rawError === "no_code") return "소셜 가입에 실패했습니다. 다시 시도해주세요.";
    if (rawError === "auth_failed") return "인증에 실패했습니다. 다시 시도해주세요.";

    const lower = rawError.toLowerCase();
    const looksLikeEmailConflict =
        lower.includes("already registered") || lower.includes("already exists") || lower.includes("already in use");

    if (looksLikeEmailConflict) {
        return "이미 가입된 이메일이 있습니다. 로그인 후 ‘계정 설정’에서 소셜 계정을 연결해주세요.";
    }

    return rawError;
}

interface SignupFormData {
    email: string;
    password: string;
    passwordConfirm: string;
    name: string;
    nickname: string;
}

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleParam = searchParams.get("role");
    const rawError = searchParams.get("error");
    const errorMessage = rawError ? getSignupErrorMessage(rawError) : null;
    const queryClient = useQueryClient();
    const [role, setRole] = useState<UserRole>(
        roleParam === "vendor" ? "vendor" : "doctor"
    );
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignupFormData>();

    const password = watch("password");

    const profileMutation = useMutation({
        mutationFn: async (payload: { role: UserRole; displayName: string }) => {
            const response = await api.post<ProfileResponse>("/api/profile", payload);
            return response.data.data.profile;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
    });

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        try {
            const supabase = getSupabaseBrowserClient();

            // 1. 회원가입
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
            });

            if (authError) {
                if (authError.message.includes("already registered")) {
                    toast.error("이미 등록된 이메일입니다");
                } else {
                    toast.error(authError.message);
                }
                return;
            }

            if (!authData.user) {
                toast.error("회원가입에 실패했습니다");
                return;
            }

            // 2. 프로필 생성 (API를 통해)
            try {
                await profileMutation.mutateAsync({
                    role,
                    displayName: data.nickname.trim(),
                });
            } catch {
                return;
            }

            toast.success("회원가입이 완료되었습니다");

            // 역할에 따라 다음 단계로 이동
            if (role === "doctor") {
                router.push("/verification/doctor");
            } else {
                router.push("/verification/vendor");
            }

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#0a3b41]">회원가입</h1>
                    <p className="text-gray-500 mt-2">메디허브에 가입하고 시작하세요</p>
                </div>

                {errorMessage && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                )}

                {/* 소셜 회원가입 */}
                <SocialLoginButtons mode="signup" />

                {/* 구분선 */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-gray-500">또는 이메일로 가입</span>
                    </div>
                </div>

                {/* 역할 선택 */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-[#0a3b41] mb-2">
                        가입 유형
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
                        label="이메일"
                        type="email"
                        placeholder="example@email.com"
                        error={errors.email?.message}
                        required
                        {...register("email", {
                            required: "이메일을 입력해주세요",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "올바른 이메일 형식이 아닙니다",
                            },
                        })}
                    />

                    <Input
                        label="비밀번호"
                        type="password"
                        placeholder="8자 이상 입력하세요"
                        error={errors.password?.message}
                        required
                        {...register("password", {
                            required: "비밀번호를 입력해주세요",
                            minLength: {
                                value: 8,
                                message: "비밀번호는 8자 이상이어야 합니다",
                            },
                        })}
                    />

                    <Input
                        label="비밀번호 확인"
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        error={errors.passwordConfirm?.message}
                        required
                        {...register("passwordConfirm", {
                            required: "비밀번호 확인을 입력해주세요",
                            validate: (value) =>
                                value === password || "비밀번호가 일치하지 않습니다",
                        })}
                    />

                    <Input
                        label="이름"
                        type="text"
                        placeholder="실명을 입력하세요"
                        error={errors.name?.message}
                        required
                        {...register("name", {
                            required: "이름을 입력해주세요",
                        })}
                    />

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

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        가입하기
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-500">이미 계정이 있으신가요? </span>
                    <Link href="/login" className="text-[#0a3b41] font-medium hover:underline">
                        로그인
                    </Link>
                </div>
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
                    "w-12 h-12 rounded-full flex items-center justify-center",
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

function SignupFormSkeleton() {
    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
                <div className="text-center mb-8">
                    <div className="h-8 w-28 bg-gray-200 rounded mx-auto" />
                    <div className="h-4 w-48 bg-gray-200 rounded mx-auto mt-2" />
                </div>
                <div className="mb-6">
                    <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-28 bg-gray-200 rounded-xl" />
                        <div className="h-28 bg-gray-200 rounded-xl" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded" />
                    <div className="h-10 bg-gray-200 rounded" />
                    <div className="h-10 bg-gray-200 rounded" />
                    <div className="h-10 bg-gray-200 rounded" />
                    <div className="h-10 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<SignupFormSkeleton />}>
            <SignupForm />
        </Suspense>
    );
}
