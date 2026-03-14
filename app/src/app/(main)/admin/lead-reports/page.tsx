"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dayjs from "dayjs";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Badge, type BadgeColor } from "@/components/ui/Badge/Badge";
import { useIsAuthenticated, useUserRole, useAuthStore } from "@/stores/auth";
import type {
    LeadReport,
    LeadReportListResponse,
    LeadReportResponse,
    LeadReportStatus,
} from "@/lib/schema/lead";

const PAGE_SIZE = 20;

const REPORT_REASON_LABELS: Record<string, string> = {
    wrong_contact: "잘못된 연락처",
    test_inquiry: "테스트 문의",
    competitor: "경쟁사 문의",
    inappropriate: "부적절한 내용",
    other: "기타",
};

const REPORT_STATUS_CONFIG: Record<LeadReportStatus, { label: string; color: BadgeColor }> = {
    pending: { label: "대기", color: "warning" },
    approved: { label: "승인됨", color: "success" },
    dismissed: { label: "기각됨", color: "neutral" },
};

const STATUS_FILTER_OPTIONS: { value: LeadReportStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "pending", label: "대기" },
    { value: "approved", label: "승인됨" },
    { value: "dismissed", label: "기각됨" },
];

export default function AdminLeadReportsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const { isInitialized } = useAuthStore();
    const [statusFilter, setStatusFilter] = useState<LeadReportStatus | "all">("pending");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "lead-reports", statusFilter, page],
        queryFn: async () => {
            const params: Record<string, string> = {
                page: String(page),
                pageSize: String(PAGE_SIZE),
            };
            if (statusFilter !== "all") params.status = statusFilter;
            const response = await api.get<LeadReportListResponse>("/api/admin/lead-reports", {
                params,
            });
            return response.data;
        },
        enabled: isAuthenticated && role === "admin",
    });

    const reviewMutation = useMutation({
        mutationFn: async ({ id, action }: { id: string; action: "approve" | "dismiss" }) => {
            const response = await api.post<LeadReportResponse>(
                `/api/admin/lead-reports/${id}/review`,
                { action },
            );
            return response.data;
        },
        onSuccess: (_, { action }) => {
            toast.success(action === "approve" ? "승인 및 환불 처리되었습니다" : "기각되었습니다");
            queryClient.invalidateQueries({ queryKey: ["admin", "lead-reports"] });
        },
    });

    if (!isInitialized) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        router.replace("/login");
        return null;
    }

    if (role !== "admin") {
        router.replace("/");
        return null;
    }

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-content-primary">허위 리드 신고 관리</h1>
                <p className="text-sm text-gray-500 mt-1">
                    업체가 신고한 허위 리드를 검토하고 환불 여부를 결정합니다.
                </p>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex gap-2">
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                        <Button
                            key={opt.value}
                            variant={statusFilter === opt.value ? "listActive" : "list"}
                            size="xs"
                            onClick={() => {
                                setStatusFilter(opt.value);
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
                    <Empty title="신고 내역이 없습니다" description="조건에 맞는 신고가 없습니다." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        리드 ID
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        사유
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        상세
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        상태
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                                        신고일
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                                        관리
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((report: LeadReport) => {
                                    const statusCfg = REPORT_STATUS_CONFIG[report.status];
                                    return (
                                        <tr key={report.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-content-primary font-mono text-xs">
                                                {report.leadId.slice(0, 8)}...
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {REPORT_REASON_LABELS[report.reason] ??
                                                    report.reason}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                                                {report.detail ?? "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge color={statusCfg.color} size="sm">
                                                    {statusCfg.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {dayjs(report.createdAt).format(
                                                    "YYYY.MM.DD HH:mm",
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {report.status === "pending" && (
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            variant="primary"
                                                            size="xs"
                                                            disabled={reviewMutation.isPending}
                                                            isLoading={
                                                                reviewMutation.isPending &&
                                                                reviewMutation.variables?.id ===
                                                                    report.id &&
                                                                reviewMutation.variables?.action ===
                                                                    "approve"
                                                            }
                                                            onClick={() =>
                                                                reviewMutation.mutate({
                                                                    id: report.id,
                                                                    action: "approve",
                                                                })
                                                            }
                                                        >
                                                            승인 (환불)
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="xs"
                                                            disabled={reviewMutation.isPending}
                                                            isLoading={
                                                                reviewMutation.isPending &&
                                                                reviewMutation.variables?.id ===
                                                                    report.id &&
                                                                reviewMutation.variables?.action ===
                                                                    "dismiss"
                                                            }
                                                            onClick={() =>
                                                                reviewMutation.mutate({
                                                                    id: report.id,
                                                                    action: "dismiss",
                                                                })
                                                            }
                                                        >
                                                            기각
                                                        </Button>
                                                    </div>
                                                )}
                                                {report.status !== "pending" && (
                                                    <span className="text-xs text-gray-400">
                                                        처리 완료
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Simple pagination */}
                {total > PAGE_SIZE && (
                    <div className="border-t border-gray-100 p-4 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            총 {total}건 중 {(page - 1) * PAGE_SIZE + 1}-
                            {Math.min(page * PAGE_SIZE, total)}건
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="xs"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                이전
                            </Button>
                            <Button
                                variant="secondary"
                                size="xs"
                                disabled={page * PAGE_SIZE >= total}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                다음
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
