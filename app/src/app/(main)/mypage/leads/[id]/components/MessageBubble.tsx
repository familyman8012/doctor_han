"use client";

import dayjs from "dayjs";
import { Check, CheckCheck, Download, FileText } from "lucide-react";
import api from "@/api-client/client";
import { errorHandler } from "@/api-client/error-handler";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import type { LeadMessage } from "@/lib/schema/lead";
import type { FileSignedDownloadResponse } from "@/lib/schema/file";
import { useState } from "react";

interface MessageBubbleProps {
    message: LeadMessage;
    isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleDownload = async (fileId: string) => {
        setDownloadingId(fileId);
        try {
            const response = await api.get<FileSignedDownloadResponse>(
                "/api/files/signed-download",
                { params: { fileId } },
            );
            window.open(response.data.data.signedUrl, "_blank", "noopener,noreferrer");
        } catch (error) {
            errorHandler(error);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
            <div
                className={`max-w-[70%] ${
                    isOwn
                        ? "bg-[#0a3b41] text-white rounded-2xl rounded-br-md"
                        : "bg-gray-100 text-[#0a3b41] rounded-2xl rounded-bl-md"
                } px-4 py-3`}
            >
                {/* 메시지 내용 */}
                <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                </p>

                {/* 첨부파일 */}
                {message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {message.attachments.map((att) => (
                            <button
                                key={att.id}
                                type="button"
                                onClick={() => handleDownload(att.fileId)}
                                disabled={downloadingId === att.fileId}
                                className={`flex items-center gap-2 w-full p-2 rounded-lg transition-colors ${
                                    isOwn
                                        ? "bg-white/10 hover:bg-white/20"
                                        : "bg-white hover:bg-gray-50"
                                } disabled:opacity-50`}
                            >
                                <FileText
                                    className={`w-4 h-4 ${
                                        isOwn ? "text-white/70" : "text-gray-400"
                                    }`}
                                />
                                <span
                                    className={`text-xs truncate flex-1 text-left ${
                                        isOwn ? "text-white/90" : "text-gray-600"
                                    }`}
                                >
                                    첨부파일
                                </span>
                                {downloadingId === att.fileId ? (
                                    <Spinner className="w-3 h-3" />
                                ) : (
                                    <Download
                                        className={`w-3 h-3 ${
                                            isOwn ? "text-white/70" : "text-gray-400"
                                        }`}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* 시간 + 읽음 표시 */}
                <div
                    className={`flex items-center gap-1 mt-1 ${
                        isOwn ? "justify-end" : "justify-start"
                    }`}
                >
                    <span
                        className={`text-xs ${
                            isOwn ? "text-white/60" : "text-gray-400"
                        }`}
                    >
                        {dayjs(message.createdAt).format("HH:mm")}
                    </span>
                    {isOwn && (
                        <span className="text-white/60">
                            {message.readAt ? (
                                <CheckCheck className="w-3.5 h-3.5" />
                            ) : (
                                <Check className="w-3.5 h-3.5" />
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
