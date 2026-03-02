"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";
import dayjs from "dayjs";
import { ArrowLeft, CheckCircle, CreditCard } from "lucide-react";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Badge } from "@/components/ui/Badge/Badge";
import Pagination from "@/components/widgets/Pagination/Pagination";
import type { SettlementItemType, SettlementStatus } from "@/lib/schema/settlement";

const PAGE_SIZE = 20;

const STATUS_BADGE_CONFIG: Record<SettlementStatus, { label: string; color: "warning" | "info" | "success" }> = {
    pending: { label: "대기", color: "warning" },
    confirmed: { label: "확인", color: "info" },
    paid: { label: "지급완료", color: "success" },
};

const ITEM_TYPE_LABELS: Record<SettlementItemType, string> = {
    lead_charge: "리드 과금",
    subscription: "구독",
    membership: "입점비",
    ad_purchase: "광고",
    bid_commission: "비딩 수수료",
};

const ITEM_TYPE_OPTIONS: { value: SettlementItemType | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "lead_charge", label: "리드 과금" },
    { value: "subscription", label: "구독" },
    { value: "membership", label: "입점비" },
    { value: "ad_purchase", label: "광고" },
    { value: "bid_commission", label: "비딩 수수료" },
];

function formatAmount(amount: number): string {
    return amount.toLocaleString("ko-KR") + "원";
}

export default function AdminSettlementDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [itemType, setItemType] = useQueryState("type", parseAsString.withDefault("all"));
    const [itemPage, setItemPage] = useQueryState("itemPage", parseAsInteger.withDefault(1));
    const [notes, setNotes] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "settlements", params.id, itemType, itemPage],
        queryFn: () =>
            adminApi.getSettlement(params.id, {
                itemType: itemType === "all" ? undefined : itemType,
                itemPage,
                itemPageSize: PAGE_SIZE,
            }),
    });

    const settlement = data?.data?.settlement;
    const items = data?.data?.items ?? [];
    const itemTotal = data?.data?.itemTotal ?? 0;

    const approveMutation = useMutation({
        mutationFn: () => adminApi.approveSettlement(params.id, { notes: notes || undefined }),
        onSuccess: () => {
            toast.success("정산이 승인되었습니다.");
            setNotes("");
            queryClient.invalidateQueries({ queryKey: ["admin", "settlements"] });
        },
        onError: () => toast.error("승인에 실패했습니다."),
    });

    const payoutMutation = useMutation({
        mutationFn: () => adminApi.payoutSettlement(params.id, { notes: notes || undefined }),
        onSuccess: () => {
            toast.success("지급완료 처리되었습니다.");
            setNotes("");
            queryClient.invalidateQueries({ queryKey: ["admin", "settlements"] });
        },
        onError: () => toast.error("지급완료 처리에 실패했습니다."),
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!settlement) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">정산을 찾을 수 없습니다.</p>
                <Button variant="secondary" size="sm" onClick={() => router.back()} className="mt-4">
                    돌아가기
                </Button>
            </div>
        );
    }

    const statusConfig = STATUS_BADGE_CONFIG[settlement.status];
    const canApprove = settlement.status === "pending";
    const canPayout = settlement.status === "confirmed";

    const breakdownItems = [
        { label: "리드 과금", value: settlement.leadChargeRevenue, refund: settlement.leadChargeRefunds },
        { label: "구독", value: settlement.subscriptionRevenue },
        { label: "입점비", value: settlement.membershipRevenue },
        { label: "광고", value: settlement.adPurchaseRevenue },
        { label: "비딩 수수료", value: settlement.bidCommissionRevenue },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge color={statusConfig.color} size="sm">
                            {statusConfig.label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                            {dayjs(settlement.periodStart).format("YYYY년 MM월")}
                        </span>
                    </div>
                    <h1 className="text-lg font-bold text-[#0a3b41]">
                        {settlement.vendorName ?? "업체"} 정산 상세
                    </h1>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">총수익</p>
                        <p className="text-lg font-bold text-[#0a3b41]">{formatAmount(settlement.totalRevenue)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">환불</p>
                        <p className="text-lg font-bold text-red-500">
                            {settlement.totalRefunds > 0 ? `-${formatAmount(settlement.totalRefunds)}` : "-"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">순수익</p>
                        <p className="text-lg font-bold text-[#0a3b41]">{formatAmount(settlement.netRevenue)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">항목수</p>
                        <p className="text-lg font-bold text-[#0a3b41]">{settlement.totalItemCount}건</p>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">수익원별 내역</h3>
                    <div className="space-y-2">
                        {breakdownItems.map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{item.label}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-800">{formatAmount(item.value)}</span>
                                    {item.refund && item.refund > 0 && (
                                        <span className="text-red-500 text-xs">
                                            (환불 -{formatAmount(item.refund)})
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timestamps */}
                <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>생성: {dayjs(settlement.createdAt).format("YYYY.MM.DD HH:mm")}</span>
                    {settlement.confirmedAt && (
                        <span>확인: {dayjs(settlement.confirmedAt).format("YYYY.MM.DD HH:mm")}</span>
                    )}
                    {settlement.paidAt && (
                        <span>지급: {dayjs(settlement.paidAt).format("YYYY.MM.DD HH:mm")}</span>
                    )}
                </div>

                {/* Notes display */}
                {settlement.notes && (
                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-500 mb-1">메모</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{settlement.notes}</p>
                    </div>
                )}

                {/* Actions */}
                {(canApprove || canPayout) && (
                    <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="메모 (선택)"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62e3d5]"
                            maxLength={1000}
                        />
                        <div className="flex gap-2">
                            {canApprove && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => approveMutation.mutate()}
                                    isLoading={approveMutation.isPending}
                                >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    승인
                                </Button>
                            )}
                            {canPayout && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => payoutMutation.mutate()}
                                    isLoading={payoutMutation.isPending}
                                >
                                    <CreditCard className="w-4 h-4 mr-1" />
                                    지급완료
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-[#0a3b41]">정산 항목</h3>
                        <div className="flex gap-2">
                            {ITEM_TYPE_OPTIONS.map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant={itemType === opt.value ? "listActive" : "list"}
                                    size="xs"
                                    onClick={() => {
                                        setItemType(opt.value);
                                        setItemPage(1);
                                    }}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-sm">항목이 없습니다.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">유형</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">금액</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">환불</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">순액</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">설명</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">원본일시</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Badge color="neutral" size="xs">
                                                {ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700">
                                            {formatAmount(item.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-red-500">
                                            {item.refundAmount > 0 ? `-${formatAmount(item.refundAmount)}` : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-[#0a3b41]">
                                            {formatAmount(item.netAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                                            {item.description ?? "-"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {item.sourceCreatedAt
                                                ? dayjs(item.sourceCreatedAt).format("YYYY.MM.DD HH:mm")
                                                : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {itemTotal > PAGE_SIZE && (
                    <div className="border-t border-gray-100 py-4">
                        <Pagination
                            pageInfo={[itemPage, PAGE_SIZE]}
                            totalCount={itemTotal}
                            handlePageChange={setItemPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
