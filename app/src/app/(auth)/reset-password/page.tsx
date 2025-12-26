"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

interface ResetPasswordForm {
    email: string;
}

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordForm>();

    const onSubmit = async (data: ResetPasswordForm) => {
        setIsLoading(true);
        try {
            const supabase = getSupabaseBrowserClient();
            // 보안: 가입 여부와 관계없이 동일한 응답
            await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/update-password`,
            });
            setIsSubmitted(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#62e3d5]/10 flex items-center justify-center">
                            <svg className="w-8 h-8 text-[#62e3d5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-[#0a3b41] mb-2">이메일을 확인해주세요</h1>
                        <p className="text-gray-500 mb-6">
                            입력하신 이메일로 비밀번호 재설정 안내를 발송했습니다.
                            <br />
                            이메일이 도착하지 않았다면 스팸함을 확인해주세요.
                        </p>
                        <Link href="/login">
                            <Button variant="secondary" size="lg" className="w-full">
                                로그인으로 돌아가기
                            </Button>
                        </Link>

                        {/* 이메일 분실 안내 */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-sm text-gray-500 mb-2">이메일을 분실하셨나요?</p>
                            <a
                                href="https://pf.kakao.com/_메디허브"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[#0a3b41] font-medium hover:underline"
                            >
                                카카오톡으로 문의하기
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#0a3b41]">비밀번호 재설정</h1>
                    <p className="text-gray-500 mt-2">
                        가입하신 이메일 주소를 입력하시면
                        <br />
                        비밀번호 재설정 링크를 보내드립니다.
                    </p>
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

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        재설정 링크 받기
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <Link href="/login" className="text-[#0a3b41] font-medium hover:underline">
                        로그인으로 돌아가기
                    </Link>
                </div>

                {/* 이메일 분실 안내 */}
                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500 mb-2">이메일을 분실하셨나요?</p>
                    <a
                        href="https://pf.kakao.com/_메디허브"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#0a3b41] font-medium hover:underline"
                    >
                        카카오톡으로 문의하기
                    </a>
                </div>
            </div>
        </div>
    );
}
