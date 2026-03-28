"use client";

import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { adminApi } from "@/api-client/admin";
import { Badge } from "@/components/ui/Badge/Badge";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";
import { ArrowRight } from "lucide-react";

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

function formatDuration(minutes: number | null | undefined): string {
    if (minutes == null) return "-";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h < 24) return `${h}h ${m}m`;
    const d = Math.floor(h / 24);
    const remainH = h % 24;
    return `${d}d ${remainH}h`;
}

function formatDateTime(date: string | null | undefined): string {
    if (!date) return "-";
    return new Date(date).toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function StatusBadge({ status }: { status: string }) {
    const badge = STATUS_BADGE_MAP[status];
    if (!badge) return <Badge color="neutral">{status}</Badge>;
    return <Badge color={badge.variant}>{badge.label}</Badge>;
}

export default function BetaOpsHistoryPage() {
    const [leadId, setLeadId] = useQueryState("leadId", parseAsString.withDefault(""));
    const [vendorId, setVendorId] = useQueryState("vendorId", parseAsString.withDefault(""));
    const [from, setFrom] = useQueryState("from", parseAsString.withDefault(""));
    const [to, setTo] = useQueryState("to", parseAsString.withDefault(""));
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "beta-ops", "history", leadId, vendorId, from, to, page],
        queryFn: () =>
            adminApi.getBetaOpsStatusHistory({
                leadId: leadId || undefined,
                vendorId: vendorId || undefined,
                from: from || undefined,
                to: to || undefined,
                page,
                pageSize: 20,
            }),
    });

    const items = data?.data?.items ?? [];
    const totalCount = data?.data?.total ?? 0;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Lead ID</label>
                    <Input
                        type="text"
                        placeholder="Lead ID"
                        value={leadId}
                        onChange={(e) => {
                            setLeadId(e.target.value);
                            setPage(1);
                        }}
                        className="w-48"
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
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Spinner />
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-20">
                        <Empty description="상태 이력이 없습니다" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Lead ID</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">From → To</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">변경자</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">시각</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">생성 후 경과</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">이전 변경 후 경과</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                            {item.leadId.slice(0, 8)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1.5">
                                                {item.fromStatus && <StatusBadge status={item.fromStatus} />}
                                                <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <StatusBadge status={item.toStatus} />
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{item.changedByName ?? "-"}</td>
                                        <td className="px-4 py-3 text-gray-500">{formatDateTime(item.createdAt)}</td>
                                        <td className="px-4 py-3 text-gray-500">{formatDuration(item.timeSinceLeadCreationMinutes)}</td>
                                        <td className="px-4 py-3 text-gray-500">{formatDuration(item.timeSincePreviousChangeMinutes)}</td>
                                    </tr>
                                ))}
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
