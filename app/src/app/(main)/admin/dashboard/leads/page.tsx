"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api-client/admin";
import KpiCard from "../components/KpiCard";
import ChartPanel, { BarChartView, PieChartView } from "../components/ChartPanel";
import DashboardNav from "../components/DashboardNav";
import DateRangeFilter, { useDateRangeFilter } from "../components/DateRangeFilter";
import { FileText, TrendingUp, Percent, BarChart3 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
    submitted: "제출됨",
    in_progress: "진행중",
    quote_pending: "견적 대기",
    negotiating: "협상중",
    contracted: "계약완료",
    hold: "보류",
    canceled: "취소",
    closed: "마감",
};

function LeadsContent() {
    const { qs, setQs } = useDateRangeFilter();

    const { data: res, isLoading } = useQuery({
        queryKey: ["admin", "analytics", "leads", qs.from, qs.to, qs.granularity],
        queryFn: () => adminApi.getAnalyticsLeads({ from: qs.from, to: qs.to, granularity: qs.granularity }),
    });

    const data = res?.data;

    const statusPieData = data
        ? Object.entries(data.byStatus).map(([status, count]) => ({
              name: STATUS_LABELS[status] ?? status,
              value: count,
          }))
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">리드 통계</h1>
                <p className="text-sm text-gray-500 mt-1">리드 생성 추이와 전환율을 분석합니다.</p>
            </div>

            <DashboardNav />
            <DateRangeFilter qs={qs} setQs={setQs} />

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="전체 리드"
                    value={data?.totalLeads ?? 0}
                    unit="건"
                    icon={<FileText className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="기간 리드"
                    value={data?.leadsInPeriod ?? 0}
                    unit="건"
                    icon={<BarChart3 className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="일 평균 리드"
                    value={data?.avgLeadsPerDay ?? 0}
                    unit="건/일"
                    icon={<TrendingUp className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="전환율"
                    value={data?.conversionRate ?? 0}
                    unit="%"
                    icon={<Percent className="w-5 h-5" />}
                    isLoading={isLoading}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartPanel title="리드 생성 추이" isLoading={isLoading}>
                    {data && <BarChartView data={data.leadsTrend} color="#62e3d5" label="리드" />}
                </ChartPanel>

                <ChartPanel title="상태별 분포" isLoading={isLoading}>
                    {data && statusPieData.length > 0 && <PieChartView data={statusPieData} />}
                </ChartPanel>
            </div>
        </div>
    );
}

export default function LeadsAnalyticsPage() {
    return (
        <Suspense fallback={null}>
            <LeadsContent />
        </Suspense>
    );
}
