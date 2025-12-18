"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Download, File, FileSpreadsheet, FileText, Image, Trash2, Upload, X } from "lucide-react";
import React, { forwardRef, useCallback, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { deleteFileUsage, fetchDownloadUrl, listFileUsages, uploadFile } from "@/api-client/files";
import { Button } from "@/components/ui/Button/button";

type PendingAttachment = {
    id: string;
    file: File;
};

const generateLocalId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `local-${Math.random().toString(36).slice(2)}`;

export interface UploadBlockProps {
    domain: string;
    entityId?: string | null;
    purposeCode: string;
    readOnly?: boolean;
    multiple?: boolean;
    accept?: string;
    maxFiles?: number;
    className?: string;
    onUploadComplete?: (summary: { success: number; failed: number }) => void;
}

export interface UploadBlockHandle {
    uploadAllTo: (entityId: string) => Promise<{ success: number; failed: number }>;
    clearStaged: () => void;
}

export const UploadBlock = forwardRef<UploadBlockHandle, UploadBlockProps>(
    (
        {
            domain,
            entityId,
            purposeCode,
            readOnly = false,
            multiple = true,
            accept,
            maxFiles,
            className,
            onUploadComplete,
        },
        ref,
    ) => {
        const queryClient = useQueryClient();
        const listKey = useMemo(() => ["fileUsages", domain, entityId ?? "_none"], [domain, entityId]);

        const [pending, setPending] = useState<PendingAttachment[]>([]);
        const [isUploading, setIsUploading] = useState(false);
        const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
        const fileInputRef = useRef<HTMLInputElement | null>(null);
        const fileInputId = useId();

        const usagesQuery = useQuery({
            queryKey: listKey,
            queryFn: () => listFileUsages({ domain, entityId: entityId! }),
            enabled: !!entityId,
        });
        const usages = usagesQuery.data ?? [];

        const deleteUsageMutation = useMutation({
            mutationFn: (usageId: string) => deleteFileUsage(usageId),
            onSuccess: async () => {
                await queryClient.invalidateQueries({ queryKey: listKey });
                toast.success("첨부 파일을 삭제했습니다.");
            },
        });

        const formatFileSize = useCallback((bytes: number) => {
            if (!Number.isFinite(bytes) || bytes < 0) return "-";
            const units = ["B", "KB", "MB", "GB"];
            let value = bytes;
            let index = 0;
            while (value >= 1024 && index < units.length - 1) {
                value /= 1024;
                index += 1;
            }
            const formatted = index === 0 ? Math.round(value) : value < 10 ? value.toFixed(1) : value.toFixed(0);
            return `${formatted} ${units[index]}`;
        }, []);

        const getFileIcon = useCallback((fileName: string) => {
            const ext = fileName.split(".").pop()?.toLowerCase() || "";
            if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
                return <Image className="h-5 w-5 text-blue-500" />;
            } else if (["xlsx", "xls", "csv"].includes(ext)) {
                return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
            } else if (["doc", "docx", "txt", "pdf"].includes(ext)) {
                return <FileText className="h-5 w-5 text-red-500" />;
            }
            return <File className="h-5 w-5 text-gray-400" />;
        }, []);

        const handlePendingFileSelect = useCallback(
            (files: FileList | null) => {
                if (!files || files.length === 0) return;
                const selectedFiles = Array.from(files);

                // 파일 크기 체크 (10MB = 10 * 1024 * 1024 bytes)
                const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
                const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);

                if (oversizedFiles.length > 0) {
                    const fileNames = oversizedFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join('\n');
                    alert(`다음 파일이 10MB를 초과합니다:\n${fileNames}\n\n파일당 최대 크기는 10MB입니다.`);

                    // 10MB 이하 파일만 필터링
                    const validFiles = selectedFiles.filter(file => file.size <= MAX_FILE_SIZE);
                    if (validFiles.length === 0) {
                        if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                        }
                        return;
                    }
                    // 유효한 파일만 처리
                    const next = validFiles.map((file) => ({ id: generateLocalId(), file }));
                    setPending((prev) => {
                        const merged = [...prev, ...next];
                        if (typeof maxFiles === "number") {
                            return merged.slice(0, maxFiles);
                        }
                        return merged;
                    });
                } else {
                    const next = selectedFiles.map((file) => ({ id: generateLocalId(), file }));
                    setPending((prev) => {
                        const merged = [...prev, ...next];
                        if (typeof maxFiles === "number") {
                            return merged.slice(0, maxFiles);
                        }
                        return merged;
                    });
                }

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            },
            [maxFiles, formatFileSize],
        );

        const handleClearPending = useCallback((id?: string) => {
            if (typeof id === "string") {
                setPending((prev) => prev.filter((item) => item.id !== id));
            } else {
                setPending([]);
            }
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }, []);

        const handleDownload = useCallback(
            async (fileId: string, fileName?: string) => {
                try {
                    setDownloadingFileId(fileId);
                    const url = await fetchDownloadUrl(fileId);

                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error("다운로드에 실패했습니다.");
                    }

                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);

                    const link = document.createElement("a");
                    link.href = blobUrl;
                    link.download = fileName || "download";
                    link.style.display = "none";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    window.URL.revokeObjectURL(blobUrl);
                } catch (error) {
                    const message =
                        error instanceof Error && error.message ? error.message : "파일 다운로드에 실패했습니다.";
                    toast.error(message);
                } finally {
                    setDownloadingFileId(null);
                }
            },
            [],
        );

        async function uploadTargets(targets: PendingAttachment[], targetEntityId: string) {
            setIsUploading(true);
            const failedIds: string[] = [];
            try {
                for (const attachment of targets) {
                    try {
                        const formData = new FormData();
                        formData.append("file", attachment.file);
                        formData.append("purposeCode", purposeCode);
                        formData.append("domain", domain);
                        formData.append("entityId", targetEntityId);
                        await uploadFile(formData);
                    } catch (error) {
                        failedIds.push(attachment.id);
                    }
                }
                const success = targets.length - failedIds.length;
                if (success > 0) {
                    toast.success(`${success}개의 파일을 업로드했습니다.`);
                    await queryClient.invalidateQueries({ queryKey: ["fileUsages", domain, targetEntityId] });
                }
                if (failedIds.length > 0) {
                    toast.error(`${failedIds.length}개의 파일 업로드에 실패했습니다.`);
                }
                setPending((prev) => prev.filter((p) => failedIds.includes(p.id)));
                if (fileInputRef.current) fileInputRef.current.value = "";
                onUploadComplete?.({ success, failed: failedIds.length });
                return { success, failed: failedIds.length };
            } finally {
                setIsUploading(false);
            }
        }

        const handleUploadNow = useCallback(
            async (id?: string) => {
                if (!entityId) {
                    toast.error("엔티티가 생성된 후 업로드할 수 있습니다.");
                    return { success: 0, failed: 0 };
                }
                const targets = id ? pending.filter((p) => p.id === id) : pending;
                if (targets.length === 0) {
                    toast.error("업로드할 파일을 먼저 선택해주세요.");
                    return { success: 0, failed: 0 };
                }
                return uploadTargets(targets, entityId);
            },
            [entityId, pending],
        );

        useImperativeHandle(ref, () => ({
            uploadAllTo: async (toEntityId: string) => uploadTargets(pending, toEntityId),
            clearStaged: () => handleClearPending(),
        }));

        return (
            <section className={className ?? "rounded-lg bg-white shadow-sm"}>
                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#62e3d5]/10">
                                <Upload className="h-5 w-5 text-[#0a3b41]" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-[#0a3b41]">첨부 파일 관리</h3>
                                <p className="text-xs text-gray-500">파일을 업로드하고 관리할 수 있습니다</p>
                            </div>
                        </div>
                        {entityId && usagesQuery.isFetching ? (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#62e3d5] border-t-transparent" />
                                동기화 중...
                            </div>
                        ) : null}
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="min-w-0">
                            <div className="mb-4 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-[#0a3b41]">등록된 파일</h4>
                                {entityId && usages.length > 0 && (
                                    <span className="rounded-full bg-[#62e3d5]/10 px-2 py-1 text-xs font-medium text-[#0a3b41]">
                                        {usages.length}개
                                    </span>
                                )}
                            </div>
                            {!entityId ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 py-8">
                                    <File className="mb-2 h-8 w-8 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-600">아직 파일이 없습니다</p>
                                    <p className="text-xs text-gray-500">엔티티 생성 후 파일을 확인할 수 있습니다</p>
                                </div>
                            ) : usagesQuery.isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#62e3d5] border-t-transparent" />
                                    <span className="ml-2 text-sm text-gray-500">파일 목록을 불러오는 중...</span>
                                </div>
                            ) : usagesQuery.isError ? (
                                <div className="rounded-lg bg-red-50 p-4">
                                    <p className="text-sm text-red-600">파일 정보를 불러오지 못했습니다.</p>
                                </div>
                            ) : usages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 py-8">
                                    <File className="mb-2 h-8 w-8 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-600">등록된 파일이 없습니다</p>
                                    <p className="text-xs text-gray-500">오른쪽에서 파일을 업로드해주세요</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {usages.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group relative rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-[#62e3d5]/50 hover:shadow-sm"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 pt-0.5">
                                                    {getFileIcon(item.file.originalName ?? item.file.id)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium text-gray-900">
                                                        {item.file.originalName ?? item.file.id}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                                                        <span>{formatFileSize(item.file.byteSize)}</span>
                                                        <span>•</span>
                                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                        {item.purpose.label && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                                                                    {item.purpose.label}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                                        onClick={() => handleDownload(item.file.id, item.file.originalName ?? undefined)}
                                                        disabled={downloadingFileId === item.file.id}
                                                    >
                                                        {downloadingFileId === item.file.id ? (
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                                                        ) : (
                                                            <Download className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                    {!readOnly && (
                                                        <button
                                                            type="button"
                                                            className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                                            onClick={() => {
                                                                if (!confirm("첨부 파일을 삭제하시겠습니까?")) return;
                                                                deleteUsageMutation.mutate(item.id);
                                                            }}
                                                            disabled={deleteUsageMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative min-w-0 lg:pl-6 lg:border-l lg:border-gray-200">
                            <div className="mb-4 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-[#0a3b41]">파일 업로드</h4>
                                {pending.length > 0 && (
                                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                                        대기 중 {pending.length}개
                                    </span>
                                )}
                            </div>

                            {!readOnly && (
                                <>
                                    <input
                                        id={fileInputId}
                                        ref={fileInputRef}
                                        type="file"
                                        multiple={multiple}
                                        accept={accept}
                                        className="sr-only"
                                        onChange={(event) => handlePendingFileSelect(event.currentTarget.files)}
                                        disabled={readOnly || isUploading}
                                    />

                                    {pending.length === 0 ? (
                                        <label
                                            htmlFor={fileInputId}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handlePendingFileSelect(e.dataTransfer.files);
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            className="block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center transition-all hover:border-[#62e3d5] hover:bg-[#62e3d5]/5"
                                        >
                                            <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                                            <p className="text-sm font-medium text-gray-900">
                                                파일을 드래그하거나 클릭하여 선택
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {entityId ? "선택 후 즉시 업로드 가능" : "엔티티 생성 후 자동 업로드"}
                                            </p>
                                            <p className="mt-2 text-xs text-gray-400">
                                                {multiple ? "여러 파일 동시 선택 가능 • " : ""}파일당 최대 10MB
                                            </p>
                                        </label>
                                    ) : (
                                        <div
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handlePendingFileSelect(e.dataTransfer.files);
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 transition-all hover:border-[#62e3d5]"
                                        >
                                            <div className="max-h-64 overflow-y-auto">
                                                <div className="space-y-2 p-3">
                                                    {pending.map((attachment) => (
                                                        <div
                                                            key={attachment.id}
                                                            className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-sm"
                                                        >
                                                            <div className="flex-shrink-0">
                                                                {getFileIcon(attachment.file.name)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-medium text-gray-900">
                                                                    {attachment.file.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {formatFileSize(attachment.file.size)}
                                                                    {!entityId && (
                                                                        <span className="ml-2 text-amber-600">
                                                                            • 대기 중
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {entityId && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUploadNow(attachment.id)}
                                                                        disabled={isUploading}
                                                                        className="rounded p-1.5 text-[#62e3d5] transition-colors hover:bg-[#62e3d5]/10 disabled:opacity-50"
                                                                        title="업로드"
                                                                    >
                                                                        {isUploading ? (
                                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#62e3d5] border-t-transparent" />
                                                                        ) : (
                                                                            <Upload className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleClearPending(attachment.id)}
                                                                    disabled={isUploading}
                                                                    className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                                                    title="제거"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 하단 액션 영역 */}
                                            <div className="border-t border-gray-200 bg-white/50 p-3">
                                                <div className="flex items-center justify-between">
                                                    <label
                                                        htmlFor={fileInputId}
                                                        className="cursor-pointer text-xs font-medium text-[#0a3b41] hover:text-[#62e3d5]"
                                                    >
                                                        + 파일 추가
                                                    </label>
                                                    {pending.length >= 2 && (
                                                        <div className="flex items-center gap-2">
                                                            {entityId && (
                                                                <Button
                                                                    type="button"
                                                                    variant="primary"
                                                                    size="xs"
                                                                    onClick={() => handleUploadNow()}
                                                                    disabled={isUploading}
                                                                    LeadingIcon={<CheckCircle className="h-3.5 w-3.5" />}
                                                                >
                                                                    모두 업로드
                                                                </Button>
                                                            )}
                                                            <Button
                                                                type="button"
                                                                variant="ghostSecondary"
                                                                size="xs"
                                                                onClick={() => handleClearPending()}
                                                                disabled={isUploading}
                                                            >
                                                                전체 삭제
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!entityId && pending.length > 0 && (
                                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                                            <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />
                                            <div className="text-xs">
                                                <p className="font-medium text-amber-900">자동 업로드 대기 중</p>
                                                <p className="mt-0.5 text-amber-700">
                                                    엔티티 생성이 완료되면 {pending.length}개 파일이 자동으로
                                                    업로드됩니다.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {readOnly && (
                                <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
                                    <File className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                                    <p className="text-sm text-gray-500">읽기 전용 모드</p>
                                    <p className="text-xs text-gray-400">파일 업로드가 비활성화되어 있습니다</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        );
    },
);

UploadBlock.displayName = "UploadBlock";
