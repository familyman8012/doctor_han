"use client";

import { Star } from "lucide-react";
import type { SubRatingSummary as SubRatingSummaryType } from "@/lib/schema/review";

interface SubRatingSummaryProps {
    summary: SubRatingSummaryType;
}

const LABELS: Array<{ key: keyof SubRatingSummaryType; label: string }> = [
    { key: "qualityRatingAvg", label: "결과물 만족도" },
    { key: "communicationRatingAvg", label: "소통" },
    { key: "speedRatingAvg", label: "응답 속도" },
];

export function SubRatingSummary({ summary }: SubRatingSummaryProps) {
    const hasAny = LABELS.some(({ key }) => summary[key] !== null);
    if (!hasAny) return null;

    return (
        <div className="space-y-3">
            {LABELS.map(({ key, label }) => {
                const value = summary[key];
                if (value === null) return null;

                return (
                    <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{label}</span>
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-content-primary tabular-nums">
                                {value.toFixed(1)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
