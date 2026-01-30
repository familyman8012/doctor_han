"use client";

import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { adminApi } from "@/api-client/admin";
import type { SanctionType } from "@/lib/schema/report";

interface SanctionModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportId: string;
}

const SANCTION_OPTIONS: { value: SanctionType | "none"; label: string; description: string }[] = [
    { value: "none", label: "제재 없이 처리", description: "신고만 처리 완료로 변경합니다." },
    { value: "warning", label: "경고", description: "대상에게 경고를 부여합니다." },
    { value: "suspension", label: "일시정지", description: "대상을 일정 기간 활동 정지합니다." },
    { value: "permanent_ban", label: "영구정지", description: "대상을 영구적으로 이용 정지합니다." },
];

const DURATION_OPTIONS: { value: number; label: string }[] = [
    { value: 7, label: "7일" },
    { value: 30, label: "30일" },
];

export function SanctionModal({ isOpen, onClose, reportId }: SanctionModalProps) {
    const queryClient = useQueryClient();
    const [sanctionType, setSanctionType] = useState<SanctionType | "none">("warning");
    const [durationDays, setDurationDays] = useState<number>(7);
    const [reason, setReason] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const textareaId = useId();

    const handleClose = () => {
        setSanctionType("warning");
        setDurationDays(7);
        setReason("");
        setShowConfirm(false);
        onClose();
    };

    const resolveMutation = useMutation({
        mutationFn: () =>
            adminApi.resolveReport(reportId, {
                sanctionType: sanctionType === "none" ? undefined : sanctionType,
                durationDays: sanctionType === "suspension" ? durationDays : undefined,
                reason,
            }),
        onSuccess: () => {
            toast.success("신고가 처리되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "report", reportId] });
            handleClose();
        },
        onError: () => {
            toast.error("신고 처리에 실패했습니다.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        if (sanctionType === "permanent_ban") {
            setShowConfirm(true);
        } else {
            resolveMutation.mutate();
        }
    };

    const handleConfirmPermanentBan = () => {
        setShowConfirm(false);
        resolveMutation.mutate();
    };

    if (!isOpen) return null;

    const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            handleClose();
        }
    };

    const handleConfirmBackdropKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setShowConfirm(false);
        }
    };

    if (showConfirm) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setShowConfirm(false)}
                    onKeyDown={handleConfirmBackdropKeyDown}
                    role="button"
                    tabIndex={0}
                    aria-label="모달 닫기"
                />

                {/* Confirm Modal */}
                <div
                    className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl mx-4"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="confirm-modal-title"
                    aria-describedby="confirm-modal-description"
                >
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h2 id="confirm-modal-title" className="text-lg font-semibold text-[#0a3b41]">영구정지 확인</h2>
                        </div>
                        <p id="confirm-modal-description" className="text-sm text-gray-600 mb-4">
                            영구정지는 대상의 모든 활동을 영구적으로 제한합니다.
                            <br />
                            이 작업은 되돌릴 수 있지만, 신중하게 결정해주세요.
                        </p>
                        <p className="text-sm font-medium text-red-600 mb-4">
                            정말로 영구정지를 부과하시겠습니까?
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                        <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={resolveMutation.isPending}>
                            취소
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleConfirmPermanentBan}
                            isLoading={resolveMutation.isPending}
                        >
                            영구정지 부과
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={handleClose}
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
                aria-labelledby="sanction-modal-title"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 id="sanction-modal-title" className="text-lg font-semibold text-[#0a3b41]">제재 부과</h2>
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
                    <div className="p-5 space-y-5">
                        {/* Sanction Type Selection */}
                        <div>
                            <span className="block text-sm font-medium text-gray-700 mb-3">제재 유형</span>
                            <div className="space-y-2">
                                {SANCTION_OPTIONS.map((opt) => (
                                    <label
                                        key={opt.value}
                                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            sanctionType === opt.value
                                                ? "border-[#62e3d5] bg-[#62e3d5]/5"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="sanctionType"
                                            value={opt.value}
                                            checked={sanctionType === opt.value}
                                            onChange={() => setSanctionType(opt.value)}
                                            className="mt-0.5"
                                        />
                                        <div>
                                            <p className="font-medium text-[#0a3b41]">{opt.label}</p>
                                            <p className="text-xs text-gray-500">{opt.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Duration Selection (for suspension) */}
                        {sanctionType === "suspension" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">정지 기간</label>
                                <div className="flex gap-2">
                                    {DURATION_OPTIONS.map((opt) => (
                                        <Button
                                            key={opt.value}
                                            type="button"
                                            variant={durationDays === opt.value ? "listActive" : "list"}
                                            size="sm"
                                            onClick={() => setDurationDays(opt.value)}
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reason */}
                        <div>
                            <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-2">처리 사유</label>
                            <textarea
                                id={textareaId}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="처리 사유를 입력해주세요"
                                className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#62e3d5] focus:border-transparent"
                                required
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                처리 사유는 내부 기록용으로 사용됩니다.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                        <Button type="button" variant="secondary" onClick={handleClose} disabled={resolveMutation.isPending}>
                            취소
                        </Button>
                        <Button
                            type="submit"
                            variant={sanctionType === "permanent_ban" ? "danger" : "primary"}
                            isLoading={resolveMutation.isPending}
                            disabled={!reason.trim()}
                        >
                            {sanctionType === "none" ? "처리 완료" : "제재 부과"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
