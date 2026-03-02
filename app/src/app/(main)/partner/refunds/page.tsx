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
import type { RefundRequestReason, RefundRequestStatus } from "@/lib/schema/refund";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: RefundRequestStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "pending", label: "심사대기" },
    { value: "approved", label: "환불완료" },
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

function StatusBadge({ status }: { status: RefundRequestStatus }) {
    const config: Record<RefundRequestStatus, { label: string; className: string }> = {
        pending: {
            label: "심사대기",
            className: "bg-amber-100 text-amber-800 border border-amber-200",
        },
        approved: {
            label: "환불완료",
            className: "bg-green-100 text-green-800 border border-green-200",
        },
        rejected: {
            label: "거절",
            className: "bg-red-100 text-red-800 border border-red-200",
        },
    };

    const { label, className } = config[status];

    return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
            {label}
        </span>
    );
}

export default function PartnerRefundsPage() {
    const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

    const [showModal, setShowModal] = useState(false);
    const [leadChargeId, setLeadChargeId] = useState("");
    const [reason, setReason] = useState<RefundRequestReason>("wrong_contact");
    const [description, setDescription] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["refunds", status, page],
        queryFn: () =>
            refundsApi.list({
                status: status === "all" ? undefined : (status as RefundRequestStatus),
                page,
                pageSize: PAGE_SIZE,
            }),
    });

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    const queryClient = useQueryClient();
    const createMutation = useMutation({
        mutationFn: refundsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["refunds"] });
            setShowModal(false);
            setLeadChargeId("");
            setReason("wrong_contact");
            setDescription("");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            leadChargeId,
            reason,
            description: description.trim() || undefined,
        });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setLeadChargeId("");
        setReason("wrong_contact");
        setDescription("");
        createMutation.reset();
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0a3b41]">환불 요청</h1>
                    <p className="text-gray-500 mt-1 text-sm">과금된 리드에 대한 환불을 요청하세요</p>
                </div>
                <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
                    환불 요청
                </Button>
            </div>

            {/* 환불 정책 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">환불 정책 안내</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>과금일로부터 7일 이내에만 환불 요청이 가능합니다.</li>
                    <li>환불 요청은 과금 건당 1회만 가능합니다.</li>
                    <li>관리자 심사 후 승인/거절 결과가 반영됩니다.</li>
                    <li>승인 시 크레딧이 자동으로 복구됩니다.</li>
                </ul>
            </div>

            {/* 상태 필터 탭 */}
            <div className="flex gap-1 border-b border-gray-200">
                {STATUS_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            status === opt.value
                                ? "border-[#0a3b41] text-[#0a3b41]"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => {
                            setStatus(opt.value);
                            setPage(1);
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* 테이블 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-16">
                        <Spinner size="lg" />
                    </div>
                ) : items.length === 0 ? (
                    <Empty title="환불 요청 내역이 없습니다." className="py-16" />
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    요청일
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    사유
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    과금액
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    상태
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    처리일
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-gray-700">
                                        {dayjs(item.createdAt).format("YYYY.MM.DD")}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {REASON_LABELS[item.reason]}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {(item.totalAmount ?? 0).toLocaleString()}원
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {item.reviewedAt
                                            ? dayjs(item.reviewedAt).format("YYYY.MM.DD")
                                            : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* 페이지네이션 */}
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

            {/* 환불 요청 모달 */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleCloseModal();
                    }}
                >
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-[#0a3b41]">환불 요청</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                            {/* 과금 ID */}
                            <div>
                                <label
                                    htmlFor="leadChargeId"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    과금 ID
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    id="leadChargeId"
                                    type="text"
                                    value={leadChargeId}
                                    onChange={(e) => setLeadChargeId(e.target.value)}
                                    placeholder="과금 ID를 입력하세요"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#62e3d5] focus:border-transparent"
                                />
                            </div>

                            {/* 환불 사유 */}
                            <div>
                                <label
                                    htmlFor="reason"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    환불 사유
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <select
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value as RefundRequestReason)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#62e3d5] focus:border-transparent"
                                >
                                    {(Object.entries(REASON_LABELS) as [RefundRequestReason, string][]).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            {/* 상세 설명 */}
                            <div>
                                <label
                                    htmlFor="description"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    상세 설명
                                    <span className="text-gray-400 ml-1 font-normal">(선택)</span>
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="환불 사유에 대한 상세 내용을 입력하세요"
                                    maxLength={2000}
                                    rows={4}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#62e3d5] focus:border-transparent resize-none"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">
                                    {description.length} / 2000
                                </p>
                            </div>

                            {/* 에러 메시지 */}
                            {createMutation.error && (
                                <p className="text-sm text-red-500">
                                    {createMutation.error.message}
                                </p>
                            )}

                            {/* 버튼 */}
                            <div className="flex gap-3 pt-1">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="md"
                                    className="flex-1"
                                    onClick={handleCloseModal}
                                    disabled={createMutation.isPending}
                                >
                                    취소
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    className="flex-1"
                                    isLoading={createMutation.isPending}
                                    disabled={!leadChargeId.trim() || createMutation.isPending}
                                >
                                    제출
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
