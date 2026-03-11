"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api-client/admin";
import KpiCard from "../components/KpiCard";
import ChartPanel, { MultiLineChartView } from "../components/ChartPanel";
import DashboardNav from "../components/DashboardNav";
import DateRangeFilter, { useDateRangeFilter } from "../components/DateRangeFilter";
import { Megaphone, Eye, MousePointer2, Percent } from "lucide-react";

function AdsContent() {
    const { qs, setQs } = useDateRangeFilter();

    const { data: res, isLoading } = useQuery({
        queryKey: ["admin", "analytics", "ads", qs.from, qs.to, qs.granularity],
        queryFn: () => adminApi.getAnalyticsAds({ from: qs.from, to: qs.to, granularity: qs.granularity }),
    });

    const data = res?.data;

    // Merge impressions and clicks trends into one dataset for multi-line chart
    const mergedTrend = data
        ? data.impressionsTrend.map((point, i) => ({
              date: point.date,
              impressions: point.value,
              clicks: data.clicksTrend[i]?.value ?? 0,
          }))
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">광고 성과</h1>
                <p className="text-sm text-gray-500 mt-1">배너 노출, 클릭, CTR을 분석합니다.</p>
            </div>

            <DashboardNav />
            <DateRangeFilter qs={qs} setQs={setQs} />

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="활성 캠페인"
                    value={data?.activeCampaigns ?? 0}
                    unit="건"
                    icon={<Megaphone className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="총 노출"
                    value={data?.totalImpressions ?? 0}
                    unit="회"
                    icon={<Eye className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="총 클릭"
                    value={data?.totalClicks ?? 0}
                    unit="회"
                    icon={<MousePointer2 className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="전체 CTR"
                    value={data?.overallCtr ?? 0}
                    unit="%"
                    icon={<Percent className="w-5 h-5" />}
                    isLoading={isLoading}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartPanel title="노출 / 클릭 추이" isLoading={isLoading}>
                    {data && mergedTrend.length > 0 && (
                        <MultiLineChartView
                            data={mergedTrend}
                            lines={[
                                { dataKey: "impressions", color: "#62e3d5", name: "노출" },
                                { dataKey: "clicks", color: "#0a3b41", name: "클릭" },
                            ]}
                        />
                    )}
                </ChartPanel>

                <ChartPanel title="광고 수익" isLoading={isLoading}>
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-3xl font-bold text-[#0a3b41]">
                            {(data?.adRevenue ?? 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">원</p>
                        <p className="text-xs text-gray-400 mt-3">
                            전체 캠페인: {data?.totalCampaigns ?? 0}건
                        </p>
                    </div>
                </ChartPanel>
            </div>
        </div>
    );
}

export default function AdsAnalyticsPage() {
    return (
        <Suspense fallback={null}>
            <AdsContent />
        </Suspense>
    );
}
