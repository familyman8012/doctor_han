"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Upload as UploadIcon, X, FileText, Send } from "lucide-react";
import { useDropzone } from "react-dropzone";
import api from "@/api-client/client";
import { leadsApi } from "@/api-client/leads";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";
import type { VendorDetail } from "@/lib/schema/vendor";
import type { FileSignedUploadResponse } from "@/lib/schema/file";
import type { LeadCreateBody } from "@/lib/schema/lead";

interface InquiryFormProps {
    vendor: VendorDetail;
}

interface InquiryFormData {
    serviceName: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    preferredChannel: string;
    preferredTime: string;
    content: string;
}

interface UploadedFile {
    file: File;
    fileId: string;
    isUploading: boolean;
}

const PREFERRED_CHANNELS = [
    { value: "", label: "선택해주세요" },
    { value: "phone", label: "전화" },
    { value: "email", label: "이메일" },
    { value: "kakao", label: "카카오톡" },
    { value: "sms", label: "문자" },
];

const PREFERRED_TIMES = [
    { value: "", label: "선택해주세요" },
    { value: "morning", label: "오전 (09:00~12:00)" },
    { value: "afternoon", label: "오후 (12:00~18:00)" },
    { value: "evening", label: "저녁 (18:00~21:00)" },
    { value: "anytime", label: "상관없음" },
];

