"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api-client/admin";
import KpiCard from "@/app/(main)/admin/dashboard/components/KpiCard";
import { FileText, BarChart3, Clock, EyeOff, AlertTriangle, AlertCircle } from "lucide-react";

function formatMinutes(m: number | null): string {
    if (m === null) return "-";
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

export default function BetaOpsDailyCheckPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["admin", "beta-ops", "daily-check"],
        queryFn: () => adminApi.getBetaOpsDailyCheck(),
        refetchInterval: 60_000,
    });

    const metrics = data?.data;

    const hasUnviewed = (metrics?.unviewedOver24h ?? 0) > 0;
    const hasFailures = (metrics?.notificationFailuresToday ?? 0) > 0;
    const hasStuck = (metrics?.stuckSubmittedLeads ?? 0) > 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard
                    title="당일 리드 생성"
                    value={metrics?.leadsCreatedToday ?? 0}
                    unit="건"
                    icon={<FileText className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="업체 응답률 (7일)"
                    value={metrics?.vendorResponseRate != null ? metrics.vendorResponseRate.toFixed(1) : "0.0"}
                    unit="%"
                    icon={<BarChart3 className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title="평균 응답 시간"
                    value={formatMinutes(metrics?.avgResponseTimeMinutes ?? null)}
                    icon={<Clock className="w-5 h-5" />}
                    isLoading={isLoading}
                />
                <KpiCard
                    title={hasUnviewed ? "24시간+ 미열람" : "24시간+ 미열람"}
                    value={metrics?.unviewedOver24h ?? 0}
                    unit="건"
                    icon={
                        <EyeOff
                            className={`w-5 h-5 ${hasUnviewed ? "text-red-500" : ""}`}
                        />
                    }
                    isLoading={isLoading}
                />
                <KpiCard
                    title={hasFailures ? "알림 발송 실패" : "알림 발송 실패"}
                    value={metrics?.notificationFailuresToday ?? 0}
                    unit="건"
                    icon={
                        <AlertTriangle
                            className={`w-5 h-5 ${hasFailures ? "text-orange-500" : ""}`}
                        />
                    }
                    isLoading={isLoading}
                />
                <KpiCard
                    title={hasStuck ? "상태 변경 누락" : "상태 변경 누락"}
                    value={metrics?.stuckSubmittedLeads ?? 0}
                    unit="건"
                    icon={
                        <AlertCircle
                            className={`w-5 h-5 ${hasStuck ? "text-red-500" : ""}`}
                        />
                    }
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
