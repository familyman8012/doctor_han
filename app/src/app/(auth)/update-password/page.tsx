"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

interface UpdatePasswordForm {
    password: string;
    confirmPassword: string;
}

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<UpdatePasswordForm>();

    const password = watch("password");

    // 세션 확인 (비밀번호 재설정 링크 클릭 후 리다이렉트된 경우)
    useEffect(() => {
        const checkSession = async () => {
            const supabase = getSupabaseBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            setIsValidSession(!!session);
        };
        checkSession();
    }, []);

    const onSubmit = async (data: UpdatePasswordForm) => {
        setIsLoading(true);
        try {
            const supabase = getSupabaseBrowserClient();
            const { error } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success("비밀번호가 변경되었습니다");
            router.push("/login");
        } finally {
            setIsLoading(false);
        }
    };

    // 세션 확인 중
    if (isValidSession === null) {
        return (
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-2 border-[#62e3d5] border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    // 유효하지 않은 세션 (링크 만료 또는 직접 접근)
    if (!isValidSession) {
        return (
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-[#0a3b41] mb-2">링크가 만료되었습니다</h1>
                        <p className="text-gray-500 mb-6">
                            비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.
                            <br />
                            다시 요청해주세요.
                        </p>
                        <Link href="/reset-password">
                            <Button variant="primary" size="lg" className="w-full">
                                비밀번호 재설정 다시 요청
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#0a3b41]">새 비밀번호 설정</h1>
                    <p className="text-gray-500 mt-2">새로운 비밀번호를 입력해주세요.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="새 비밀번호"
                        type="password"
                        placeholder="8자 이상, 영문/숫자 포함"
                        error={errors.password?.message}
                        {...register("password", {
                            required: "비밀번호를 입력해주세요",
                            minLength: {
                                value: 8,
                                message: "비밀번호는 8자 이상이어야 합니다",
                            },
                            pattern: {
                                value: /^(?=.*[A-Za-z])(?=.*\d)/,
                                message: "영문과 숫자를 포함해야 합니다",
                            },
                        })}
                    />

                    <Input
                        label="비밀번호 확인"
                        type="password"
                        placeholder="비밀번호를 다시 입력해주세요"
                        error={errors.confirmPassword?.message}
                        {...register("confirmPassword", {
                            required: "비밀번호 확인을 입력해주세요",
                            validate: (value) =>
                                value === password || "비밀번호가 일치하지 않습니다",
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
                        비밀번호 변경
                    </Button>
                </form>
            </div>
        </div>
    );
}
