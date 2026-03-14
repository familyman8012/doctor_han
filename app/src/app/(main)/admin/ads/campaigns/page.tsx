"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Plus } from "lucide-react";
import { adsApi } from "@/api-client/ads";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { cn } from "@/components/utils";

const STATUS_LABELS: Record<string, string> = {
    draft: "초안",
    pending: "대기",
    active: "활성",
    paused: "일시중지",
    completed: "완료",
    canceled: "취소",
};

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-orange-100 text-orange-800",
    completed: "bg-blue-100 text-blue-800",
    canceled: "bg-red-100 text-red-800",
};

const STATUS_TABS = [
    { value: "", label: "전체" },
    { value: "active", label: "활성" },
    { value: "pending", label: "대기" },
    { value: "paused", label: "일시중지" },
    { value: "completed", label: "완료" },
];

export default function AdminCampaignsPage() {
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
    const [status, setStatus] = useQueryState("status", parseAsString.withDefault(""));

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "ads", "campaigns", page, status],
        queryFn: () =>
            adsApi.getAdminCampaigns({
                page,
                pageSize: 20,
                ...(status ? { status: status as "active" | "pending" | "paused" | "completed" } : {}),
            }),
    });

    const campaigns = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;
    const totalPages = Math.ceil(total / 20);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-content-primary">캠페인 관리</h1>
                <Link
                    href="/admin/ads/campaigns/create"
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-primary-900 hover:bg-primary-900/90 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    캠페인 생성
                </Link>
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => { setStatus(tab.value || null); setPage(1); }}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            (status || "") === tab.value
                                ? "bg-white text-content-primary shadow-sm"
                                : "text-gray-500 hover:text-gray-700",
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Spinner size="lg" />
                </div>
            ) : campaigns.length === 0 ? (
                <Empty title="캠페인이 없습니다" description="새 캠페인을 생성해주세요." />
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-500">광고주</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-500">상태</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-500">기간</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-500">노출수</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-500">클릭수</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-500">CTR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c) => {
                                    const ctr = c.totalImpressions > 0
                                        ? ((c.totalClicks / c.totalImpressions) * 100).toFixed(2)
                                        : "0.00";
                                    return (
                                        <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <Link href={`/admin/ads/campaigns/${c.id}`} className="text-content-primary font-medium hover:underline">
                                                    {c.advertiserName}
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", STATUS_COLORS[c.status])}>
                                                    {STATUS_LABELS[c.status]}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-500">
                                                {new Date(c.startsAt).toLocaleDateString("ko-KR")} ~ {new Date(c.endsAt).toLocaleDateString("ko-KR")}
                                            </td>
                                            <td className="py-3 px-4 text-right">{c.totalImpressions.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right">{c.totalClicks.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right">{ctr}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded disabled:opacity-50"
                            >
                                이전
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
                            <button
                                onClick={() => setPage(Math.min(totalPages, page + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded disabled:opacity-50"
                            >
                                다음
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
