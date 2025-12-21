"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Paperclip, Download, FileText, Image as ImageIcon } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import type { LeadAttachment } from "@/lib/schema/lead";

interface LeadAttachmentsProps {
    attachments: LeadAttachment[];
}

interface FileInfo {
    id: string;
    fileName: string;
    mimeType: string | null;
    sizeBytes: number | null;
}

export function LeadAttachments({ attachments }: LeadAttachmentsProps) {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleDownload = async (fileId: string) => {
        setDownloadingId(fileId);
        try {
            const response = await api.get<{ data: { url: string } }>(
                `/api/files/signed-download?fileId=${fileId}`
            );
            window.open(response.data.data.url, "_blank");
        } catch {
            // Error handled by global handler
        } finally {
            setDownloadingId(null);
        }
    };

    const formatFileSize = (size: number | null) => {
        if (!size) return "";
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isImage = (mimeType: string | null) => mimeType?.startsWith("image/");

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#0a3b41] mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-gray-400" />
                첨부파일 ({attachments.length})
            </h2>

            <div className="space-y-2">
                {attachments.map((att) => (
                    <AttachmentItem
                        key={att.id}
                        attachment={att}
                        isDownloading={downloadingId === att.fileId}
                        onDownload={() => handleDownload(att.fileId)}
                        formatFileSize={formatFileSize}
                        isImage={isImage}
                    />
                ))}
            </div>
        </div>
    );
}

interface AttachmentItemProps {
    attachment: LeadAttachment;
    isDownloading: boolean;
    onDownload: () => void;
    formatFileSize: (size: number | null) => string;
    isImage: (mimeType: string | null) => boolean;
}

function AttachmentItem({
    attachment,
    isDownloading,
    onDownload,
    formatFileSize,
    isImage,
}: AttachmentItemProps) {
    // 파일 정보는 별도 API가 필요할 수 있으나, 여기서는 fileId만으로 다운로드 가능
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                    <p className="text-sm text-[#0a3b41] font-medium">
                        첨부파일
                    </p>
                    <p className="text-xs text-gray-400">
                        {attachment.fileId.slice(0, 8)}...
                    </p>
                </div>
            </div>
            <button
                type="button"
                onClick={onDownload}
                disabled={isDownloading}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
                {isDownloading ? (
                    <Spinner className="w-4 h-4" />
                ) : (
                    <Download className="w-4 h-4 text-gray-500" />
                )}
            </button>
        </div>
    );
}
