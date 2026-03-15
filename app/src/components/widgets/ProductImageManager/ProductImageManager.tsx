"use client";

import { useCallback, useRef, type ChangeEvent } from "react";
import Image from "next/image";
import { ImagePlus, X, Star, ArrowUp, ArrowDown, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/api-client/client";
import type { FileSignedUploadResponse } from "@/lib/schema/file";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

// ─── Types ───────────────────────────────────────────────

export interface ProductImageItem {
    localId: string;
    fileId?: string;
    previewUrl: string;
    altText?: string;
    isPrimary: boolean;
    sortOrder: number;
    status: "pending" | "uploading" | "done" | "error";
    file?: File;
}

export interface ProductImageManagerProps {
    value: ProductImageItem[];
    onChange: (items: ProductImageItem[]) => void;
    maxImages?: number;
    disabled?: boolean;
}

// ─── Signed Upload Helper ────────────────────────────────

async function uploadProductImage(file: File): Promise<{ fileId: string; url: string }> {
    // Step 1: Get signed upload URL
    const { data: signedRes } = await api.post<FileSignedUploadResponse>("/api/files/signed-upload", {
        purpose: "product_image",
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
    });

    const { file: fileMeta, upload } = signedRes.data;
    const supabase = getSupabaseBrowserClient();

    // Step 2: Upload file to signed URL
    const { error: uploadError } = await supabase.storage
        .from(upload.bucket)
        .uploadToSignedUrl(upload.path, upload.token, file, { cacheControl: "3600" });

    if (uploadError) {
        throw uploadError;
    }

    return {
        fileId: fileMeta.id,
        url: `/api/files/open?fileId=${fileMeta.id}`,
    };
}

// ─── Component ───────────────────────────────────────────

export function ProductImageManager({
    value,
    onChange,
    maxImages = 20,
    disabled = false,
}: ProductImageManagerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(
        async (e: ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length === 0) return;

            const remaining = maxImages - value.length;
            if (remaining <= 0) {
                toast.error(`최대 ${maxImages}장까지 업로드할 수 있습니다.`);
                return;
            }

            const toUpload = files.slice(0, remaining);
            if (toUpload.length < files.length) {
                toast.warning(`${remaining}장만 추가됩니다. (최대 ${maxImages}장)`);
            }

            // Create pending items
            const newItems: ProductImageItem[] = toUpload.map((file, i) => ({
                localId: crypto.randomUUID(),
                previewUrl: URL.createObjectURL(file),
                isPrimary: value.length === 0 && i === 0,
                sortOrder: value.length + i,
                status: "uploading" as const,
                file,
            }));

            const updatedValue = [...value, ...newItems];
            onChange(updatedValue);

            // Upload each file
            for (const item of newItems) {
                try {
                    const result = await uploadProductImage(item.file!);
                    updatedValue.splice(
                        updatedValue.findIndex((v) => v.localId === item.localId),
                        1,
                        { ...item, fileId: result.fileId, previewUrl: result.url, status: "done", file: undefined },
                    );
                    onChange([...updatedValue]);
                } catch {
                    updatedValue.splice(
                        updatedValue.findIndex((v) => v.localId === item.localId),
                        1,
                        { ...item, status: "error" },
                    );
                    onChange([...updatedValue]);
                    toast.error(`"${item.file?.name}" 업로드에 실패했습니다.`);
                }
            }

            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = "";
        },
        [value, onChange, maxImages],
    );

    const handleRemove = useCallback(
        (localId: string) => {
            const filtered = value.filter((v) => v.localId !== localId);
            // If removed item was primary, assign first remaining as primary
            if (filtered.length > 0 && !filtered.some((v) => v.isPrimary)) {
                filtered[0].isPrimary = true;
            }
            onChange(filtered.map((v, i) => ({ ...v, sortOrder: i })));
        },
        [value, onChange],
    );

    const handleSetPrimary = useCallback(
        (localId: string) => {
            onChange(value.map((v) => ({ ...v, isPrimary: v.localId === localId })));
        },
        [value, onChange],
    );

    const handleMove = useCallback(
        (localId: string, direction: "up" | "down") => {
            const idx = value.findIndex((v) => v.localId === localId);
            if (idx < 0) return;
            const newIdx = direction === "up" ? idx - 1 : idx + 1;
            if (newIdx < 0 || newIdx >= value.length) return;

            const newItems = [...value];
            [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
            onChange(newItems.map((v, i) => ({ ...v, sortOrder: i })));
        },
        [value, onChange],
    );

    const handleRetry = useCallback(
        async (localId: string) => {
            const item = value.find((v) => v.localId === localId);
            if (!item?.file) return;

            onChange(value.map((v) => (v.localId === localId ? { ...v, status: "uploading" as const } : v)));

            try {
                const result = await uploadProductImage(item.file);
                onChange(
                    value.map((v) =>
                        v.localId === localId
                            ? { ...v, fileId: result.fileId, previewUrl: result.url, status: "done" as const, file: undefined }
                            : v,
                    ),
                );
            } catch {
                onChange(value.map((v) => (v.localId === localId ? { ...v, status: "error" as const } : v)));
                toast.error("재시도에 실패했습니다.");
            }
        },
        [value, onChange],
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-content-primary">
                    상품 이미지 <span className="text-gray-400 font-normal">({value.length}/{maxImages})</span>
                </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {value.map((item, idx) => (
                    <div
                        key={item.localId}
                        className="relative group aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
                    >
                        {/* Preview */}
                        <Image
                            src={item.previewUrl}
                            alt={item.altText ?? `상품 이미지 ${idx + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                        />

                        {/* Uploading overlay */}
                        {item.status === "uploading" && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}

                        {/* Error overlay */}
                        {item.status === "error" && (
                            <div className="absolute inset-0 bg-red-900/40 flex flex-col items-center justify-center gap-1">
                                <AlertCircle className="w-5 h-5 text-white" />
                                <button
                                    type="button"
                                    onClick={() => handleRetry(item.localId)}
                                    className="text-xs text-white underline"
                                >
                                    재시도
                                </button>
                            </div>
                        )}

                        {/* Primary badge */}
                        {item.isPrimary && (
                            <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                대표
                            </span>
                        )}

                        {/* Hover actions */}
                        {!disabled && item.status !== "uploading" && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
                                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(item.localId)}
                                        className="p-1 bg-white/90 rounded-full hover:bg-red-50 transition-colors"
                                        title="삭제"
                                    >
                                        <X className="w-3.5 h-3.5 text-red-600" />
                                    </button>
                                </div>
                                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => handleSetPrimary(item.localId)}
                                        className={`p-1 rounded-full transition-colors ${
                                            item.isPrimary
                                                ? "bg-primary text-white"
                                                : "bg-white/90 text-gray-500 hover:text-primary"
                                        }`}
                                        title="대표 이미지로 설정"
                                    >
                                        <Star className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="flex gap-1">
                                        {idx > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleMove(item.localId, "up")}
                                                className="p-1 bg-white/90 rounded-full hover:bg-gray-100 transition-colors"
                                                title="앞으로"
                                            >
                                                <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
                                            </button>
                                        )}
                                        {idx < value.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleMove(item.localId, "down")}
                                                className="p-1 bg-white/90 rounded-full hover:bg-gray-100 transition-colors"
                                                title="뒤로"
                                            >
                                                <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add button */}
                {!disabled && value.length < maxImages && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary-25 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary"
                    >
                        <ImagePlus className="w-6 h-6" />
                        <span className="text-xs font-medium">이미지 추가</span>
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />

            <p className="text-xs text-gray-400">
                JPG, PNG, WebP 지원. 최대 {maxImages}장.
                {value.length > 0 && " 별(★) 아이콘을 클릭하여 대표 이미지를 지정하세요."}
            </p>
        </div>
    );
}
