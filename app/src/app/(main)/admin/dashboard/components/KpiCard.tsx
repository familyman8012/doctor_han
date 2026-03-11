import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/components/utils";
import type { ReactNode } from "react";

interface KpiCardProps {
    title: string;
    value: number | string;
    unit?: string;
    change?: number | null;
    icon?: ReactNode;
    isLoading?: boolean;
}

export default function KpiCard({ title, value, unit, change, icon, isLoading }: KpiCardProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
                <div className="h-8 bg-gray-100 rounded w-28 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-16" />
            </div>
        );
    }

    const formattedValue =
        typeof value === "number"
            ? unit === "원"
                ? value.toLocaleString()
                : value.toLocaleString()
            : value;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                {icon && <div className="text-gray-400">{icon}</div>}
            </div>
            <p className="text-2xl font-bold text-[#0a3b41]">
                {formattedValue}
                {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
            </p>
            {change !== undefined && change !== null && (
                <div className="mt-2 flex items-center gap-1">
                    {change > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    ) : change < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    ) : null}
                    <span
                        className={cn(
                            "text-xs font-medium",
                            change > 0 && "text-emerald-600",
                            change < 0 && "text-red-600",
                            change === 0 && "text-gray-400",
                        )}
                    >
                        {change > 0 ? "+" : ""}
                        {change}%
                    </span>
                    <span className="text-xs text-gray-400">전기 대비</span>
                </div>
            )}
        </div>
    );
}
