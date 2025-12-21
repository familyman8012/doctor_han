"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Upload as UploadIcon, X, FileText, ArrowLeft } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { useAuthStore, useUserRole } from "@/stores/auth";
import type { FileSignedUploadResponse } from "@/lib/schema/file";
import type { VendorVerificationUpsertResponse } from "@/lib/schema/verification";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

interface VendorVerificationForm {
    businessNo: string;
    companyName: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
}

export default function VendorVerificationPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user, profile, isLoading: authLoading, isInitialized } = useAuthStore();
    const role = useUserRole();

    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<VendorVerificationForm>();

    // 파일 업로드 mutation
    const uploadFileMutation = useMutation({
        mutationFn: async (file: File) => {
            // 1. signed URL 발급
            const signedRes = await api.post<FileSignedUploadResponse>("/api/files/signed-upload", {
                purpose: "vendor_business_license",
                fileName: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
            });

            const { bucket, path, token } = signedRes.data.data.upload;
            const fileId = signedRes.data.data.file.id;

            // 2. signed URL로 파일 업로드
            const supabase = getSupabaseBrowserClient();
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .uploadToSignedUrl(path, token, file, { cacheControl: "3600" });

            if (uploadError) {
                throw uploadError;
            }

            return fileId;
        },
    });

    // 검증 제출 mutation
    const verificationMutation = useMutation({
        mutationFn: async (payload: {
            businessNo: string;
            companyName: string;
            contactName?: string | null;
            contactPhone?: string | null;
            contactEmail?: string | null;
            businessLicenseFileId?: string | null;
        }) => {
            const response = await api.post<VendorVerificationUpsertResponse>("/api/vendor/verification", payload);
            return response.data.data.verification;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            toast.success("검수 신청이 완료되었습니다");
            router.push("/verification");
        },
    });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setLicenseFile(file);
        setUploadedFileId(null);
        setIsUploading(true);

        try {
            const fileId = await uploadFileMutation.mutateAsync(file);
            setUploadedFileId(fileId);
            toast.success("파일이 업로드되었습니다");
        } catch {
            setLicenseFile(null);
            setUploadedFileId(null);
            toast.error("파일 업로드에 실패했습니다");
        } finally {
            setIsUploading(false);
        }
    }, [uploadFileMutation]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
            "application/pdf": [".pdf"],
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        disabled: isUploading,
    });

    const removeFile = () => {
        setLicenseFile(null);
        setUploadedFileId(null);
    };

    const onSubmit = async (data: VendorVerificationForm) => {
        if (isUploading) return;
        if (!uploadedFileId) {
            toast.error("사업자등록증 사본을 업로드해주세요");
            return;
        }

        await verificationMutation.mutateAsync({
            businessNo: data.businessNo,
            companyName: data.companyName,
            contactName: data.contactName || null,
            contactPhone: data.contactPhone || null,
            contactEmail: data.contactEmail || null,
            businessLicenseFileId: uploadedFileId,
        });
    };

    // 로딩 중
    if (!isInitialized || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    // 로그인 안 됨
    if (!user) {
        router.replace("/login");
        return null;
    }

    // 프로필 없음
    if (!profile) {
        router.replace("/signup");
        return null;
    }

    // vendor가 아닌 경우
    if (role !== "vendor") {
        router.replace("/");
        return null;
    }

    const isSubmitting = verificationMutation.isPending;

    return (
        <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0a3b41] mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        홈으로
                    </Link>
                    <h1 className="text-2xl font-bold text-[#0a3b41]">업체 인증</h1>
                    <p className="text-gray-500 mt-2">
                        사업자 정보를 입력하고 사업자등록증을 업로드해주세요.
                        <br />
                        관리자 승인 후 모든 기능을 이용하실 수 있습니다.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <Input
                        label="사업자등록번호"
                        placeholder="예: 123-45-67890"
                        error={errors.businessNo?.message}
                        required
                        {...register("businessNo", {
                            required: "사업자등록번호를 입력해주세요",
                        })}
                    />

                    <Input
                        label="업체명"
                        placeholder="사업자등록증에 기재된 상호명"
                        error={errors.companyName?.message}
                        required
                        {...register("companyName", {
                            required: "업체명을 입력해주세요",
                        })}
                    />

                    <div className="border-t border-gray-100 pt-5 mt-5">
                        <h3 className="text-sm font-medium text-[#0a3b41] mb-4">담당자 정보</h3>

                        <div className="space-y-4">
                            <Input
                                label="담당자명"
                                placeholder="담당자 이름"
                                error={errors.contactName?.message}
                                {...register("contactName")}
                            />

                            <Input
                                label="연락처"
                                type="tel"
                                placeholder="예: 010-1234-5678"
                                error={errors.contactPhone?.message}
                                {...register("contactPhone")}
                            />

                            <Input
                                label="이메일"
                                type="email"
                                placeholder="example@company.com"
                                error={errors.contactEmail?.message}
                                {...register("contactEmail", {
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "올바른 이메일 형식이 아닙니다",
                                    },
                                })}
                            />
                        </div>
                    </div>

                    {/* 사업자등록증 업로드 */}
                    <div>
                        <label className="block text-sm font-medium text-[#0a3b41] mb-1.5">
                            사업자등록증 사본
                        </label>

                        {!licenseFile ? (
                            <div
                                {...getRootProps()}
                                className={`
                                    flex flex-col items-center justify-center p-6
                                    border-2 border-dashed rounded-lg cursor-pointer transition-all
                                    ${isDragActive
                                        ? "border-[#62e3d5] bg-[#62e3d5]/5"
                                        : "border-gray-200 hover:border-[#62e3d5] hover:bg-gray-50"
                                    }
                                    ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                            >
                                <input {...getInputProps()} />
                                {isUploading ? (
                                    <Spinner className="w-6 h-6 mb-2" />
                                ) : (
                                    <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                                )}
                                <p className="text-sm text-gray-600 text-center">
                                    {isDragActive
                                        ? "파일을 놓으세요"
                                        : "클릭하거나 파일을 드래그하세요"}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    이미지 또는 PDF (최대 10MB)
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-[#62e3d5]" />
                                    <div>
                                        <p className="text-sm text-[#0a3b41] truncate max-w-[200px]">
                                            {licenseFile.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {(licenseFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={isSubmitting}
                        disabled={isSubmitting || isUploading || !uploadedFileId}
                    >
                        인증 신청하기
                    </Button>
                </form>
            </div>
        </div>
    );
}
