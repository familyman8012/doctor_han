"use client";

import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { X, Star, Camera, Trash2 } from "lucide-react";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { cn } from "@/components/utils";
import { toast } from "sonner";
import type { MyReviewListItem, ReviewPatchBody } from "@/lib/schema/review";

interface ReviewEditModalProps {
    review: MyReviewListItem;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    rating: number;
    content: string;
    amount: string;
    workedAt: string;
}

export function ReviewEditModal({ review, onClose, onSuccess }: ReviewEditModalProps) {
    const [photoFileIds, setPhotoFileIds] = useState<string[]>(review.photoFileIds);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            rating: review.rating,
            content: review.content,
            amount: review.amount?.toString() ?? "",
            workedAt: review.workedAt ?? "",
        },
    });

    // 리뷰 수정
    const updateMutation = useMutation({
        mutationFn: async (data: ReviewPatchBody) => {
            await api.patch(`/api/reviews/${review.id}`, data);
        },
        onSuccess: () => {
            toast.success("리뷰가 수정되었습니다");
            onSuccess();
        },
    });

    // 사진 업로드
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;

        if (photoFileIds.length + files.length > 10) {
            toast.error("사진은 최대 10장까지 업로드할 수 있습니다");
            return;
        }

        setIsUploading(true);
        try {
            const uploadedIds: string[] = [];

            for (const file of Array.from(files)) {
                if (!file.type.startsWith("image/")) continue;
                if (file.size > 10 * 1024 * 1024) {
                    toast.error(`${file.name}: 파일 크기는 10MB 이하여야 합니다`);
                    continue;
                }

                // Signed URL 발급
                const signedRes = await api.post<{
                    data: { uploadUrl: string; file: { id: string } };
                }>("/api/files/signed-upload", {
                    fileName: file.name,
                    contentType: file.type,
                    purpose: "review_photo",
                });

                const { uploadUrl, file: fileData } = signedRes.data.data;

                // 파일 업로드
                await fetch(uploadUrl, {
                    method: "PUT",
                    body: file,
                    headers: { "Content-Type": file.type },
                });

                uploadedIds.push(fileData.id);
            }

            setPhotoFileIds((prev) => [...prev, ...uploadedIds]);
        } catch {
            toast.error("사진 업로드에 실패했습니다");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removePhoto = (fileId: string) => {
        setPhotoFileIds((prev) => prev.filter((id) => id !== fileId));
    };

    const onSubmit = (data: FormData) => {
        updateMutation.mutate({
            rating: data.rating,
            content: data.content,
            amount: data.amount ? parseInt(data.amount, 10) : null,
            workedAt: data.workedAt || null,
            photoFileIds,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-[#0a3b41]">리뷰 수정</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* 폼 */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-5">
                    {/* 업체명 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">업체</label>
                        <p className="text-[#0a3b41] font-medium">{review.vendor?.name ?? "삭제된 업체"}</p>
                    </div>

                    {/* 별점 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            평점 <span className="text-red-500">*</span>
                        </label>
                        <Controller
                            name="rating"
                            control={control}
                            rules={{ required: true, min: 1, max: 5 }}
                            render={({ field }) => (
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => field.onChange(value)}
                                            className="p-1"
                                        >
                                            <Star
                                                className={cn(
                                                    "w-8 h-8 transition-colors",
                                                    value <= field.value
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-200 hover:text-yellow-200"
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        />
                    </div>

                    {/* 리뷰 내용 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            리뷰 내용 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register("content", { required: "리뷰 내용을 입력해주세요" })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62e3d5] focus:border-transparent resize-none"
                            placeholder="업체 이용 경험을 자세히 작성해주세요"
                        />
                        {errors.content && (
                            <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
                        )}
                    </div>

                    {/* 사진 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            사진 (최대 10장)
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {photoFileIds.map((fileId) => (
                                <div key={fileId} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                                    <img
                                        src={`/api/files/open?fileId=${fileId}`}
                                        alt="리뷰 사진"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(fileId)}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            ))}
                            {photoFileIds.length < 10 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#62e3d5] hover:text-[#62e3d5] transition-colors disabled:opacity-50"
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
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />
                    </div>

                    {/* 이용 금액 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            이용 금액 (선택)
                        </label>
                        <Input
                            {...register("amount")}
                            type="number"
                            placeholder="이용 금액을 입력하세요"
                        />
                    </div>

                    {/* 시술일 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            시술일 (선택)
                        </label>
                        <Input
                            {...register("workedAt")}
                            type="date"
                        />
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
                            disabled={updateMutation.isPending}
                            isLoading={updateMutation.isPending}
                            className="flex-1"
                        >
                            저장하기
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