export function InquiryForm({ vendor }: InquiryFormProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isUploadingFile, setIsUploadingFile] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<InquiryFormData>();

    // 파일 업로드
    const uploadFile = async (file: File): Promise<string> => {
        const signedRes = await api.post<FileSignedUploadResponse>("/api/files/signed-upload", {
            purpose: "lead_attachment",
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

        if (uploadError) throw uploadError;
        return fileId;
    };

    // 문의 생성
    const createLeadMutation = useMutation({
        mutationFn: (payload: LeadCreateBody) => leadsApi.create(payload),
        onSuccess: () => {
            toast.success("문의가 접수되었습니다. 업체에서 곧 연락드릴 예정입니다.");
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            router.push("/mypage/leads");
        },
    });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (uploadedFiles.length + acceptedFiles.length > 10) {
            toast.error("파일은 최대 10개까지 첨부할 수 있습니다");
            return;
        }

        setIsUploadingFile(true);

        for (const file of acceptedFiles) {
            const tempFile: UploadedFile = { file, fileId: "", isUploading: true };
            setUploadedFiles((prev) => [...prev, tempFile]);

            try {
                const fileId = await uploadFile(file);
                setUploadedFiles((prev) =>
                    prev.map((f) => (f.file === file ? { ...f, fileId, isUploading: false } : f))
                );
            } catch {
                toast.error(`${file.name} 업로드에 실패했습니다`);
                setUploadedFiles((prev) => prev.filter((f) => f.file !== file));
            }
        }

        setIsUploadingFile(false);
    }, [uploadedFiles.length]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        maxSize: 10 * 1024 * 1024,
        maxFiles: 10,
        disabled: isUploadingFile || uploadedFiles.length >= 10,
    });

    const removeFile = (file: File) => {
        setUploadedFiles((prev) => prev.filter((f) => f.file !== file));
    };

    const onSubmit = async (data: InquiryFormData) => {
        const hasUploadingFiles = uploadedFiles.some((f) => f.isUploading);
        if (hasUploadingFiles) {
            toast.error("파일 업로드가 완료될 때까지 기다려주세요");
            return;
        }

        const attachmentFileIds = uploadedFiles.map((f) => f.fileId).filter(Boolean);

        await createLeadMutation.mutateAsync({
            vendorId: vendor.id,
            serviceName: data.serviceName || null,
            contactName: data.contactName,
            contactPhone: data.contactPhone,
            contactEmail: data.contactEmail || null,
            preferredChannel: data.preferredChannel || null,
            preferredTime: data.preferredTime || null,
            content: data.content,
            attachmentFileIds: attachmentFileIds.length > 0 ? attachmentFileIds : undefined,
        });
    };

    const formatFileSize = (size: number) => {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isSubmitting = createLeadMutation.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
            {/* 서비스명 */}
            <Input
                label="관심 서비스"
                placeholder="예: 원외탕전 서비스, 인테리어 시공 등"
                helperText="문의하고 싶은 서비스를 간단히 적어주세요"
                {...register("serviceName")}
            />

            {/* 연락처 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="이름"
                    placeholder="홍길동"
                    error={errors.contactName?.message}
                    required
                    {...register("contactName", { required: "이름을 입력해주세요" })}
                />
                <Input
                    label="연락처"
                    placeholder="010-0000-0000"
                    error={errors.contactPhone?.message}
                    required
                    {...register("contactPhone", { required: "연락처를 입력해주세요" })}
                />
            </div>

            <Input
                label="이메일"
                type="email"
                placeholder="example@email.com"
                error={errors.contactEmail?.message}
                {...register("contactEmail", {
                    pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "올바른 이메일 형식이 아닙니다",
                    },
                })}
            />

            {/* 선호 연락 방법 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[#0a3b41] mb-1.5">
                        선호 연락 방법
                    </label>
                    <select
                        className="w-full h-[38px] px-3 text-sm text-[#0a3b41] border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62e3d5]"
                        {...register("preferredChannel")}
                    >
                        {PREFERRED_CHANNELS.map((ch) => (
                            <option key={ch.value} value={ch.value}>{ch.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#0a3b41] mb-1.5">
                        선호 연락 시간
                    </label>
                    <select
                        className="w-full h-[38px] px-3 text-sm text-[#0a3b41] border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62e3d5]"
                        {...register("preferredTime")}
                    >
                        {PREFERRED_TIMES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 문의 내용 */}
            <div>
                <label className="block text-sm font-medium text-[#0a3b41] mb-1.5">
                    문의 내용<span className="ml-0.5 text-red-500">*</span>
                </label>
                <textarea
                    className="w-full min-h-[150px] px-3 py-2 text-sm text-[#0a3b41] border border-gray-200 bg-white rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-[#62e3d5] placeholder:text-gray-400"
                    placeholder="문의 내용을 자세히 적어주세요. 예산, 일정, 원하는 서비스 등을 구체적으로 작성하시면 더 정확한 답변을 받으실 수 있습니다."
                    {...register("content", { required: "문의 내용을 입력해주세요" })}
                />
                {errors.content && (
                    <p className="mt-1.5 text-sm text-red-500">{errors.content.message}</p>
                )}
            </div>

            {/* 파일 첨부 */}
            <div>
                <label className="block text-sm font-medium text-[#0a3b41] mb-1.5">
                    첨부파일 <span className="font-normal text-gray-400">(선택, 최대 10개)</span>
                </label>
                <div
                    {...getRootProps()}
                    className={`
                        flex flex-col items-center justify-center p-5
                        border-2 border-dashed rounded-lg cursor-pointer transition-all
                        ${isDragActive ? "border-[#62e3d5] bg-[#62e3d5]/5" : "border-gray-200 hover:border-[#62e3d5] hover:bg-gray-50"}
                        ${isUploadingFile || uploadedFiles.length >= 10 ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                >
                    <input {...getInputProps()} />
                    <UploadIcon className="w-6 h-6 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 text-center">
                        {isDragActive ? "파일을 놓으세요" : "클릭하거나 파일을 드래그하세요"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">최대 10MB</p>
                </div>

                {/* 업로드된 파일 목록 */}
                {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {uploadedFiles.map((uf, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-center gap-3">
                                    {uf.isUploading ? (
                                        <Spinner className="w-4 h-4" />
                                    ) : (
                                        <FileText className="w-5 h-5 text-[#62e3d5]" />
                                    )}
                                    <div>
                                        <p className="text-sm text-[#0a3b41] truncate max-w-[200px]">
                                            {uf.file.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formatFileSize(uf.file.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(uf.file)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    disabled={uf.isUploading}
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 제출 버튼 */}
            <div className="pt-4 border-t border-gray-100">
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || isUploadingFile}
                    LeadingIcon={<Send className="w-5 h-5" />}
                >
                    문의 접수하기
                </Button>
                <p className="text-xs text-gray-400 text-center mt-3">
                    문의 접수 후 업체에서 영업일 기준 1~2일 내에 연락드립니다
                </p>
            </div>
        </form>
    );
}
