"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api-client/admin";
import ChartPanel from "../components/ChartPanel";
import DashboardNav from "../components/DashboardNav";
import DateRangeFilter, { useDateRangeFilter } from "../components/DateRangeFilter";
import { cn } from "@/components/utils";
import type { FunnelStep } from "@/lib/schema/analytics";

function FunnelBar({ steps }: { steps: FunnelStep[] }) {
    if (steps.length === 0) return null;
    const maxCount = Math.max(...steps.map((s) => s.count), 1);

    return (
        <div className="space-y-3">
            {steps.map((step, i) => {
                const width = Math.max((step.count / maxCount) * 100, 4);
                return (
                    <div key={step.step} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">{formatStepLabel(step.step)}</span>
                            <span className="text-gray-500">
                                {step.count.toLocaleString()}명
                                {i > 0 && (
                                    <span
                                        className={cn(
                                            "ml-2 text-xs font-medium",
                                            step.rate >= 50 ? "text-emerald-600" : "text-amber-600",
                                        )}
                                    >
                                        ({step.rate}%)
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#62e3d5] to-[#0a3b41] transition-all duration-500"
                                style={{ width: `${width}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function formatStepLabel(step: string): string {
    const labels: Record<string, string> = {
        registration: "가입",
        verification_submitted: "인증 제출",
        verification_approved: "인증 승인",
        lead_created: "리드 생성",
        contracted: "계약 체결",
    };
    return labels[step] ?? step;
}

function FunnelContent() {
    const { qs, setQs } = useDateRangeFilter();

    const { data: res, isLoading } = useQuery({
        queryKey: ["admin", "analytics", "funnel", qs.from, qs.to, qs.granularity],
        queryFn: () => adminApi.getAnalyticsFunnel({ from: qs.from, to: qs.to, granularity: qs.granularity }),
    });

    const data = res?.data;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">퍼널 분석</h1>
                <p className="text-sm text-gray-500 mt-1">
                    사용자 전환 경로를 분석합니다.
                </p>
            </div>

            <DashboardNav />
            <DateRangeFilter qs={qs} setQs={setQs} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartPanel title="가입 - 인증 퍼널" subtitle="가입부터 인증 승인까지" isLoading={isLoading}>
                    {data && (
                        <div className="h-full flex items-center">
                            <div className="w-full">
                                <FunnelBar steps={data.registrationToVerification} />
                            </div>
                        </div>
                    )}
                </ChartPanel>

                <ChartPanel title="리드 - 계약 퍼널" subtitle="리드 생성부터 계약까지" isLoading={isLoading}>
                    {data && (
                        <div className="h-full flex items-center">
                            <div className="w-full">
                                <FunnelBar steps={data.leadToContract} />
                            </div>
                        </div>
                    )}
                </ChartPanel>
            </div>
        </div>
    );
}

export default function FunnelAnalyticsPage() {
    return (
        <Suspense fallback={null}>
            <FunnelContent />
        </Suspense>
    );
}
