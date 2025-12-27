"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

interface LoginForm {
    email: string;
    password: string;
}

function getLoginErrorMessage(rawError: string): { message: string; showLinkGuide: boolean } {
    if (rawError === "no_code") {
        return { message: "소셜 로그인에 실패했습니다. 다시 시도해주세요.", showLinkGuide: false };
    }

    if (rawError === "auth_failed") {
        return { message: "인증에 실패했습니다. 다시 로그인해주세요.", showLinkGuide: false };
    }

    const lower = rawError.toLowerCase();
    const looksLikeEmailConflict =
        lower.includes("already registered") || lower.includes("already exists") || lower.includes("already in use");

    if (looksLikeEmailConflict) {
        return {
            message: "이미 가입된 이메일이 있습니다. 이메일로 로그인한 뒤 ‘계정 설정’에서 소셜 계정을 연결해주세요.",
            showLinkGuide: false,
        };
    }

    return { message: rawError, showLinkGuide: true };
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawReturnUrl = searchParams.get("returnUrl");
    const returnUrl =
        rawReturnUrl && rawReturnUrl.startsWith("/") && !rawReturnUrl.startsWith("//")
            ? rawReturnUrl
            : "/";
    const rawError = searchParams.get("error");
    const errorInfo = rawError ? getLoginErrorMessage(rawError) : null;
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>();

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        try {
            const supabase = getSupabaseBrowserClient();
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                if (error.message.includes("Invalid login credentials")) {
                    toast.error("이메일 또는 비밀번호가 일치하지 않습니다");
                } else {
                    toast.error(error.message);
                }
                return;
            }

            toast.success("로그인되었습니다");
            router.push(returnUrl);
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#0a3b41]">로그인</h1>
                    <p className="text-gray-500 mt-2">메디허브에 오신 것을 환영합니다</p>
                </div>

                {errorInfo && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <p>{errorInfo.message}</p>
                        {errorInfo.showLinkGuide && (
                            <p className="mt-1 text-xs text-red-600">
                                기존 계정이 있다면 이메일로 로그인한 뒤, 마이페이지/파트너센터의 ‘계정 설정’에서 소셜 계정을
                                연결해주세요.
                            </p>
                        )}
                    </div>
                )}

                {/* 소셜 로그인 */}
                <SocialLoginButtons mode="login" returnUrl={returnUrl} />

                {/* 구분선 */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-gray-500">또는</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="이메일"
                        type="email"
                        placeholder="example@email.com"
                        error={errors.email?.message}
                        {...register("email", {
                            required: "이메일을 입력해주세요",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "올바른 이메일 형식이 아닙니다",
                            },
                        })}
                    />

                    <div>
                        <Input
                            label="비밀번호"
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            error={errors.password?.message}
                            {...register("password", {
                                required: "비밀번호를 입력해주세요",
                            })}
                        />
                        <div className="mt-1.5 text-right">
                            <Link href="/reset-password" className="text-sm text-gray-500 hover:text-[#0a3b41]">
                                비밀번호를 잊으셨나요?
                            </Link>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        로그인
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-500">계정이 없으신가요? </span>
                    <Link href="/signup" className="text-[#0a3b41] font-medium hover:underline">
                        회원가입
                    </Link>
                </div>
            </div>
        </div>
    );
}

function LoginFormSkeleton() {
    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
                <div className="text-center mb-8">
                    <div className="h-8 w-24 bg-gray-200 rounded mx-auto" />
                    <div className="h-4 w-48 bg-gray-200 rounded mx-auto mt-2" />
                </div>
                <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded" />
                    <div className="h-10 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
        </Suspense>
    );
}
