"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { SocialAccountLinking } from "@/components/auth/SocialAccountLinking";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

interface PasswordFormData {
    newPassword: string;
    confirmPassword: string;
}

export default function PartnerSettingsPage() {
    const [isChanging, setIsChanging] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<PasswordFormData>();

    const newPassword = watch("newPassword");

    const onSubmit = async (data: PasswordFormData) => {
        setIsChanging(true);
        try {
            const supabase = getSupabaseBrowserClient();
            const { error } = await supabase.auth.updateUser({
                password: data.newPassword,
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success("비밀번호가 변경되었습니다");
            reset();
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-content-primary">계정 설정</h2>
                <p className="text-sm text-gray-500 mt-1">비밀번호 변경 및 소셜 계정 관리</p>
            </div>

            {/* 비밀번호 변경 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-content-primary mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-gray-400" />
                    비밀번호 변경
                </h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                    <Input
                        label="새 비밀번호"
                        type="password"
                        placeholder="8자 이상 입력하세요"
                        error={errors.newPassword?.message}
                        required
                        {...register("newPassword", {
                            required: "새 비밀번호를 입력해주세요",
                            minLength: {
                                value: 8,
                                message: "비밀번호는 8자 이상이어야 합니다",
                            },
                        })}
                    />
                    <Input
                        label="새 비밀번호 확인"
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        error={errors.confirmPassword?.message}
                        required
                        {...register("confirmPassword", {
                            required: "비밀번호 확인을 입력해주세요",
                            validate: (value) =>
                                value === newPassword || "비밀번호가 일치하지 않습니다",
                        })}
                    />
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        isLoading={isChanging}
                        disabled={isChanging}
                    >
                        비밀번호 변경
                    </Button>
                </form>
            </div>

            <SocialAccountLinking returnUrl="/partner/settings" />
        </div>
    );
}
