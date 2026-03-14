"use client";

import { useQueryStates, parseAsString } from "nuqs";
import { Button } from "@/components/ui/Button/button";
import { Calendar } from "lucide-react";
import type { Granularity } from "@/lib/schema/analytics";

const PRESETS = [
    { label: "오늘", days: 0 },
    { label: "7일", days: 7 },
    { label: "30일", days: 30 },
    { label: "90일", days: 90 },
] as const;

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
    { value: "daily", label: "일별" },
    { value: "weekly", label: "주별" },
    { value: "monthly", label: "월별" },
];

function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getPresetRange(days: number): { from: string; to: string } {
    const today = new Date();
    const to = formatDate(today);
    if (days === 0) {
        return { from: to, to };
    }
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - (days - 1));
    return { from: formatDate(fromDate), to };
}

function getDefaultRange() {
    return getPresetRange(30);
}

export function useDateRangeFilter() {
    const defaults = getDefaultRange();
    const [qs, setQs] = useQueryStates(
        {
            from: parseAsString.withDefault(defaults.from),
            to: parseAsString.withDefault(defaults.to),
            granularity: parseAsString.withDefault("daily"),
        },
        { history: "replace" },
    );

    return { qs, setQs };
}

export default function DateRangeFilter({
    qs,
    setQs,
}: {
    qs: { from: string; to: string; granularity: string };
    setQs: (next: Partial<{ from: string; to: string; granularity: string }>) => void;
}) {
    const handlePreset = (days: number) => {
        const range = getPresetRange(days);
        setQs({ from: range.from, to: range.to });
    };

    const isPresetActive = (days: number) => {
        const range = getPresetRange(days);
        return qs.from === range.from && qs.to === range.to;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Preset buttons */}
                <div className="flex gap-2 flex-wrap items-center">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {PRESETS.map((preset) => (
                        <Button
                            key={preset.days}
                            variant={isPresetActive(preset.days) ? "listActive" : "list"}
                            size="xs"
                            onClick={() => handlePreset(preset.days)}
                        >
                            {preset.label}
                        </Button>
                    ))}
                    {/* Custom date inputs */}
                    <div className="flex items-center gap-1.5 ml-2">
                        <input
                            type="date"
                            value={qs.from}
                            onChange={(e) => setQs({ from: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-gray-400 text-sm">~</span>
                        <input
                            type="date"
                            value={qs.to}
                            onChange={(e) => setQs({ to: e.target.value })}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Granularity selector */}
                <div className="flex gap-1.5">
                    {GRANULARITY_OPTIONS.map((opt) => (
                        <Button
                            key={opt.value}
                            variant={qs.granularity === opt.value ? "listActive" : "list"}
                            size="xs"
                            onClick={() => setQs({ granularity: opt.value })}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
