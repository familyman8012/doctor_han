"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { subscriptionsApi } from "@/api-client/subscriptions";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Button } from "@/components/ui/Button/button";
import { Toggle } from "@/components/ui/Toggle/Toggle";
import { Badge } from "@/components/ui/Badge/Badge";
import type { VendorSubscription } from "@/lib/schema/subscription";
import { useState } from "react";

function formatKRW(amount: number): string {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

function getRemainingDays(expiresAt: string): number {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function getStatusLabel(status: VendorSubscription["status"]): string {
    const labels: Record<VendorSubscription["status"], string> = {
        active: "활성",
        expired: "만료",
        canceled: "취소",
    };
    return labels[status];
}

function getStatusColor(status: VendorSubscription["status"]): "success" | "neutral" | "error" {
    const colors: Record<VendorSubscription["status"], "success" | "neutral" | "error"> = {
        active: "success",
        expired: "neutral",
        canceled: "error",
    };
    return colors[status];
}

export default function PartnerSubscriptionsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showHistory, setShowHistory] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["subscriptions", "list"],
        queryFn: () => subscriptionsApi.list(),
    });

    const autoRenewMutation = useMutation({
        mutationFn: ({ id, autoRenew }: { id: string; autoRenew: boolean }) =>
            subscriptionsApi.updateAutoRenew(id, { autoRenew }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    const subscriptions = data?.data?.items ?? [];
    const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
    const historySubscriptions = subscriptions.filter((s) => s.status !== "active");

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <CalendarClock className="w-6 h-6 text-primary" />
                        구독 관리
                    </h1>
                    <p className="text-gray-500 mt-1">카테고리별 기간제 무제한 리드 수신 구독</p>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push("/partner/subscriptions/purchase")}
                >
                    <Plus className="w-4 h-4 mr-1" />
                    구독 추가
                </Button>
            </div>

            {/* 활성 구독 */}
            {activeSubscriptions.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">활성 구독이 없습니다</p>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push("/partner/subscriptions/purchase")}
                    >
                        구독 시작하기
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeSubscriptions.map((sub) => {
                        const remainingDays = getRemainingDays(sub.expiresAt);
                        return (
                            <div
                                key={sub.id}
                                className="bg-white rounded-xl border border-gray-200 p-5"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge color={getStatusColor(sub.status)} size="xs">
                                                {getStatusLabel(sub.status)}
                                            </Badge>
                                            <span className="font-semibold text-content-primary">
                                                {sub.category?.name ?? "카테고리"}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {sub.plan?.name ?? "플랜"} · {formatKRW(sub.pricePaid)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-content-primary">
                                            D-{remainingDays}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(sub.expiresAt).toLocaleDateString("ko-KR")} 만료
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm">
                                            <span className="text-gray-500">수신 리드</span>
                                            <span className="ml-1 font-semibold text-content-primary">
                                                {sub.leadCount}건
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">자동갱신</span>
                                        <Toggle
                                            checked={sub.autoRenew}
                                            onChange={(e) => {
                                                autoRenewMutation.mutate({
                                                    id: sub.id,
                                                    autoRenew: e.target.checked,
                                                });
                                            }}
                                            disabled={autoRenewMutation.isPending}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 만료/취소 이력 */}
            {historySubscriptions.length > 0 && (
                <div>
                    <button
                        type="button"
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-content-primary transition-colors"
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        {showHistory ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                        이전 구독 이력 ({historySubscriptions.length}건)
                    </button>

                    {showHistory && (
                        <div className="mt-3 space-y-2">
                            {historySubscriptions.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="bg-white rounded-xl border border-gray-200 p-4 opacity-70"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge color={getStatusColor(sub.status)} size="xs">
                                                {getStatusLabel(sub.status)}
                                            </Badge>
                                            <span className="text-sm font-medium text-gray-700">
                                                {sub.category?.name ?? "카테고리"}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {sub.plan?.name ?? "플랜"}
                                            </span>
                                        </div>
                                        <div className="text-right text-xs text-gray-400">
                                            <p>{formatKRW(sub.pricePaid)}</p>
                                            <p>리드 {sub.leadCount}건</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
