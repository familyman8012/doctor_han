"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Badge } from "@/components/ui/Badge/Badge";
import { Button } from "@/components/ui/Button/button";
import { Empty } from "@/components/ui/Empty/Empty";
import type { AdminMembershipListResponse } from "@/lib/schema/vendor-membership";
import api from "@/api-client/client";

function formatKRW(amount: number): string {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

const STATUS_LABELS: Record<string, string> = {
    active: "활성",
    expired: "만료",
    canceled: "취소",
};

const STATUS_COLORS: Record<string, "success" | "neutral" | "error"> = {
    active: "success",
    expired: "neutral",
    canceled: "error",
};

export default function AdminMembershipsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "memberships", statusFilter, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter) params.set("status", statusFilter);
            params.set("page", String(page));
            params.set("pageSize", "20");
            const res = await api.get<AdminMembershipListResponse>(
                `/api/admin/memberships?${params.toString()}`,
            );
            return res.data;
        },
    });

    const cancelMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/api/admin/memberships/${id}`, { status: "canceled" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] });
        },
    });

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;
    const totalPages = Math.ceil(total / 20);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    입점 멤버십 관리
                </h1>
                <p className="text-sm text-gray-500">총 {total}건</p>
            </div>

            {/* 필터 */}
            <div className="flex gap-2">
                {["", "active", "expired", "canceled"].map((s) => (
                    <button
                        key={s}
                        type="button"
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            statusFilter === s
                                ? "bg-primary-900 text-white border-primary-900"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => {
                            setStatusFilter(s);
                            setPage(1);
                        }}
                    >
                        {s === "" ? "전체" : STATUS_LABELS[s]}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Spinner size="lg" />
                </div>
            ) : items.length === 0 ? (
                <Empty title="멤버십이 없습니다" description="등록된 입점 멤버십이 없습니다." />
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">업체명</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">상태</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">플랜</th>
                                <th className="text-right px-4 py-3 font-medium text-gray-600">결제금액</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">만료일</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600">액션</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((m) => (
                                <tr key={m.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-content-primary">
                                        {m.vendorName ?? "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge color={STATUS_COLORS[m.status]} size="xs">
                                            {STATUS_LABELS[m.status]}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {m.plan?.name ?? "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600">
                                        {formatKRW(m.pricePaid)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(m.expiresAt).toLocaleDateString("ko-KR")}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {m.status === "active" && (
                                            <Button
                                                variant="ghostSecondary"
                                                size="sm"
                                                disabled={cancelMutation.isPending}
                                                onClick={() => {
                                                    if (confirm("이 멤버십을 취소하시겠습니까?")) {
                                                        cancelMutation.mutate(m.id);
                                                    }
                                                }}
                                            >
                                                취소
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="ghostSecondary"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                    >
                        이전
                    </Button>
                    <span className="flex items-center text-sm text-gray-600">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="ghostSecondary"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        다음
                    </Button>
                </div>
            )}
        </div>
    );
}
