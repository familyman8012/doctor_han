"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Camera, Trash2 } from "lucide-react";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";
import type { FileSignedUploadResponse } from "@/lib/schema/file";

interface PortfolioCreateModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    title: string;
    description: string;
}

interface UploadedFile {
    id: string;
    fileId: string;
    previewUrl: string;
}

export function PortfolioCreateModal({ onClose, onSuccess }: PortfolioCreateModalProps) {
    const queryClient = useQueryClient();
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            title: "",
            description: "",
        },
    });

    // 포트폴리오 생성
    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const assets = uploadedFiles.map((file, index) => ({
                fileId: file.fileId,
                sortOrder: index,
            }));

            await api.post("/api/vendors/me/portfolio", {
                title: data.title,
                description: data.description || null,
                assets,
            });
        },
        onSuccess: () => {
            toast.success("포트폴리오가 등록되었습니다");
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            onSuccess();
        },
    });

    // 이미지 업로드
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;

        if (uploadedFiles.length + files.length > 30) {
            toast.error("이미지는 최대 30장까지 업로드할 수 있습니다");
            return;
        }

        setIsUploading(true);
        try {
            const supabase = getSupabaseBrowserClient();
            const newFiles: UploadedFile[] = [];

            for (const file of Array.from(files)) {
                if (!file.type.startsWith("image/")) continue;
                if (file.size > 10 * 1024 * 1024) {
                    toast.error(`${file.name}: 파일 크기는 10MB 이하여야 합니다`);
                    continue;
                }

                const signedRes = await api.post<FileSignedUploadResponse>("/api/files/signed-upload", {
                    purpose: "portfolio",
                    fileName: file.name,
                    mimeType: file.type,
                    sizeBytes: file.size,
                });

                const { bucket, path, token } = signedRes.data.data.upload;
                const fileId = signedRes.data.data.file.id;

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .uploadToSignedUrl(path, token, file, { cacheControl: "3600" });

                if (uploadError) {
                    throw uploadError;
                }

                // 프리뷰 URL 생성
                const previewUrl = URL.createObjectURL(file);

                newFiles.push({
                    id: crypto.randomUUID(),
                    fileId,
                    previewUrl,
                });
            }

            setUploadedFiles((prev) => [...prev, ...newFiles]);
        } catch {
            toast.error("이미지 업로드에 실패했습니다");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = (id: string) => {
        setUploadedFiles((prev) => {
            const file = prev.find((f) => f.id === id);
            if (file) URL.revokeObjectURL(file.previewUrl);
            return prev.filter((f) => f.id !== id);
        });
    };

    const onSubmit = (data: FormData) => {
        if (uploadedFiles.length === 0) {
            toast.error("최소 1장의 이미지를 업로드해주세요");
            return;
        }
        createMutation.mutate(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-[#0a3b41]">포트폴리오 추가</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-5">
                    {/* 제목 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            제목 <span className="text-red-500">*</span>
                        </label>
                        <Input
                            {...register("title", { required: "제목을 입력해주세요" })}
                            placeholder="포트폴리오 제목"
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    {/* 설명 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            설명 (선택)
                        </label>
                        <textarea
                            {...register("description")}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62e3d5] focus:border-transparent resize-none"
                            placeholder="포트폴리오에 대한 설명"
                        />
                    </div>

                    {/* 이미지 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            이미지 <span className="text-red-500">*</span>
                            <span className="text-gray-400 font-normal ml-1">(최대 30장)</span>
                        </label>

                        <div className="grid grid-cols-4 gap-2">
                            {uploadedFiles.map((file) => (
                                <div key={file.id} className="relative aspect-square rounded-lg overflow-hidden group">
                                    <img
                                        src={file.previewUrl}
                                        alt="포트폴리오 이미지"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(file.id)}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            ))}

                            {uploadedFiles.length < 30 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#62e3d5] hover:text-[#62e3d5] transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <Camera className="w-6 h-6" />
                                    )}
                                </button>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                        />

                        <p className="text-xs text-gray-500 mt-2">
                            전/후 사진이나 작업 과정 사진을 업로드해주세요
                        </p>
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="lg"
                            onClick={onClose}
                            className="flex-1"
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={createMutation.isPending || isUploading}
                            isLoading={createMutation.isPending}
                            className="flex-1"
                        >
                            등록하기
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
