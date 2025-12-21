"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { cn } from "@/components/utils";
import type { LeadStatus } from "@/lib/schema/lead";

interface StatusChangeModalProps {
    currentStatus: LeadStatus;
    isLoading: boolean;
    onClose: () => void;
    onConfirm: (status: LeadStatus) => void;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string; description: string }[] = [
    { value: "in_progress", label: "진행중", description: "고객과 연락하여 상담 진행 중" },
    { value: "quote_pending", label: "견적대기", description: "견적서 작성 및 발송 예정" },
    { value: "negotiating", label: "협의중", description: "가격/조건 협의 진행 중" },
    { value: "contracted", label: "계약완료", description: "계약이 성사됨" },
    { value: "hold", label: "보류", description: "고객 요청 또는 일시 보류" },
    { value: "closed", label: "종료", description: "더 이상 진행 불가" },
];

export function StatusChangeModal({
    currentStatus,
    isLoading,
    onClose,
    onConfirm,
}: StatusChangeModalProps) {
    const [selected, setSelected] = useState<LeadStatus | null>(null);

    const availableOptions = STATUS_OPTIONS.filter((opt) => opt.value !== currentStatus);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 백드롭 */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* 모달 */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl mx-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-[#0a3b41]">상태 변경</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* 본문 */}
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                    {availableOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSelected(opt.value)}
                            className={cn(
                                "w-full text-left p-4 rounded-xl border transition-all",
                                selected === opt.value
                                    ? "border-[#62e3d5] bg-[#62e3d5]/5"
                                    : "border-gray-100 hover:border-gray-200"
                            )}
                        >
                            <p className="font-medium text-[#0a3b41]">{opt.label}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{opt.description}</p>
                        </button>
                    ))}
                </div>

                {/* 푸터 */}
                <div className="flex gap-3 p-4 border-t border-gray-100">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        취소
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() => selected && onConfirm(selected)}
                        disabled={!selected || isLoading}
                        isLoading={isLoading}
                    >
                        변경하기
                    </Button>
                </div>
            </div>
        </div>
    );
}
