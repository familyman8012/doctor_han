"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { adminApi } from "@/api-client/admin";
import type { AdminLeadOpsListQuery } from "@/lib/schema/beta-ops";
import { Badge } from "@/components/ui/Badge/Badge";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";

const STATUS_OPTIONS = [
    { value: "", label: "전체" },
    { value: "submitted", label: "접수" },
    { value: "in_progress", label: "진행중" },
    { value: "quote_pending", label: "견적대기" },
    { value: "negotiating", label: "협의중" },
    { value: "contracted", label: "계약" },
    { value: "hold", label: "보류" },
    { value: "canceled", label: "취소" },
    { value: "closed", label: "종료" },
] as const;

const STATUS_BADGE_MAP: Record<string, { variant: "success" | "warning" | "error" | "info" | "neutral"; label: string }> = {
    submitted: { variant: "neutral", label: "접수" },
    in_progress: { variant: "info", label: "진행중" },
    quote_pending: { variant: "warning", label: "견적대기" },
    negotiating: { variant: "warning", label: "협의중" },
    contracted: { variant: "success", label: "계약" },
    hold: { variant: "neutral", label: "보류" },
    canceled: { variant: "error", label: "취소" },
    closed: { variant: "neutral", label: "종료" },
};

function formatMinutes(m: number | null | undefined): string {
    if (m == null) return "-";
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

function formatDate(date: string | null | undefined): string {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ko-KR");
}

export default function BetaOpsLeadsPage() {
    const [status, setStatus] = useQueryState("status", parseAsString.withDefault(""));
    const [vendorId, setVendorId] = useQueryState("vendorId", parseAsString.withDefault(""));
    const [from, setFrom] = useQueryState("from", parseAsString.withDefault(""));
    const [to, setTo] = useQueryState("to", parseAsString.withDefault(""));
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "beta-ops", "leads", status, vendorId, from, to, page],
        queryFn: () =>
            adminApi.getBetaOpsLeads({
                status: (status || undefined) as AdminLeadOpsListQuery["status"],
                vendorId: vendorId || undefined,
                from: from || undefined,
                to: to || undefined,
                page,
                pageSize: 20,
            }),
    });

    const leads = data?.data?.items ?? [];
    const totalCount = data?.data?.total ?? 0;

    return (
        <div className="space-y-4">
            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                    <Button
                        key={opt.value}
                        variant={status === opt.value ? "listActive" : "list"}
                        onClick={() => {
                            setStatus(opt.value);
                            setPage(1);
                        }}
                    >
                        {opt.label}
                    </Button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">시작일</label>
                    <Input
                        type="date"
                        value={from}
                        onChange={(e) => {
                            setFrom(e.target.value);
                            setPage(1);
                        }}
                        className="w-40"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">종료일</label>
                    <Input
                        type="date"
                        value={to}
                        onChange={(e) => {
                            setTo(e.target.value);
                            setPage(1);
                        }}
                        className="w-40"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">업체 ID</label>
                    <Input
                        type="text"
                        placeholder="업체 ID"
                        value={vendorId}
                        onChange={(e) => {
                            setVendorId(e.target.value);
                            setPage(1);
                        }}
                        className="w-48"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Spinner />
                    </div>
                ) : leads.length === 0 ? (
                    <div className="py-20">
                        <Empty description="조건에 맞는 리드가 없습니다" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Lead ID</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">의료인</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">업체</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">생성일</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">열람일</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">응답시간</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((lead) => {
                                    const badge = STATUS_BADGE_MAP[lead.status];
                                    return (
                                        <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                                {lead.id.slice(0, 8)}
                                            </td>
                                            <td className="px-4 py-3">{lead.doctorName ?? "-"}</td>
                                            <td className="px-4 py-3">{lead.vendorName ?? "-"}</td>
                                            <td className="px-4 py-3">
                                                {badge ? (
                                                    <Badge color={badge.variant}>{badge.label}</Badge>
                                                ) : (
                                                    <Badge color="neutral">{lead.status}</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{formatDate(lead.createdAt)}</td>
                                            <td className="px-4 py-3 text-gray-500">{formatDate(lead.viewedAt)}</td>
                                            <td className="px-4 py-3 text-gray-500">{formatMinutes(lead.responseTimeMinutes)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalCount > 0 && (
                <Pagination
                    pageInfo={[page, 20]}
                    totalCount={totalCount}
                    handlePageChange={(p) => setPage(p)}
                />
            )}
        </div>
    );
}
