"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import Link from "next/link";
import dayjs from "dayjs";
import { Receipt, ChevronRight, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Badge } from "@/components/ui/Badge/Badge";
import Pagination from "@/components/widgets/Pagination/Pagination";
import type { SettlementStatus } from "@/lib/schema/settlement";
import { GenerateModal } from "./generate-modal";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: SettlementStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "pending", label: "대기" },
    { value: "confirmed", label: "확인" },
    { value: "paid", label: "지급완료" },
];

const STATUS_BADGE_CONFIG: Record<SettlementStatus, { label: string; color: "warning" | "info" | "success" }> = {
    pending: { label: "대기", color: "warning" },
    confirmed: { label: "확인", color: "info" },
    paid: { label: "지급완료", color: "success" },
};

function formatAmount(amount: number): string {
    return amount.toLocaleString("ko-KR") + "원";
}

export default function AdminSettlementsPage() {
    const queryClient = useQueryClient();
    const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Year/month filter
    const now = new Date();
    const [year, setYear] = useQueryState("year", parseAsInteger.withDefault(now.getFullYear()));
    const [month, setMonth] = useQueryState("month", parseAsInteger.withDefault(0)); // 0 = all

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "settlements", status, year, month, page],
        queryFn: () =>
            adminApi.getSettlements({
                status: status === "all" ? undefined : (status as SettlementStatus),
                year: month > 0 ? year : undefined,
                month: month > 0 ? month : undefined,
                page,
                pageSize: PAGE_SIZE,
            }),
    });

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    const selectedIdsOnPage = items.filter((item) => selectedIds.has(item.id)).map((item) => item.id);
    const selectedCountOnPage = selectedIdsOnPage.length;
    const allSelectedOnPage = items.length > 0 && selectedCountOnPage === items.length;

    // Batch approve mutation
    const batchApproveMutation = useMutation({
        mutationFn: async () => {
            const results = await Promise.allSettled(selectedIdsOnPage.map((id) => adminApi.approveSettlement(id)));
            const succeeded = results.filter((r) => r.status === "fulfilled").length;
            const failed = results.filter((r) => r.status === "rejected").length;
            return { succeeded, failed };
        },
        onSuccess: ({ succeeded, failed }) => {
            toast.success(`${succeeded}건 승인 완료${failed > 0 ? `, ${failed}건 실패` : ""}`);
            setSelectedIds(new Set());
            queryClient.invalidateQueries({ queryKey: ["admin", "settlements"] });
        },
        onError: () => toast.error("일괄 승인에 실패했습니다."),
    });

    // Batch payout mutation
    const batchPayoutMutation = useMutation({
        mutationFn: async () => {
            const results = await Promise.allSettled(selectedIdsOnPage.map((id) => adminApi.payoutSettlement(id)));
            const succeeded = results.filter((r) => r.status === "fulfilled").length;
            const failed = results.filter((r) => r.status === "rejected").length;
            return { succeeded, failed };
        },
        onSuccess: ({ succeeded, failed }) => {
            toast.success(`${succeeded}건 지급완료${failed > 0 ? `, ${failed}건 실패` : ""}`);
            setSelectedIds(new Set());
            queryClient.invalidateQueries({ queryKey: ["admin", "settlements"] });
        },
        onError: () => toast.error("일괄 지급완료에 실패했습니다."),
    });

    const handleToggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleToggleAll = () => {
        if (allSelectedOnPage) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map((i) => i.id)));
        }
    };

    const handleCsvDownload = () => {
        const params = new URLSearchParams();
        params.set("format", "csv");
        if (status !== "all") params.set("status", status);
        if (month > 0) {
            params.set("year", String(year));
            params.set("month", String(month));
        }
        window.open(`/api/admin/settlements?${params.toString()}`, "_blank");
    };

    // Summary stats
    const summaryNetRevenue = items.reduce((sum, s) => sum + s.netRevenue, 0);
    const summaryPending = items.filter((s) => s.status === "pending").length;

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-content-primary">정산 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">업체별 월별 정산을 관리합니다.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleCsvDownload}>
                        <Download className="w-4 h-4 mr-1" />
                        CSV
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setShowGenerateModal(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        정산 생성
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">조회 건수</p>
                        <p className="text-2xl font-bold text-content-primary mt-1">{total}건</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">총 순수익 (현재 페이지)</p>
                        <p className="text-2xl font-bold text-content-primary mt-1">{formatAmount(summaryNetRevenue)}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">미처리 (현재 페이지)</p>
                        <p className="text-2xl font-bold text-orange-600 mt-1">{summaryPending}건</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                {/* Status filter */}
                <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map((opt) => (
                        <Button
                            key={opt.value}
                            variant={status === opt.value ? "listActive" : "list"}
                            size="xs"
                            onClick={() => {
                                setStatus(opt.value);
                                setPage(1);
                                setSelectedIds(new Set());
                            }}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>

                {/* Year/Month filter */}
                <div className="flex gap-3 items-center">
                    <select
                        value={year}
                        onChange={(e) => {
                            setYear(Number(e.target.value));
                            setPage(1);
                            setSelectedIds(new Set());
                        }}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}년
                            </option>
                        ))}
                    </select>
                    <select
                        value={month}
                        onChange={(e) => {
                            setMonth(Number(e.target.value));
                            setPage(1);
                            setSelectedIds(new Set());
                        }}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value={0}>전체 월</option>
                        {months.map((m) => (
                            <option key={m} value={m}>
                                {m}월
                            </option>
                        ))}
                    </select>
                </div>

                {/* Batch actions */}
                {selectedCountOnPage > 0 && (
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                        <span className="text-sm text-gray-600">{selectedCountOnPage}건 선택</span>
                        <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => batchApproveMutation.mutate()}
                            isLoading={batchApproveMutation.isPending}
                        >
                            일괄 승인
                        </Button>
                        <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => batchPayoutMutation.mutate()}
                            isLoading={batchPayoutMutation.isPending}
                        >
                            일괄 지급완료
                        </Button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : items.length === 0 ? (
                    <Empty
                        Icon={<Receipt className="w-12 h-12 text-gray-300" />}
                        title="정산 내역이 없습니다"
                        description="조건에 맞는 정산이 없습니다."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={allSelectedOnPage}
                                            onChange={handleToggleAll}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">업체명</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">기간</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">상태</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">총수익</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">환불</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">순수익</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">항목수</th>
                                    <th className="px-4 py-3 w-8" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((settlement) => {
                                    const config = STATUS_BADGE_CONFIG[settlement.status];
                                    return (
                                        <tr key={settlement.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(settlement.id)}
                                                    onChange={() => handleToggleSelect(settlement.id)}
                                                    className="rounded border-gray-300"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/admin/settlements/${settlement.id}`}
                                                    className="font-medium text-content-primary hover:underline"
                                                >
                                                    {settlement.vendorName ?? "-"}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {dayjs(settlement.periodStart).format("YYYY.MM")}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge color={config.color} size="xs">
                                                    {config.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700">
                                                {formatAmount(settlement.totalRevenue)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-red-500">
                                                {settlement.totalRefunds > 0
                                                    ? `-${formatAmount(settlement.totalRefunds)}`
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-content-primary">
                                                {formatAmount(settlement.netRevenue)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500">
                                                {settlement.totalItemCount}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link href={`/admin/settlements/${settlement.id}`}>
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {total > PAGE_SIZE && (
                    <div className="border-t border-gray-100 py-4">
                        <Pagination
                            pageInfo={[page, PAGE_SIZE]}
                            totalCount={total}
                            handlePageChange={(nextPage) => {
                                setPage(nextPage);
                                setSelectedIds(new Set());
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Generate Modal */}
            <GenerateModal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} />
        </div>
    );
}
