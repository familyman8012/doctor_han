"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { adsApi } from "@/api-client/ads";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";

export default function AdminAdReportsPage() {
    const [startDate, setStartDate] = useQueryState("startDate", parseAsString.withDefault(""));
    const [endDate, setEndDate] = useQueryState("endDate", parseAsString.withDefault(""));

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "ads", "reports", startDate, endDate],
        queryFn: () =>
            adsApi.getAdminReport({
                ...(startDate ? { startDate } : {}),
                ...(endDate ? { endDate } : {}),
            }),
    });

    const items = data?.data?.items ?? [];

    const totals = items.reduce(
        (acc, item) => ({
            impressions: acc.impressions + item.totalImpressions,
            clicks: acc.clicks + item.totalClicks,
        }),
        { impressions: 0, clicks: 0 },
    );
    const totalCtr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-content-primary">성과 리포트</h1>

            {/* Date filters */}
            <div className="flex items-center gap-3">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">시작일</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value || null)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">종료일</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value || null)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Spinner size="lg" />
                </div>
            ) : items.length === 0 ? (
                <Empty title="리포트 데이터가 없습니다" description="선택한 기간에 데이터가 없습니다." />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-500">캠페인</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500">노출수</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500">클릭수</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500">CTR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.campaignId} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-content-primary">{item.advertiserName}</td>
                                    <td className="py-3 px-4 text-right">{item.totalImpressions.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-right">{item.totalClicks.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-right">{item.ctr.toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-gray-300 font-semibold">
                                <td className="py-3 px-4 text-content-primary">합계</td>
                                <td className="py-3 px-4 text-right">{totals.impressions.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right">{totals.clicks.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right">{totalCtr}%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}
