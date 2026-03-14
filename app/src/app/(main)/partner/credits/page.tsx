"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, Zap, ChevronRight } from "lucide-react";
import { creditsApi } from "@/api-client/credits";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Button } from "@/components/ui/Button/button";
import { Toggle } from "@/components/ui/Toggle/Toggle";
import { Badge } from "@/components/ui/Badge/Badge";
import type { CreditTransaction } from "@/lib/schema/credit";
import { useState } from "react";

function formatKRW(amount: number): string {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

function getTransactionLabel(type: CreditTransaction["type"]): string {
    const labels: Record<CreditTransaction["type"], string> = {
        charge: "충전",
        charge_bonus: "보너스",
        deduct: "차감",
        refund: "환불",
        recovery: "복구",
        expire: "만료",
        admin_adjust: "관리자 조정",
    };
    return labels[type];
}

function getTransactionBadgeColor(type: CreditTransaction["type"]) {
    const colors: Record<CreditTransaction["type"], "success" | "info" | "error" | "warning" | "neutral" | "purple"> = {
        charge: "success",
        charge_bonus: "info",
        deduct: "error",
        refund: "warning",
        recovery: "info",
        expire: "neutral",
        admin_adjust: "purple",
    };
    return colors[type];
}

export default function PartnerCreditsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [autoChargeAmount, setAutoChargeAmount] = useState<number>(50000);

    const { data: balanceData, isLoading: balanceLoading } = useQuery({
        queryKey: ["credits", "balance"],
        queryFn: () => creditsApi.getBalance(),
    });

    const { data: txData, isLoading: txLoading } = useQuery({
        queryKey: ["credits", "transactions", { page: 1, pageSize: 10 }],
        queryFn: () => creditsApi.getTransactions({ page: 1, pageSize: 10 }),
    });

    const autoChargeMutation = useMutation({
        mutationFn: (params: { enabled: boolean; amount?: number }) =>
            creditsApi.updateAutoCharge(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["credits", "balance"] });
        },
    });

    if (balanceLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    const account = balanceData?.data?.account;
    const packages = balanceData?.data?.packages ?? [];
    const transactions = txData?.data?.items ?? [];

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-primary" />
                    크레딧 관리
                </h1>
                <p className="text-gray-500 mt-1">크레딧을 충전하고 관리하세요</p>
            </div>

            {/* 잔액 카드 */}
            <div className="bg-gradient-to-r from-primary-900 to-[#145a63] rounded-xl p-6 text-white">
                <p className="text-sm text-white/70">현재 잔액</p>
                <p className="text-3xl font-bold mt-1">
                    {formatKRW(account?.balance ?? 0)}
                </p>
            </div>

            {/* 자동충전 설정 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        <div>
                            <p className="font-semibold text-content-primary">자동충전</p>
                            <p className="text-xs text-gray-500">
                                잔액이 1만원 이하일 때 자동으로 충전합니다 (MVP: 알림만 제공)
                            </p>
                        </div>
                    </div>
                    <Toggle
                        checked={account?.autoChargeEnabled ?? false}
                        onChange={(e) => {
                            const enabled = e.target.checked;
                            autoChargeMutation.mutate({
                                enabled,
                                amount: enabled ? autoChargeAmount : undefined,
                            });
                        }}
                        disabled={autoChargeMutation.isPending}
                    />
                </div>
                {account?.autoChargeEnabled && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <label className="text-sm text-gray-600">충전 금액</label>
                        <div className="flex gap-2 mt-2">
                            {[50000, 100000, 300000].map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                        (account?.autoChargeAmount ?? autoChargeAmount) === amt
                                            ? "border-primary bg-primary-50 text-content-primary"
                                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                                    onClick={() => {
                                        setAutoChargeAmount(amt);
                                        autoChargeMutation.mutate({ enabled: true, amount: amt });
                                    }}
                                >
                                    {formatKRW(amt)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 충전 패키지 */}
            <div>
                <h2 className="text-lg font-semibold text-content-primary mb-3">충전하기</h2>
                <div className="grid grid-cols-2 gap-3">
                    {packages.map((pkg) => (
                        <button
                            key={pkg.id}
                            type="button"
                            className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-primary hover:shadow-sm transition-all"
                            onClick={() => router.push(`/partner/credits/charge?packageId=${pkg.id}`)}
                        >
                            <p className="text-lg font-bold text-content-primary">{pkg.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{formatKRW(pkg.amount)}</p>
                            <Button variant="primary" size="sm" className="mt-3 w-full">
                                충전
                            </Button>
                        </button>
                    ))}
                </div>
            </div>

            {/* 최근 거래 내역 */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-content-primary">최근 거래</h2>
                    <button
                        type="button"
                        className="text-sm text-gray-500 hover:text-content-primary flex items-center gap-1"
                        onClick={() => router.push("/partner/credits/transactions")}
                    >
                        전체보기 <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {txLoading ? (
                    <div className="flex justify-center py-6">
                        <Spinner />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                        아직 거래 내역이 없습니다
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <Badge color={getTransactionBadgeColor(tx.type)} size="xs">
                                        {getTransactionLabel(tx.type)}
                                    </Badge>
                                    <span className="text-sm text-gray-600">
                                        {tx.description ?? getTransactionLabel(tx.type)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-medium ${tx.amount > 0 ? "text-primary" : "text-red-500"}`}>
                                        {tx.amount > 0 ? "+" : ""}{formatKRW(tx.amount)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        잔액 {formatKRW(tx.balanceAfter)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
