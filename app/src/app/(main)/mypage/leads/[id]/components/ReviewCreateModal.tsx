"use client";

import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { X, Star, Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { cn } from "@/components/utils";
import { toast } from "sonner";
import api from "@/api-client/client";
import { reviewsApi } from "@/api-client/reviews";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";
import type { FileSignedUploadResponse } from "@/lib/schema/file";

interface ReviewCreateModalProps {
    vendorId: string;
    vendorName: string;
    leadId: string;
    productId?: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    rating: number;
    qualityRating: number;
    communicationRating: number;
    speedRating: number;
    content: string;
    amount: string;
    workedAt: string;
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-16 shrink-0">{label}</span>
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="p-0.5"
                    >
                        <Star
                            className={cn(
                                "w-6 h-6 transition-colors",
                                star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                            )}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

export function ReviewCreateModal({ vendorId, vendorName, leadId, productId, onClose, onSuccess }: ReviewCreateModalProps) {
    const [photoFileIds, setPhotoFileIds] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, control, formState: { errors, isDirty } } = useForm<FormData>({
        defaultValues: {
            rating: 0,
            qualityRating: 0,
            communicationRating: 0,
            speedRating: 0,
            content: "",
            amount: "",
            workedAt: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: FormData) =>
            reviewsApi.create({
                vendorId,
                leadId,
                productId,
                rating: data.rating,
                qualityRating: data.qualityRating || undefined,
                communicationRating: data.communicationRating || undefined,
                speedRating: data.speedRating || undefined,
                content: data.content,
                amount: data.amount ? Number(data.amount) : undefined,
                workedAt: data.workedAt || undefined,
                photoFileIds: photoFileIds.length > 0 ? photoFileIds : undefined,
            }),
        onSuccess: () => {
            toast.success("리뷰가 등록되었습니다");
            onSuccess();
        },
        onError: (err: Error) => {
            toast.error(err.message || "리뷰 등록에 실패했습니다");
        },
    });

    const onSubmit = (data: FormData) => {
        if (data.rating === 0) {
            toast.error("총 평점을 선택해주세요");
            return;
        }
        createMutation.mutate(data);
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (photoFileIds.length >= 10) {
            toast.error("사진은 최대 10장까지 첨부할 수 있습니다");
            return;
        }

        setIsUploading(true);
        try {
            const signedRes = await api.post<FileSignedUploadResponse>("/api/files/signed-upload", {
                filename: file.name,
                sizeBytes: file.size,
                mimeType: file.type,
                purpose: "review_photo",
            });
            const { file: fileData, upload } = signedRes.data.data;
            const supabase = getSupabaseBrowserClient();
            const { error } = await supabase.storage
                .from(upload.bucket)
                .uploadToSignedUrl(upload.path, upload.token, file);
            if (error) throw error;
            setPhotoFileIds((prev) => [...prev, fileData.id]);
        } catch {
            toast.error("사진 업로드에 실패했습니다");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold text-content-primary">리뷰 작성</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
                    {/* 업체명 */}
                    <div className="text-sm text-gray-500">
                        <span className="font-medium text-content-primary">{vendorName}</span>에 대한 리뷰
                    </div>

                    {/* 총 평점 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            총 평점 <span className="text-red-500">*</span>
                        </label>
                        <Controller
                            name="rating"
                            control={control}
                            render={({ field }) => (
                                <StarRating value={field.value} onChange={field.onChange} label="총점" />
                            )}
                        />
                    </div>

                    {/* 세부 평점 */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">세부 평점 (선택)</label>
                        <Controller name="qualityRating" control={control} render={({ field }) => (
                            <StarRating value={field.value} onChange={field.onChange} label="품질" />
                        )} />
                        <Controller name="communicationRating" control={control} render={({ field }) => (
                            <StarRating value={field.value} onChange={field.onChange} label="소통" />
                        )} />
                        <Controller name="speedRating" control={control} render={({ field }) => (
                            <StarRating value={field.value} onChange={field.onChange} label="속도" />
                        )} />
                    </div>

                    {/* 리뷰 내용 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            리뷰 내용 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register("content", { required: "리뷰 내용을 입력해주세요", minLength: { value: 10, message: "최소 10자 이상 작성해주세요" } })}
                            placeholder="서비스 이용 경험을 자세히 작성해주세요 (최소 10자)"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-400"
                        />
                        {errors.content && (
                            <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
                        )}
                    </div>

                    {/* 금액 / 작업일 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">이용 금액 (선택)</label>
                            <Input
                                {...register("amount")}
                                type="number"
                                placeholder="예: 500000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">작업일 (선택)</label>
                            <Input
                                {...register("workedAt")}
                                type="date"
                            />
                        </div>
                    </div>

                    {/* 사진 첨부 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            사진 첨부 (선택, 최대 10장)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {photoFileIds.map((fileId) => (
                                <div key={fileId} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`/api/files/open?fileId=${fileId}`}
                                        alt="리뷰 사진"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPhotoFileIds((prev) => prev.filter((id) => id !== fileId))}
                                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 rounded-full"
                                    >
                                        <Trash2 className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                            {photoFileIds.length < 10 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? <Spinner size="sm" /> : <Camera className="w-6 h-6" />}
                                </button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" size="lg" onClick={onClose} className="flex-1">
                            취소
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={createMutation.isPending || !isDirty}
                            isLoading={createMutation.isPending}
                            className="flex-1"
                        >
                            리뷰 등록
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
