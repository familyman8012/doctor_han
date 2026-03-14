"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { membershipApi } from "@/api-client/membership";
import { creditsApi } from "@/api-client/credits";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Button } from "@/components/ui/Button/button";
import { Badge } from "@/components/ui/Badge/Badge";
import type { MembershipPlan, VendorMembership } from "@/lib/schema/vendor-membership";

function formatKRW(amount: number): string {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

function getRemainingDays(expiresAt: string): number {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function getStatusLabel(status: VendorMembership["status"]): string {
    const labels: Record<VendorMembership["status"], string> = {
        active: "활성",
        expired: "만료",
        canceled: "취소",
    };
    return labels[status];
}

function getStatusColor(status: VendorMembership["status"]): "success" | "neutral" | "error" {
    const colors: Record<VendorMembership["status"], "success" | "neutral" | "error"> = {
        active: "success",
        expired: "neutral",
        canceled: "error",
    };
    return colors[status];
}

export default function PartnerMembershipPage() {
    const queryClient = useQueryClient();
    const [showPurchase, setShowPurchase] = useState(false);

    const { data: statusData, isLoading: statusLoading } = useQuery({
        queryKey: ["membership", "status"],
        queryFn: () => membershipApi.getStatus(),
    });

    const { data: plansData, isLoading: plansLoading } = useQuery({
        queryKey: ["membership", "plans"],
        queryFn: () => membershipApi.listPlans(),
        enabled: showPurchase,
    });

    const { data: creditData } = useQuery({
        queryKey: ["credits", "balance"],
        queryFn: () => creditsApi.getBalance(),
    });

    const purchaseMutation = useMutation({
        mutationFn: (planId: string) => membershipApi.purchase({ planId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["membership"] });
            queryClient.invalidateQueries({ queryKey: ["credits"] });
            setShowPurchase(false);
        },
    });

    if (statusLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    const status = statusData?.data;
    const membership = status?.membership;
    const isRequired = status?.isRequired ?? false;
    const inGracePeriod = status?.inGracePeriod ?? false;
    const creditBalance = creditData?.data?.account?.balance ?? 0;

    // S등급 아닌 업체
    if (!isRequired) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary" />
                        입점 멤버십
                    </h1>
                    <p className="text-gray-500 mt-1">S등급 업종 입점비 관리</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">입점 멤버십이 필요하지 않습니다</p>
                    <p className="text-sm text-gray-500 mt-1">
                        현재 업체의 카테고리는 입점비 대상이 아닙니다.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary" />
                        입점 멤버십
                    </h1>
                    <p className="text-gray-500 mt-1">S등급 업종 연간 입점비</p>
                </div>
            </div>

            {/* 유예기간 배너 */}
            {inGracePeriod && !membership && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium text-blue-800">유예기간 중입니다</p>
                        <p className="text-sm text-blue-600 mt-1">
                            2026년 4월 1일까지 무료로 서비스를 이용할 수 있습니다.
                            유예기간 후에는 멤버십 구매가 필요합니다.
                        </p>
                    </div>
                </div>
            )}

            {/* 미납 경고 배너 */}
            {!inGracePeriod && !membership && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium text-red-800">입점비 미납 상태</p>
                        <p className="text-sm text-red-600 mt-1">
                            입점비가 납부되지 않아 리드 수신이 제한됩니다.
                            멤버십을 구매해주세요.
                        </p>
                        <Button
                            variant="primary"
                            size="sm"
                            className="mt-3"
                            onClick={() => setShowPurchase(true)}
                        >
                            멤버십 구매하기
                        </Button>
                    </div>
                </div>
            )}

            {/* 활성 멤버십 카드 */}
            {membership ? (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge color={getStatusColor(membership.status)} size="xs">
                                    {getStatusLabel(membership.status)}
                                </Badge>
                                <span className="font-semibold text-content-primary">
                                    {membership.plan?.name ?? "입점 멤버십"}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                결제금액: {formatKRW(membership.pricePaid)}
                            </p>
                            <p className="text-sm text-gray-500">
                                시작: {new Date(membership.startsAt).toLocaleDateString("ko-KR")}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-content-primary">
                                D-{getRemainingDays(membership.expiresAt)}
                            </p>
                            <p className="text-xs text-gray-400">
                                {new Date(membership.expiresAt).toLocaleDateString("ko-KR")} 만료
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            자동갱신: {membership.autoRenew ? "ON" : "OFF"}
                        </div>
                        <Button
                            variant="ghostSecondary"
                            size="sm"
                            onClick={() => setShowPurchase(true)}
                        >
                            연장하기
                        </Button>
                    </div>
                </div>
            ) : !inGracePeriod ? null : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">멤버십이 없습니다</p>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowPurchase(true)}
                    >
                        멤버십 구매하기
                    </Button>
                </div>
            )}

            {/* 구매 패널 */}
            {showPurchase && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-lg font-bold text-content-primary mb-4">멤버십 구매</h2>

                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">보유 크레딧</p>
                        <p className="text-lg font-bold text-content-primary">{formatKRW(creditBalance)}</p>
                    </div>

                    {plansLoading ? (
                        <div className="flex justify-center py-4">
                            <Spinner size="md" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(plansData?.data?.items ?? []).map((plan: MembershipPlan) => {
                                const hasPromo = plan.effectivePrice < plan.price;
                                const canAfford = creditBalance >= plan.effectivePrice;

                                return (
                                    <div
                                        key={plan.id}
                                        className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-medium text-content-primary">{plan.name}</p>
                                            <p className="text-sm text-gray-500">{plan.durationDays}일</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {hasPromo && (
                                                    <span className="text-sm text-gray-400 line-through">
                                                        {formatKRW(plan.price)}
                                                    </span>
                                                )}
                                                <span className="text-lg font-bold text-content-primary">
                                                    {formatKRW(plan.effectivePrice)}
                                                </span>
                                                {hasPromo && (
                                                    <Badge color="success" size="xs">프로모션</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            disabled={!canAfford || purchaseMutation.isPending}
                                            onClick={() => purchaseMutation.mutate(plan.id)}
                                        >
                                            {purchaseMutation.isPending ? "처리 중..." : canAfford ? "구매" : "잔액 부족"}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {purchaseMutation.isError && (
                        <p className="text-sm text-red-500 mt-3">
                            구매에 실패했습니다. 다시 시도해주세요.
                        </p>
                    )}

                    <div className="mt-4 flex justify-end">
                        <Button
                            variant="ghostSecondary"
                            size="sm"
                            onClick={() => setShowPurchase(false)}
                        >
                            취소
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
