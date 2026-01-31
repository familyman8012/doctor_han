"use client";

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import { Send, Paperclip, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import api from "@/api-client/client";
import { errorHandler } from "@/api-client/error-handler";
import type { FileSignedUploadResponse } from "@/lib/schema/file";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

interface UploadedFile {
    id: string;
    file: File;
    isUploading: boolean;
    fileId?: string;
}

interface MessageInputProps {
    onSend: (content: string, attachmentFileIds: string[]) => void;
    isSending: boolean;
    disabled?: boolean;
}

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function MessageInput({ onSend, isSending, disabled }: MessageInputProps) {
    const [content, setContent] = useState("");
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter로 전송, Shift+Enter로 줄바꿈
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        const trimmedContent = content.trim();
        if (!trimmedContent) {
            if (files.length > 0) {
                errorHandler({
                    code: "MESSAGE_CONTENT_REQUIRED",
                    message: "메시지 내용을 입력해주세요.",
                });
            }
            return;
        }
        if (isSending || disabled) return;
        if (files.some((f) => f.isUploading)) return;

        const attachmentFileIds = files
            .filter((f) => f.fileId)
            .map((f) => f.fileId!);

        onSend(trimmedContent, attachmentFileIds);
        setContent("");
        setFiles([]);

        // textarea 높이 리셋
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        // 자동 높이 조절
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles) return;

        const remainingSlots = MAX_ATTACHMENTS - files.length;
        if (remainingSlots <= 0) return;

        const filesToUpload = Array.from(selectedFiles).slice(0, remainingSlots);

        for (const file of filesToUpload) {
            if (file.size > MAX_FILE_SIZE) {
                errorHandler({
                    code: "FILE_TOO_LARGE",
                    message: `${file.name}: 파일 크기는 10MB 이하여야 합니다.`,
                });
                continue;
            }

            const tempId = crypto.randomUUID();
            const uploadedFile: UploadedFile = {
                id: tempId,
                file,
                isUploading: true,
            };

            setFiles((prev) => [...prev, uploadedFile]);

            try {
                // Step 1: Get signed upload URL
                const signedUploadResponse = await api.post<FileSignedUploadResponse>(
                    "/api/files/signed-upload",
                    {
                        purpose: "lead_message_attachment",
                        fileName: file.name,
                        mimeType: file.type || null,
                        sizeBytes: file.size,
                    },
                );

                const { file: fileData, upload } = signedUploadResponse.data.data;

                // Step 2: Upload file to signed URL
                // 다른 업로드 플로우와 동일하게 supabase client를 사용해 업로드
                const supabase = getSupabaseBrowserClient();
                const { error: uploadError } = await supabase.storage
                    .from(upload.bucket)
                    .uploadToSignedUrl(upload.path, upload.token, file, {
                        cacheControl: "3600",
                    });

                if (uploadError) {
                    throw uploadError;
                }

                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === tempId
                            ? { ...f, isUploading: false, fileId: fileData.id }
                            : f,
                    ),
                );
            } catch (error) {
                if (error instanceof Error) {
                    errorHandler({
                        code: "UPLOAD_FAILED",
                        message: error.message,
                    });
                } else {
                    errorHandler(error);
                }
                setFiles((prev) => prev.filter((f) => f.id !== tempId));
            }
        }

        // input 리셋
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const isUploadingAny = files.some((f) => f.isUploading);
    const canSend =
        !!content.trim() &&
        !isSending &&
        !disabled &&
        !isUploadingAny;

    return (
        <div className="border-t border-gray-200 bg-white p-4">
            {/* 첨부파일 미리보기 */}
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {files.map((f) => (
                        <div
                            key={f.id}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                        >
                            {f.isUploading ? (
                                <Spinner className="w-4 h-4" />
                            ) : (
                                <FileText className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="text-sm text-gray-700 max-w-[150px] truncate">
                                {f.file.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeFile(f.id)}
                                className="p-0.5 hover:bg-gray-200 rounded"
                                disabled={f.isUploading}
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* 입력 영역 */}
            <div className="flex items-end gap-2">
                {/* 첨부파일 버튼 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                    disabled={disabled || files.length >= MAX_ATTACHMENTS}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || files.length >= MAX_ATTACHMENTS}
                    className="p-2 text-gray-500 hover:text-[#0a3b41] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                        files.length >= MAX_ATTACHMENTS
                            ? `최대 ${MAX_ATTACHMENTS}개까지 첨부 가능`
                            : "파일 첨부"
                    }
                >
                    <Paperclip className="w-5 h-5" />
                </button>

                {/* 텍스트 입력 */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="메시지를 입력하세요..."
                        disabled={disabled}
                        rows={1}
                        className="w-full px-4 py-2.5 bg-gray-100 border-0 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#62e3d5] text-sm placeholder:text-gray-400 disabled:opacity-50"
                        style={{ minHeight: "42px", maxHeight: "120px" }}
                    />
                </div>

                {/* 전송 버튼 */}
                <Button
                    onClick={handleSend}
                    disabled={!canSend}
                    isLoading={isSending}
                    size="sm"
                    className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                >
                    {!isSending && <Send className="w-4 h-4" />}
                </Button>
            </div>

            <p className="text-xs text-gray-400 mt-2 text-center">
                Enter로 전송, Shift+Enter로 줄바꿈
            </p>
        </div>
    );
}
