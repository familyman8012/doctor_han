"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import api from "@/api-client/client";
import { errorHandler } from "@/api-client/error-handler";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import type { FileSignedDownloadResponse } from "@/lib/schema/file";
import type { LeadAttachment } from "@/lib/schema/lead";

interface LeadAttachmentsProps {
    attachments: LeadAttachment[];
}

export function LeadAttachments({ attachments }: LeadAttachmentsProps) {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleDownload = async (fileId: string) => {
        setDownloadingId(fileId);
        try {
            const response = await api.get<FileSignedDownloadResponse>("/api/files/signed-download", {
                params: { fileId },
            });
            window.open(response.data.data.signedUrl, "_blank", "noopener,noreferrer");
        } catch (error) {
            errorHandler(error);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-2">
            {attachments.map((att) => (
                <div
                    key={att.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-content-primary font-medium">첨부파일</p>
                            <p className="text-xs text-gray-400 truncate">{att.fileId.slice(0, 8)}…</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleDownload(att.fileId)}
                        disabled={downloadingId === att.fileId}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                        {downloadingId === att.fileId ? (
                            <Spinner className="w-4 h-4" />
                        ) : (
                            <Download className="w-4 h-4 text-gray-500" />
                        )}
                    </button>
                </div>
            ))}
        </div>
    );
}
