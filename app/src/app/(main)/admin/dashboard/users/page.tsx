"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api-client/admin";
import KpiCard from "../components/KpiCard";
import ChartPanel, { BarChartView, PieChartView } from "../components/ChartPanel";
import DashboardNav from "../components/DashboardNav";
import DateRangeFilter, { useDateRangeFilter } from "../components/DateRangeFilter";
import { Users, Stethoscope, Building2, Shield } from "lucide-react";

function UsersContent() {
    const { qs, setQs } = useDateRangeFilter();

    const { data: res, isLoading } = useQuery({
        queryKey: ["admin", "analytics", "users", qs.from, qs.to, qs.granularity],
        queryFn: () => adminApi.getAnalyticsUsers({ from: qs.from, to: qs.to, granularity: qs.granularity }),
    });

    const data = res?.data;

    const roleData = data
        ? [
              { name: "한의사", value: data.byRole.doctor },
              { name: "업체", value: data.byRole.vendor },
              { name: "관리자", value: data.byRole.admin },
          ]
        : [];

    const statusData = data
        ? [
              { name: "활성", value: data.byStatus.active },
              { name: "비활성", value: data.byStatus.inactive },
              { name: "정지", value: data.byStatus.banned },
          ]
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-content-primary">사용자 통계</h1>
                <p className="text-sm text-gray-500 mt-1">사용자 현황과 가입 추이를 분석합니다.</p>
            </div>

            <DashboardNav />
            <DateRangeFilter qs={qs} setQs={setQs} />

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="전체 사용자"
                    value={data?.totalUsers ?? 0}
                    unit="명"
                    icon={<Users className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="한의사"
                    value={data?.byRole.doctor ?? 0}
                    unit="명"
                    icon={<Stethoscope className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="업체"
                    value={data?.byRole.vendor ?? 0}
                    unit="명"
                    icon={<Building2 className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="관리자"
                    value={data?.byRole.admin ?? 0}
                    unit="명"
                    icon={<Shield className="w-5 h-5" />}
                    isLoading={isLoading}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartPanel title="신규 가입 추이" isLoading={isLoading}>
                    {data && <BarChartView data={data.newUsersTrend} color="var(--color-primary)" label="신규 가입" />}
                </ChartPanel>

                <ChartPanel title="역할별 분포" isLoading={isLoading}>
                    {data && <PieChartView data={roleData} />}
                </ChartPanel>

                <ChartPanel title="상태별 분포" isLoading={isLoading}>
                    {data && <PieChartView data={statusData} />}
                </ChartPanel>
            </div>
        </div>
    );
}

export default function UsersAnalyticsPage() {
    return (
        <Suspense fallback={null}>
            <UsersContent />
        </Suspense>
    );
}
