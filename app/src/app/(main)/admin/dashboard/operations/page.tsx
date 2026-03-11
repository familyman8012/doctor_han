"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api-client/admin";
import KpiCard from "../components/KpiCard";
import ChartPanel, { BarChartView } from "../components/ChartPanel";
import DashboardNav from "../components/DashboardNav";
import DateRangeFilter, { useDateRangeFilter } from "../components/DateRangeFilter";
import { Ticket, Flag, CheckCircle, Clock, RotateCcw, ShieldCheck } from "lucide-react";

function OperationsContent() {
    const { qs, setQs } = useDateRangeFilter();

    const { data: res, isLoading } = useQuery({
        queryKey: ["admin", "analytics", "operations", qs.from, qs.to, qs.granularity],
        queryFn: () => adminApi.getAnalyticsOperations({ from: qs.from, to: qs.to, granularity: qs.granularity }),
    });

    const data = res?.data;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">운영 지표</h1>
                <p className="text-sm text-gray-500 mt-1">고객지원, 신고, 인증, 환불 현황을 확인합니다.</p>
            </div>

            <DashboardNav />
            <DateRangeFilter qs={qs} setQs={setQs} />

            {/* KPI Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="미해결 티켓"
                    value={data?.openTickets ?? 0}
                    unit="건"
                    icon={<Ticket className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="해결된 티켓"
                    value={data?.resolvedTicketsInPeriod ?? 0}
                    unit="건"
                    icon={<CheckCircle className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="평균 해결 시간"
                    value={data?.avgResolutionHours != null ? data.avgResolutionHours : "-"}
                    unit={data?.avgResolutionHours != null ? "시간" : ""}
                    icon={<Clock className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="미처리 신고"
                    value={data?.pendingReports ?? 0}
                    unit="건"
                    icon={<Flag className="w-5 h-5" />}
                    isLoading={isLoading}
                />
            </div>

            {/* KPI Row 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="처리된 신고"
                    value={data?.resolvedReportsInPeriod ?? 0}
                    unit="건"
                    icon={<Flag className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="대기 중 인증"
                    value={data?.pendingVerifications ?? 0}
                    unit="건"
                    icon={<ShieldCheck className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="대기 중 환불"
                    value={data?.pendingRefunds ?? 0}
                    unit="건"
                    icon={<RotateCcw className="w-5 h-5" />}
                    isLoading={isLoading}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4">
                <ChartPanel title="티켓 생성 추이" isLoading={isLoading}>
                    {data && <BarChartView data={data.ticketsTrend} color="#f59e0b" label="티켓" />}
                </ChartPanel>
            </div>
        </div>
    );
}

export default function OperationsAnalyticsPage() {
    return (
        <Suspense fallback={null}>
            <OperationsContent />
        </Suspense>
    );
}
