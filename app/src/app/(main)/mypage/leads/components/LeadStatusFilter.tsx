"use client";

import { cn } from "@/components/utils";
import type { LeadStatus } from "@/lib/schema/lead";

const STATUS_OPTIONS: { value: LeadStatus | ""; label: string }[] = [
    { value: "", label: "전체" },
    { value: "submitted", label: "접수" },
    { value: "in_progress", label: "진행중" },
    { value: "quote_pending", label: "견적대기" },
    { value: "negotiating", label: "협의중" },
    { value: "contracted", label: "계약완료" },
    { value: "hold", label: "보류" },
    { value: "canceled", label: "취소" },
    { value: "closed", label: "종료" },
];

interface LeadStatusFilterProps {
    value: string | null;
    onChange: (value: string) => void;
}

export function LeadStatusFilter({ value, onChange }: LeadStatusFilterProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "px-3 py-1.5 text-sm rounded-full transition-colors",
                        (value ?? "") === opt.value
                            ? "bg-[#0a3b41] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
