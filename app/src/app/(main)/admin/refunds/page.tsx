"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import dayjs from "dayjs";
import { refundsApi } from "@/api-client/refunds";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";
import type { RefundRequestReason, RefundRequestStatus, RefundRequest } from "@/lib/schema/refund";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: RefundRequestStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "pending", label: "심사대기" },
    { value: "approved", label: "승인완료" },
    { value: "rejected", label: "거절" },
];

const REASON_LABELS: Record<RefundRequestReason, string> = {
    wrong_contact: "잘못된 연락처",
    spam_lead: "스팸 리드",
    competitor_lead: "경쟁사 리드",
    no_response: "무응답",
    service_mismatch: "서비스 불일치",
    other: "기타",
};

const STATUS_BADGE: Record<RefundRequestStatus, { label: string; className: string }> = {
    pending: { label: "심사대기", className: "bg-amber-100 text-amber-700" },
    approved: { label: "승인완료", className: "bg-green-100 text-green-700" },
    rejected: { label: "거절", className: "bg-red-100 text-red-700" },
};

export default function AdminRefundsPage() {
    const queryClient = useQueryClient();

    const [status, setStatus] = useQueryState("status", parseAsString.withDefault("pending"));
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

    const [rejectTarget, setRejectTarget] = useState<RefundRequest | null>(null);
    const [rejectNote, setRejectNote] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "refunds", status, page],
        queryFn: () =>
            refundsApi.adminList({
                status: status === "all" ? undefined : (status as RefundRequestStatus),
                page,
                pageSize: PAGE_SIZE,
            }),
    });

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    const approveMutation = useMutation({
        mutationFn: (id: string) => refundsApi.adminReview(id, { action: "approve" }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] }),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
            refundsApi.adminReview(id, { action: "reject", adminNote }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "refunds"] });
            setRejectTarget(null);
            setRejectNote("");
        },
    });

    const handleApprove = (id: string) => {
        if (window.confirm("이 환불 요청을 승인하시겠습니까? 크레딧이 즉시 복구됩니다.")) {
            approveMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-content-primary">환불 요청 심사</h1>
                <p className="text-sm text-gray-500 mt-1">
                    업체가 요청한 환불 건을 검토하고 승인 또는 거절합니다.
                </p>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                        <Button
                            key={opt.value}
                            variant={status === opt.value ? "listActive" : "list"}
                            size="xs"
                            onClick={() => {
                                setStatus(opt.value);
                                setPage(1);
                            }}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : items.length === 0 ? (
                    <Empty title="환불 요청이 없습니다" description="조건에 맞는 환불 요청이 없습니다." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        요청일
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        업체ID
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        사유
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        상세
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        과금액
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        상태
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        관리
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item: RefundRequest) => {
                                    const badge = STATUS_BADGE[item.status];
                                    const description = item.description ?? "-";
                                    const truncatedDescription =
                                        description.length > 30
                                            ? `${description.slice(0, 30)}…`
                                            : description;

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                                {dayjs(item.createdAt).format("YYYY.MM.DD HH:mm")}
                                            </td>
                                            <td className="px-4 py-3 text-content-primary font-mono text-xs">
                                                {item.vendorId.slice(0, 8)}...
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {REASON_LABELS[item.reason]}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                                                {truncatedDescription}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                                {(item.totalAmount ?? 0).toLocaleString()}원
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                                                >
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {item.status === "pending" ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            variant="primary"
                                                            size="xs"
                                                            disabled={
                                                                approveMutation.isPending ||
                                                                rejectMutation.isPending
                                                            }
                                                            isLoading={
                                                                approveMutation.isPending &&
                                                                approveMutation.variables === item.id
                                                            }
                                                            onClick={() => handleApprove(item.id)}
                                                        >
                                                            승인
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="xs"
                                                            disabled={
                                                                approveMutation.isPending ||
                                                                rejectMutation.isPending
                                                            }
                                                            onClick={() => {
                                                                setRejectTarget(item);
                                                                setRejectNote("");
                                                            }}
                                                        >
                                                            거절
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">처리 완료</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {total > PAGE_SIZE && (
                    <div className="border-t border-gray-100 py-4">
                        <Pagination
                            pageInfo={[page, PAGE_SIZE]}
                            totalCount={total}
                            handlePageChange={setPage}
                        />
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => {
                            setRejectTarget(null);
                            setRejectNote("");
                        }}
                    />
                    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
                        <h2 className="text-base font-semibold text-content-primary">환불 거절 사유</h2>
                        <p className="text-sm text-gray-500">
                            사유:{" "}
                            <span className="font-medium text-gray-700">
                                {REASON_LABELS[rejectTarget.reason]}
                            </span>
                        </p>
                        <textarea
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows={4}
                            placeholder="거절 사유를 입력해주세요"
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 pt-1">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setRejectTarget(null);
                                    setRejectNote("");
                                }}
                            >
                                취소
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                disabled={rejectMutation.isPending}
                                isLoading={rejectMutation.isPending}
                                onClick={() => {
                                    rejectMutation.mutate({
                                        id: rejectTarget.id,
                                        adminNote: rejectNote || undefined,
                                    });
                                }}
                            >
                                거절 확인
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
