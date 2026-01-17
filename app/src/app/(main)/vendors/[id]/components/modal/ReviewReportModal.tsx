"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Modal from "@/components/Modal/Modal";
import api from "@/api-client/client";
import type { ReviewReportReason } from "@/lib/schema/review";

interface ReviewReportModalProps {
    reviewId: string;
    onClose: () => void;
}

const REPORT_REASONS: { value: ReviewReportReason; label: string }[] = [
    { value: "spam", label: "스팸/광고" },
    { value: "inappropriate", label: "부적절한 내용" },
    { value: "false_info", label: "허위 정보" },
    { value: "privacy", label: "개인정보 노출" },
    { value: "other", label: "기타" },
];

export function ReviewReportModal({ reviewId, onClose }: ReviewReportModalProps) {
    const [reason, setReason] = useState<ReviewReportReason | null>(null);
    const [detail, setDetail] = useState("");

    const reportMutation = useMutation({
        mutationFn: async (data: { reason: ReviewReportReason; detail?: string }) => {
            const response = await api.post(`/api/reviews/${reviewId}/report`, data);
            return response.data;
        },
        onSuccess: () => {
            toast.success("리뷰가 신고되었습니다.");
            onClose();
        },
    });

    const handleSubmit = () => {
        if (!reason) {
            toast.error("신고 사유를 선택해 주세요.");
            return;
        }
        if (reason === "other" && !detail.trim()) {
            toast.error("'기타' 사유는 상세 내용이 필요합니다.");
            return;
        }

        reportMutation.mutate({
            reason,
            detail: reason === "other" ? detail.trim() || undefined : undefined,
        });
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="리뷰 신고"
            submitButtonText="신고하기"
            onFormSubmit={handleSubmit}
            disabledFormSubmit={reportMutation.isPending || !reason}
            closeOnSubmit={false}
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    신고 사유를 선택해 주세요. 허위 신고 시 제재를 받을 수 있습니다.
                </p>

                <div className="space-y-2">
                    {REPORT_REASONS.map((option) => (
                        <label
                            key={option.value}
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <input
                                type="radio"
                                name="report-reason"
                                value={option.value}
                                checked={reason === option.value}
                                onChange={() => setReason(option.value)}
                                className="w-4 h-4 text-primary"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                    ))}
                </div>

                {reason === "other" && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            상세 내용 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            placeholder="신고 사유를 상세히 작성해 주세요."
                            maxLength={500}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                            {detail.length}/500
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
