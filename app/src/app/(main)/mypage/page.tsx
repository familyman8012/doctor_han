"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Camera, User, Mail, Phone, Shield, CheckCircle, Clock, XCircle } from "lucide-react";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { useAuthStore, useProfile, useProfileCompletion } from "@/stores/auth";
import { toast } from "sonner";
import { ProfileCompletionBanner } from "@/components/widgets/ProfileCompletionBanner";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";
import type { FileSignedUploadResponse } from "@/lib/schema/file";
import type { MeData } from "@/lib/schema/profile";

interface ProfileFormData {
    displayName: string;
    phone: string;
}

export default function MyProfilePage() {
    const queryClient = useQueryClient();
    const profile = useProfile();
    const user = useAuthStore((state) => state.user);
    const doctorVerification = useAuthStore((state) => state.doctorVerification);
    const setAuth = useAuthStore((state) => state.setAuth);
    const profileCompletion = useProfileCompletion();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormData>({
        defaultValues: {
            displayName: profile?.displayName ?? "",
            phone: profile?.phone ?? "",
        },
    });

    // 프로필 수정
    const updateMutation = useMutation({
        mutationFn: async (data: { displayName?: string; phone?: string; avatarFileId?: string | null }) => {
            const res = await api.patch("/api/profile", data);
            return res.data;
        },
        onSuccess: async () => {
            toast.success("프로필이 수정되었습니다");
            // me 데이터 새로고침
            const res = await api.get<{ data: MeData }>("/api/me");
            const data = res.data.data;
            setAuth(data);
            queryClient.setQueryData(["auth", "me"], data);
        },
    });

    // 아바타 업로드
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 파일 검증
        if (!file.type.startsWith("image/")) {
            toast.error("이미지 파일만 업로드할 수 있습니다");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("파일 크기는 5MB 이하여야 합니다");
            return;
        }

        setIsUploading(true);
        try {
            const signedRes = await api.post<FileSignedUploadResponse>("/api/files/signed-upload", {
                purpose: "avatar",
                fileName: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
            });

            const { bucket, path, token } = signedRes.data.data.upload;
            const fileId = signedRes.data.data.file.id;

            const supabase = getSupabaseBrowserClient();
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .uploadToSignedUrl(path, token, file, { cacheControl: "3600" });

            if (uploadError) {
                throw uploadError;
            }

            // 프로필 업데이트
            await updateMutation.mutateAsync({ avatarFileId: fileId });
        } catch {
            toast.error("아바타 업로드에 실패했습니다");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // 폼 제출
    const onSubmit = (data: ProfileFormData) => {
        updateMutation.mutate({
            displayName: data.displayName,
            phone: data.phone || undefined,
        });
    };

    const verification = doctorVerification;
    const verificationStatus = verification?.status;

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-2xl font-bold text-[#0a3b41]">프로필 관리</h1>
                <p className="text-gray-500 mt-1">내 정보를 확인하고 수정할 수 있습니다</p>
            </div>

            {/* 프로필 완성도 배너 */}
            {profileCompletion && <ProfileCompletionBanner completion={profileCompletion} />}

            {/* 인증 상태 배너 */}
            {verification && (
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                    verificationStatus === "approved"
                        ? "bg-green-50 text-green-700"
                        : verificationStatus === "pending"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-red-50 text-red-700"
                }`}>
                    {verificationStatus === "approved" ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : verificationStatus === "pending" ? (
                        <Clock className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <div>
                        <p className="font-medium">
                            {verificationStatus === "approved"
                                ? "한의사 인증 완료"
                                : verificationStatus === "pending"
                                ? "인증 심사 중"
                                : "인증 반려"}
                        </p>
                        {verificationStatus === "rejected" && verification.rejectReason && (
                            <p className="text-sm mt-0.5">{verification.rejectReason}</p>
                        )}
                    </div>
                </div>
            )}

            {/* 프로필 카드 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* 아바타 섹션 */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-[#62e3d5]/20 flex items-center justify-center overflow-hidden">
                                {profile?.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt="프로필"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-10 h-10 text-[#62e3d5]" />
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                        <Spinner size="sm" color="white" />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#62e3d5] text-white flex items-center justify-center shadow-md hover:bg-[#4bc7b9] transition-colors disabled:opacity-50"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[#0a3b41]">
                                {profile?.displayName ?? "회원"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                프로필 사진을 변경하려면 카메라 아이콘을 클릭하세요
                            </p>
                        </div>
                    </div>
                </div>

                {/* 폼 섹션 */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    {/* 이름 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            이름 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                {...register("displayName", { required: "이름을 입력해주세요" })}
                                placeholder="이름을 입력하세요"
                                className="pl-10"
                            />
                        </div>
                        {errors.displayName && (
                            <p className="text-sm text-red-500 mt-1">{errors.displayName.message}</p>
                        )}
                    </div>

                    {/* 이메일 (읽기 전용) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            이메일
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                value={user?.email ?? ""}
                                disabled
                                className="pl-10 bg-gray-50"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
                    </div>

                    {/* 연락처 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            연락처
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                {...register("phone")}
                                placeholder="010-0000-0000"
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* 역할 (읽기 전용) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            회원 유형
                        </label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                value="한의사"
                                disabled
                                className="pl-10 bg-gray-50"
                            />
                        </div>
                    </div>

                    {/* 제출 버튼 */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={!isDirty || updateMutation.isPending}
                            isLoading={updateMutation.isPending}
                            className="w-full sm:w-auto"
                        >
                            저장하기
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
