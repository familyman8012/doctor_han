"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

interface LoginForm {
    email: string;
    password: string;
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawReturnUrl = searchParams.get("returnUrl");
    const returnUrl =
        rawReturnUrl && rawReturnUrl.startsWith("/") && !rawReturnUrl.startsWith("//")
            ? rawReturnUrl
            : "/";
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

                    <Input
                        label="비밀번호"
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        error={errors.password?.message}
                        {...register("password", {
                            required: "비밀번호를 입력해주세요",
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
