"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { creditsApi } from "@/api-client/credits";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Badge } from "@/components/ui/Badge/Badge";
import { Empty } from "@/components/ui/Empty/Empty";
import type { CreditTransaction, CreditTransactionType } from "@/lib/schema/credit";

function formatKRW(amount: number): string {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const TX_TYPE_LABELS: Record<CreditTransactionType, string> = {
    charge: "충전",
    charge_bonus: "보너스",
    deduct: "차감",
    refund: "환불",
    recovery: "복구",
    expire: "만료",
    admin_adjust: "관리자 조정",
};

const TX_TYPE_COLORS: Record<CreditTransactionType, "success" | "info" | "error" | "warning" | "neutral" | "purple"> = {
    charge: "success",
    charge_bonus: "info",
    deduct: "error",
    refund: "warning",
    recovery: "info",
    expire: "neutral",
    admin_adjust: "purple",
};

const TYPE_FILTERS: { label: string; value: string | null }[] = [
    { label: "전체", value: null },
    { label: "충전", value: "charge" },
    { label: "차감", value: "deduct" },
    { label: "환불", value: "refund" },
    { label: "보너스", value: "charge_bonus" },
];

export default function TransactionsPage() {
    const [typeFilter, setTypeFilter] = useQueryState("type");
    const [pageStr, setPage] = useQueryState("page");
    const page = Number(pageStr) || 1;

    const { data, isLoading } = useQuery({
        queryKey: ["credits", "transactions", { page, type: typeFilter }],
        queryFn: () =>
            creditsApi.getTransactions({
                page,
                pageSize: 20,
                type: typeFilter as CreditTransactionType | undefined,
            }),
    });

    const transactions = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;
    const totalPages = Math.ceil(total / 20);

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <Link
                    href="/partner/credits"
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-content-primary">거래 내역</h1>
                    <p className="text-sm text-gray-500">총 {total}건</p>
                </div>
            </div>

            {/* 필터 */}
            <div className="flex gap-2 overflow-x-auto">
                {TYPE_FILTERS.map((f) => (
                    <button
                        key={f.value ?? "all"}
                        type="button"
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            typeFilter === f.value
                                ? "bg-primary-900 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        onClick={() => {
                            setTypeFilter(f.value);
                            setPage(null);
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* 내역 */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spinner size="lg" />
                </div>
            ) : transactions.length === 0 ? (
                <Empty
                    title="거래 내역이 없습니다"
                    description={typeFilter ? "해당 유형의 거래가 없습니다" : "아직 거래 내역이 없습니다"}
                />
            ) : (
                <>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {/* 테이블 헤더 */}
                        <div className="hidden sm:grid grid-cols-[120px_80px_1fr_120px_120px] gap-2 px-4 py-2.5 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-200">
                            <span>날짜</span>
                            <span>유형</span>
                            <span>설명</span>
                            <span className="text-right">금액</span>
                            <span className="text-right">잔액</span>
                        </div>

                        {/* 행 */}
                        <div className="divide-y divide-gray-100">
                            {transactions.map((tx) => (
                                <TransactionRow key={tx.id} tx={tx} />
                            ))}
                        </div>
                    </div>

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                        page === p
                                            ? "bg-primary-900 text-white"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                    onClick={() => setPage(String(p))}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function TransactionRow({ tx }: { tx: CreditTransaction }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-[120px_80px_1fr_120px_120px] gap-1 sm:gap-2 px-4 py-3 sm:items-center">
            <span className="text-xs text-gray-400 sm:text-sm sm:text-gray-600">
                {formatDate(tx.createdAt)}
            </span>
            <span>
                <Badge color={TX_TYPE_COLORS[tx.type]} size="xs">
                    {TX_TYPE_LABELS[tx.type]}
                </Badge>
            </span>
            <span className="text-sm text-gray-700 truncate">
                {tx.description ?? TX_TYPE_LABELS[tx.type]}
            </span>
            <span className={`text-sm font-medium sm:text-right ${tx.amount > 0 ? "text-primary" : "text-red-500"}`}>
                {tx.amount > 0 ? "+" : ""}{formatKRW(tx.amount)}
            </span>
            <span className="text-xs text-gray-400 sm:text-sm sm:text-right">
                {formatKRW(tx.balanceAfter)}
            </span>
        </div>
    );
}
