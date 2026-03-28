"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { adminApi } from "@/api-client/admin";
import { Badge } from "@/components/ui/Badge/Badge";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { cn } from "@/components/utils";
import { ArrowUpDown } from "lucide-react";

const GRADE_BADGE_MAP: Record<string, "success" | "warning" | "error"> = {
    A: "success",
    B: "warning",
    C: "error",
};

function formatMinutes(m: number | null | undefined): string {
    if (m == null) return "-";
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

function defaultFrom(): string {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split("T")[0];
}

function defaultTo(): string {
    return new Date().toISOString().split("T")[0];
}

type SortKey = "vendorName" | "totalLeads" | "respondedLeads" | "responseRate" | "avgResponseTimeMinutes" | "unviewedRepeatCount" | "grade";
type SortDir = "asc" | "desc";

export default function BetaOpsVendorGradesPage() {
    const [from, setFrom] = useQueryState("from", parseAsString.withDefault(defaultFrom()));
    const [to, setTo] = useQueryState("to", parseAsString.withDefault(defaultTo()));

    const [sortKey, setSortKey] = useState<SortKey>("grade");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "beta-ops", "vendor-grades", from, to],
        queryFn: () => adminApi.getBetaOpsVendorGrades({ from, to }),
    });

    const items = data?.data?.items ?? [];

    const sorted = useMemo(() => {
        const clone = [...items];
        clone.sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (typeof aVal === "string" && typeof bVal === "string") {
                return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            const numA = Number(aVal);
            const numB = Number(bVal);
            return sortDir === "asc" ? numA - numB : numB - numA;
        });
        return clone;
    }, [items, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const columns: { key: SortKey; label: string }[] = [
        { key: "vendorName", label: "업체명" },
        { key: "totalLeads", label: "총 리드" },
        { key: "respondedLeads", label: "응답" },
        { key: "responseRate", label: "응답률" },
        { key: "avgResponseTimeMinutes", label: "평균 응답시간" },
        { key: "unviewedRepeatCount", label: "미열람 반복" },
        { key: "grade", label: "등급" },
    ];

    return (
        <div className="space-y-4">
            {/* Date range filter */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">시작일</label>
                    <Input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="w-40"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">종료일</label>
                    <Input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="w-40"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Spinner />
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="py-20">
                        <Empty description="업체 등급 데이터가 없습니다" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors"
                                            onClick={() => toggleSort(col.key)}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                {col.label}
                                                <ArrowUpDown
                                                    className={cn(
                                                        "w-3.5 h-3.5",
                                                        sortKey === col.key ? "text-content-primary" : "text-gray-300",
                                                    )}
                                                />
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((item) => (
                                    <tr key={item.vendorId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium">{item.vendorName}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.totalLeads}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.respondedLeads}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.responseRate.toFixed(1)}%</td>
                                        <td className="px-4 py-3 text-gray-600">{formatMinutes(item.avgResponseTimeMinutes)}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.unviewedRepeatCount}</td>
                                        <td className="px-4 py-3">
                                            <Badge color={GRADE_BADGE_MAP[item.grade] ?? "neutral"}>
                                                {item.grade}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
