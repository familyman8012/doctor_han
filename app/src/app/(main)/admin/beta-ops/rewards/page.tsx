"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api-client/admin";
import { Badge } from "@/components/ui/Badge/Badge";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { toast } from "sonner";
import type { AdminCreditAdjustType } from "@/lib/schema/credit";
import { CheckCircle, Gift, MinusCircle, PlusCircle } from "lucide-react";

const GRADE_BADGE_MAP: Record<string, "success" | "warning" | "error"> = {
    A: "success",
    B: "warning",
    C: "error",
};

function formatMinutes(m: number | null | undefined): string {
    if (m == null) return "-";
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

function formatRate(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
}

const ADJUST_TYPE_LABELS: Record<string, string> = {
    beta_initial: "베타 초기",
    beta_bonus: "베타 보너스",
    manual_grant: "수동 지급",
    manual_deduct: "수동 차감",
    penalty: "패널티",
};

export default function BetaOpsRewardsPage() {
    const queryClient = useQueryClient();
    const [manualVendorId, setManualVendorId] = useState("");
    const [manualAmount, setManualAmount] = useState("");
    const [manualReason, setManualReason] = useState("");
    const [manualAdjustType, setManualAdjustType] = useState<AdminCreditAdjustType>("manual_grant");

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "beta-ops", "rewards"],
        queryFn: () => adminApi.getBetaOpsRewards(),
    });

    const items = data?.data?.items ?? [];

    const adjustMutation = useMutation({
        mutationFn: (params: { vendorId: string; amount: number; reason: string; adjustType: AdminCreditAdjustType }) =>
            adminApi.adjustVendorCredit(params.vendorId, {
                amount: params.amount,
                reason: params.reason,
                adjustType: params.adjustType,
            }),
        onSuccess: () => {
            toast.success("크레딧이 조정되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin", "beta-ops", "rewards"] });
            setManualAmount("");
            setManualReason("");
        },
        onError: () => {
            toast.error("크레딧 조정에 실패했습니다.");
        },
    });

    const handleBetaGrant = (vendorId: string, vendorName: string, type: "beta_initial" | "beta_bonus") => {
        const amount = type === "beta_initial" ? 100000 : 150000;
        const label = type === "beta_initial" ? "초기 크레딧 100,000원" : "보너스 크레딧 150,000원";

        if (!window.confirm(`${vendorName}에 ${label}을 지급하시겠습니까?`)) return;

        adjustMutation.mutate({
            vendorId,
            amount,
            reason: type === "beta_initial" ? "베타 초기 크레딧 지급" : "베타 보너스 크레딧 지급 (조건 충족)",
            adjustType: type,
        });
    };

    const handleManualSubmit = () => {
        if (!manualVendorId || !manualAmount || !manualReason) {
            toast.error("모든 필드를 입력해주세요.");
            return;
        }

        const amount = parseInt(manualAmount, 10);
        if (isNaN(amount) || amount === 0) {
            toast.error("유효한 금액을 입력해주세요.");
            return;
        }

        // 차감/패널티는 음수로 변환
        const finalAmount =
            (manualAdjustType === "manual_deduct" || manualAdjustType === "penalty")
                ? -Math.abs(amount)
                : Math.abs(amount);

        const vendor = items.find((i) => i.vendorId === manualVendorId);
        const action = finalAmount > 0 ? "지급" : "차감";

        if (!window.confirm(
            `${vendor?.vendorName ?? manualVendorId}에 ${Math.abs(finalAmount).toLocaleString()}원 ${action}하시겠습니까?\n사유: ${manualReason}`,
        )) return;

        adjustMutation.mutate({
            vendorId: manualVendorId,
            amount: finalAmount,
            reason: manualReason,
            adjustType: manualAdjustType,
        });
    };

    return (
        <div className="space-y-6">
            {/* Beta Reward Eligibility Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-semibold text-content-primary flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        베타 보상 자격 현황
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        초기 100,000원 / 조건 충족 시 보너스 150,000원 (응답률 ≥80%, 평균 응답 ≤24h, 리드 ≥1건)
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Spinner />
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-20">
                        <Empty description="업체 데이터가 없습니다" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">업체명</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">등급</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">응답률</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">평균 응답</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">리드 수</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">잔액</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">초기 크레딧</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">보너스</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">액션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.vendorId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium">{item.vendorName}</td>
                                        <td className="px-4 py-3">
                                            <Badge color={GRADE_BADGE_MAP[item.grade] ?? "neutral"}>{item.grade}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{formatRate(item.responseRate)}</td>
                                        <td className="px-4 py-3 text-gray-600">{formatMinutes(item.avgResponseTimeMinutes)}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.totalLeads}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.balance.toLocaleString()}원</td>
                                        <td className="px-4 py-3">
                                            {item.initialGranted ? (
                                                <Badge color="success">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    지급완료
                                                </Badge>
                                            ) : (
                                                <Badge color="neutral">미지급</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.bonusGranted ? (
                                                <Badge color="success">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    지급완료
                                                </Badge>
                                            ) : item.bonusEligible ? (
                                                <Badge color="warning">자격충족</Badge>
                                            ) : (
                                                <Badge color="neutral">미충족</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1.5">
                                                {!item.initialGranted && (
                                                    <Button
                                                        variant="secondary"
                                                        size="xs"
                                                        onClick={() => handleBetaGrant(item.vendorId, item.vendorName, "beta_initial")}
                                                        disabled={adjustMutation.isPending}
                                                        LeadingIcon={<PlusCircle />}
                                                    >
                                                        초기 10만
                                                    </Button>
                                                )}
                                                {!item.bonusGranted && item.bonusEligible && (
                                                    <Button
                                                        variant="secondary"
                                                        size="xs"
                                                        onClick={() => handleBetaGrant(item.vendorId, item.vendorName, "beta_bonus")}
                                                        disabled={adjustMutation.isPending}
                                                        LeadingIcon={<Gift />}
                                                    >
                                                        보너스 15만
                                                    </Button>
                                                )}
                                                {item.initialGranted && (item.bonusGranted || !item.bonusEligible) && (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Manual Credit Adjust Form */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="font-semibold text-content-primary flex items-center gap-2">
                        {manualAdjustType === "manual_deduct" || manualAdjustType === "penalty" ? (
                            <MinusCircle className="w-4 h-4" />
                        ) : (
                            <PlusCircle className="w-4 h-4" />
                        )}
                        수동 크레딧 조정
                    </h2>
                </div>

                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Vendor selector */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">업체 선택</label>
                            <select
                                value={manualVendorId}
                                onChange={(e) => setManualVendorId(e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="">업체를 선택하세요</option>
                                {items.map((item) => (
                                    <option key={item.vendorId} value={item.vendorId}>
                                        {item.vendorName} (잔액: {item.balance.toLocaleString()}원)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Adjust type */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">유형</label>
                            <select
                                value={manualAdjustType}
                                onChange={(e) => setManualAdjustType(e.target.value as AdminCreditAdjustType)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                {Object.entries(ADJUST_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">
                                금액 (원){" "}
                                <span className="text-gray-400">
                                    {manualAdjustType === "manual_deduct" || manualAdjustType === "penalty"
                                        ? "- 자동 음수 처리"
                                        : "- 자동 양수 처리"}
                                </span>
                            </label>
                            <input
                                type="number"
                                value={manualAmount}
                                onChange={(e) => setManualAmount(e.target.value)}
                                placeholder="예: 100000"
                                min={1}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Reason */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-600">사유</label>
                            <input
                                type="text"
                                value={manualReason}
                                onChange={(e) => setManualReason(e.target.value)}
                                placeholder="조정 사유를 입력하세요"
                                maxLength={500}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant={manualAdjustType === "manual_deduct" || manualAdjustType === "penalty" ? "danger" : "primary"}
                            size="sm"
                            onClick={handleManualSubmit}
                            disabled={adjustMutation.isPending || !manualVendorId || !manualAmount || !manualReason}
                            isLoading={adjustMutation.isPending}
                        >
                            {manualAdjustType === "manual_deduct" || manualAdjustType === "penalty" ? "차감하기" : "지급하기"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
