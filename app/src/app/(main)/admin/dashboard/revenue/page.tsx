"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api-client/admin";
import KpiCard from "../components/KpiCard";
import ChartPanel, { LineChartView, PieChartView } from "../components/ChartPanel";
import DashboardNav from "../components/DashboardNav";
import DateRangeFilter, { useDateRangeFilter } from "../components/DateRangeFilter";
import { DollarSign, TrendingDown, Wallet, CreditCard } from "lucide-react";

function RevenueContent() {
    const { qs, setQs } = useDateRangeFilter();

    const { data: res, isLoading } = useQuery({
        queryKey: ["admin", "analytics", "revenue", qs.from, qs.to, qs.granularity],
        queryFn: () => adminApi.getAnalyticsRevenue({ from: qs.from, to: qs.to, granularity: qs.granularity }),
    });

    const data = res?.data;

    const breakdownPieData = data
        ? [
              { name: "리드 과금", value: data.breakdown.leadCharges },
              { name: "구독", value: data.breakdown.subscriptions },
              { name: "입점비", value: data.breakdown.memberships },
              { name: "광고", value: data.breakdown.adPurchases },
              { name: "비딩 수수료", value: data.breakdown.bidCommissions },
          ].filter((item) => item.value > 0)
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">매출 통계</h1>
                <p className="text-sm text-gray-500 mt-1">수익원별 매출과 환불 현황을 분석합니다.</p>
            </div>

            <DashboardNav />
            <DateRangeFilter qs={qs} setQs={setQs} />

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="기간 매출"
                    value={data?.revenueInPeriod ?? 0}
                    unit="원"
                    icon={<DollarSign className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="순매출"
                    value={data?.netRevenueInPeriod ?? 0}
                    unit="원"
                    icon={<Wallet className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="환불"
                    value={data?.refundsInPeriod ?? 0}
                    unit="원"
                    icon={<TrendingDown className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="기간 충전액"
                    value={data?.breakdown.creditCharges ?? 0}
                    unit="원"
                    icon={<CreditCard className="w-5 h-5" />}
                    isLoading={isLoading}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartPanel title="매출 추이" isLoading={isLoading}>
                    {data && <LineChartView data={data.revenueTrend} color="#0a3b41" label="매출(원)" />}
                </ChartPanel>

                <ChartPanel title="수익원별 비중" isLoading={isLoading}>
                    {data && breakdownPieData.length > 0 && <PieChartView data={breakdownPieData} />}
                </ChartPanel>
            </div>

            {/* Breakdown table */}
            {data && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-sm font-semibold text-[#0a3b41]">수익원별 상세</h3>
                        <p className="text-sm text-gray-500">
                            전체 누적 충전액 {data.totalRevenue.toLocaleString()}원
                        </p>
                    </div>
                    <div className="space-y-2">
                        {[
                            { label: "리드 과금", value: data.breakdown.leadCharges },
                            { label: "구독", value: data.breakdown.subscriptions },
                            { label: "입점비(멤버십)", value: data.breakdown.memberships },
                            { label: "광고 구매", value: data.breakdown.adPurchases },
                            { label: "비딩 수수료", value: data.breakdown.bidCommissions },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                            >
                                <span className="text-sm text-gray-600">{item.label}</span>
                                <span className="text-sm font-medium text-[#0a3b41]">
                                    {item.value.toLocaleString()}원
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RevenueAnalyticsPage() {
    return (
        <Suspense fallback={null}>
            <RevenueContent />
        </Suspense>
    );
}
