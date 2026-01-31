"use client";

import type React from "react";
import { cn } from "@/components/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface TooltipPayloadEntry {
    name?: string;
    value?: string | number;
    color?: string;
    payload?: Record<string, unknown>;
}

export interface BasicTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
    className?: string;
}

export const BasicTooltip: React.FC<BasicTooltipProps> = ({ active, payload, label, className }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];

    // 간단한 기본 툴팁 (차트 데이터 구조에 따라 수정 필요)
    if (data?.payload?.base_sales_count !== undefined) {
        // 판매 데이터용 툴팁
        const increaseRate = Number(data?.payload?.increase_decrease_rate) || 0;
        const isIncrease = increaseRate > 0;
        const isDecrease = increaseRate < 0;

        return (
            <div
                className={cn(
                    "flex flex-col gap-4 relative p-4",
                    "border border-gray-200 rounded-md bg-white",
                    "shadow-lg",
                    className,
                )}
            >
                <dl className="space-y-1">
                    <dt className="text-xs text-[#5a6376] font-normal">기준일 판매 수</dt>
                    <dd className="text-lg font-semibold text-[#0a3b41]">
                        {data?.payload?.base_sales_count?.toLocaleString()}
                    </dd>
                </dl>

                {data?.payload?.comparison_sales_count !== undefined && (
                    <dl className="space-y-1">
                        <dt className="text-xs text-[#5a6376] font-normal">비교일 판매 수</dt>
                        <dd className="text-lg font-semibold text-[#0a3b41]">
                            {data?.payload?.comparison_sales_count?.toLocaleString()}
                        </dd>
                    </dl>
                )}

                {data?.payload?.increase_decrease_rate !== undefined && (
                    <dl className="space-y-1">
                        <dt className="text-xs text-[#5a6376] font-normal">증감율</dt>
                        <dd className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-[#0a3b41]">
                                {data?.payload?.increase_decrease_number?.toLocaleString()}
                            </span>
                            <span
                                className={cn(
                                    "flex items-center text-sm font-medium",
                                    isIncrease && "text-green-500",
                                    isDecrease && "text-red-500",
                                    !isIncrease && !isDecrease && "text-gray-500",
                                )}
                            >
                                {isIncrease && <ArrowUp className="w-3 h-3 mr-0.5" />}
                                {isDecrease && <ArrowDown className="w-3 h-3 mr-0.5" />}
                                {increaseRate.toLocaleString()}%
                            </span>
                        </dd>
                    </dl>
                )}
            </div>
        );
    }

    // 기본 툴팁 (일반 차트용)
    return (
        <div className={cn("p-3 bg-white border border-gray-200 rounded-md shadow-lg", className)}>
            {label && <p className="text-xs text-[#5a6376] mb-2">{label}</p>}
            <div className="space-y-1">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        {entry.color && (
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        )}
                        <span className="text-sm text-[#5a6376]">{entry.name}:</span>
                        <span className="text-sm font-medium text-[#0a3b41]">
                            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
