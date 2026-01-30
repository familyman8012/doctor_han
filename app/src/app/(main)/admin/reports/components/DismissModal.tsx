"use client";

import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { adminApi } from "@/api-client/admin";

interface DismissModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportId: string;
}

export function DismissModal({ isOpen, onClose, reportId }: DismissModalProps) {
    const queryClient = useQueryClient();
    const [reason, setReason] = useState("");
    const textareaId = useId();

    const handleClose = () => {
        setReason("");
        onClose();
    };

    const dismissMutation = useMutation({
        mutationFn: () => adminApi.dismissReport(reportId, { reason }),
        onSuccess: () => {
            toast.success("신고가 기각되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "report", reportId] });
            handleClose();
        },
        onError: () => {
            toast.error("신고 기각에 실패했습니다.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;
        dismissMutation.mutate();
    };

    const handleBackdropClick = () => {
        handleClose();
    };

    const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={handleBackdropClick}
                onKeyDown={handleBackdropKeyDown}
                role="button"
                tabIndex={0}
                aria-label="모달 닫기"
            />

            {/* Modal */}
            <div
                className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl mx-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dismiss-modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 id="dismiss-modal-title" className="text-lg font-semibold text-[#0a3b41]">신고 기각</h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="닫기"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="p-5">
                        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-2">기각 사유</label>
                        <textarea
                            id={textareaId}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="기각 사유를 입력해주세요"
                            className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#62e3d5] focus:border-transparent"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            신고 내용이 부적절하거나 허위 신고인 경우 기각 처리합니다.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                        <Button type="button" variant="secondary" onClick={handleClose} disabled={dismissMutation.isPending}>
                            취소
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            isLoading={dismissMutation.isPending}
                            disabled={!reason.trim()}
                        >
                            기각하기
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
