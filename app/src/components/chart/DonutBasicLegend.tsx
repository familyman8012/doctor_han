"use client";

import type React from "react";
import { cn } from "@/components/utils";

interface LegendPayloadEntry {
    value?: string;
    color?: string;
    payload?: {
        percent?: number;
        increase?: number;
    };
}

export interface DonutBasicLegendProps {
    payload?: LegendPayloadEntry[];
    className?: string;
}

export const DonutBasicLegend: React.FC<DonutBasicLegendProps> = ({ payload = [], className }) => {
    return (
        <ul className={cn("list-none m-0 p-0", className)}>
            {payload.map((entry, index: number) => {
                const percent = entry.payload?.percent || 0;
                const increase = entry.payload?.increase || 0;
                const hasIncrease = increase !== 0;

                return (
                    <li key={`item-${index}`} className="flex items-center mb-1">
                        <div className="w-2.5 h-2.5 rounded-sm mr-2.5" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm text-[#0a3b41]">{entry.value}</span>
                        {percent > 0 && <span className="text-sm text-[#5a6376] ml-1">- {percent}%</span>}
                        {hasIncrease && (
                            <span
                                className={cn(
                                    "text-sm ml-1.5 font-medium",
                                    increase > 0 ? "text-green-500" : "text-red-500",
                                )}
                            >
                                {increase > 0 && "+"}
                                {increase}%
                            </span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};
