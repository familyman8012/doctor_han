"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/button";

interface GenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GenerateModal({ isOpen, onClose }: GenerateModalProps) {
    const queryClient = useQueryClient();
    const now = new Date();
    // Default to previous month
    const defaultMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const defaultYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    const [year, setYear] = useState(defaultYear);
    const [month, setMonth] = useState(defaultMonth);

    const generateMutation = useMutation({
        mutationFn: () => adminApi.generateSettlements({ year, month }),
        onSuccess: (data) => {
            const result = data.data;
            toast.success(`정산 생성 완료: ${result.created}건 생성, ${result.skipped}건 스킵`);
            queryClient.invalidateQueries({ queryKey: ["admin", "settlements"] });
            onClose();
        },
        onError: () => {
            toast.error("정산 생성에 실패했습니다.");
        },
    });

    if (!isOpen) return null;

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-xl mx-4">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-[#0a3b41]">월별 정산 생성</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-600">
                        선택한 연월의 모든 활동 업체에 대해 정산을 일괄 생성합니다.
                        이미 생성된 업체는 건너뜁니다.
                    </p>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">연도</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62e3d5]"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}년
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">월</label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62e3d5]"
                            >
                                {months.map((m) => (
                                    <option key={m} value={m}>
                                        {m}월
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        취소
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        isLoading={generateMutation.isPending}
                        onClick={() => generateMutation.mutate()}
                    >
                        정산 생성
                    </Button>
                </div>
            </div>
        </div>
    );
}
