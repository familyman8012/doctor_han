"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, DollarSign, Users, AlertTriangle } from "lucide-react";
import { adminApi } from "@/api-client/admin";
import KpiCard from "./components/KpiCard";
import ChartPanel, { LineChartView, BarChartView } from "./components/ChartPanel";
import DashboardNav from "./components/DashboardNav";
import DateRangeFilter, { useDateRangeFilter } from "./components/DateRangeFilter";

function OverviewContent() {
    const { qs, setQs } = useDateRangeFilter();

    const { data: overviewRes, isLoading: overviewLoading } = useQuery({
        queryKey: ["admin", "analytics", "overview", qs.from, qs.to, qs.granularity],
        queryFn: () => adminApi.getAnalyticsOverview({ from: qs.from, to: qs.to, granularity: qs.granularity }),
    });

    const { data: leadsRes, isLoading: leadsLoading } = useQuery({
        queryKey: ["admin", "analytics", "leads", qs.from, qs.to, qs.granularity],
        queryFn: () => adminApi.getAnalyticsLeads({ from: qs.from, to: qs.to, granularity: qs.granularity }),
    });

    const { data: revenueRes, isLoading: revenueLoading } = useQuery({
        queryKey: ["admin", "analytics", "revenue", qs.from, qs.to, qs.granularity],
        queryFn: () => adminApi.getAnalyticsRevenue({ from: qs.from, to: qs.to, granularity: qs.granularity }),
    });

    const { data: usersRes, isLoading: usersLoading } = useQuery({
        queryKey: ["admin", "analytics", "users", qs.from, qs.to, qs.granularity],
        queryFn: () => adminApi.getAnalyticsUsers({ from: qs.from, to: qs.to, granularity: qs.granularity }),
    });

    const { data: opsRes, isLoading: opsLoading } = useQuery({
        queryKey: ["admin", "analytics", "operations", qs.from, qs.to, qs.granularity],
        queryFn: () => adminApi.getAnalyticsOperations({ from: qs.from, to: qs.to, granularity: qs.granularity }),
    });

    const overview = overviewRes?.data;
    const leads = leadsRes?.data;
    const revenue = revenueRes?.data;
    const users = usersRes?.data;
    const ops = opsRes?.data;

    const pendingCount = (ops?.openTickets ?? 0) + (ops?.pendingReports ?? 0) + (ops?.pendingVerifications ?? 0) + (ops?.pendingRefunds ?? 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-content-primary">대시보드</h1>
                <p className="text-sm text-gray-500 mt-1">플랫폼 주요 지표를 한눈에 확인합니다.</p>
            </div>

            <DashboardNav />
            <DateRangeFilter qs={qs} setQs={setQs} />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="기간 리드"
                    value={overview?.newLeadsInPeriod ?? 0}
                    unit="건"
                    icon={<FileText className="w-5 h-5" />}
                    isLoading={overviewLoading}
                />
                <KpiCard
                    title="기간 충전액"
                    value={overview?.revenueInPeriod ?? 0}
                    unit="원"
                    icon={<DollarSign className="w-5 h-5" />}
                    isLoading={overviewLoading}
                />
                <KpiCard
                    title="신규 가입"
                    value={overview?.newUsersInPeriod ?? 0}
                    unit="명"
                    icon={<Users className="w-5 h-5" />}
                    isLoading={overviewLoading}
                />
                <KpiCard
                    title="미처리 건수"
                    value={pendingCount}
                    unit="건"
                    icon={<AlertTriangle className="w-5 h-5" />}
                    isLoading={opsLoading}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartPanel title="리드 추이" isLoading={leadsLoading}>
                    {leads && <BarChartView data={leads.leadsTrend} color="var(--color-primary)" label="리드" />}
                </ChartPanel>

                <ChartPanel title="매출 추이" isLoading={revenueLoading}>
                    {revenue && <LineChartView data={revenue.revenueTrend} color="var(--color-primary-900)" label="매출(원)" />}
                </ChartPanel>

                <ChartPanel title="가입 추이" isLoading={usersLoading}>
                    {users && <BarChartView data={users.newUsersTrend} color="#8b5cf6" label="신규 가입" />}
                </ChartPanel>

                <ChartPanel title="전체 현황" isLoading={overviewLoading}>
                    <div className="grid grid-cols-2 gap-3 h-full items-center">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-content-primary">{overview?.totalUsers.toLocaleString() ?? "-"}</p>
                            <p className="text-xs text-gray-500 mt-1">전체 사용자</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-content-primary">{overview?.totalLeads.toLocaleString() ?? "-"}</p>
                            <p className="text-xs text-gray-500 mt-1">전체 리드</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-content-primary">{overview?.totalRevenue.toLocaleString() ?? "-"}</p>
                            <p className="text-xs text-gray-500 mt-1">전체 충전액(원)</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-content-primary">{overview?.totalReviews.toLocaleString() ?? "-"}</p>
                            <p className="text-xs text-gray-500 mt-1">전체 리뷰</p>
                        </div>
                    </div>
                </ChartPanel>
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={null}>
            <OverviewContent />
        </Suspense>
    );
}
