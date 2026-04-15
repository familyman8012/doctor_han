"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gavel, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { biddingApi } from "@/api-client/bidding";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Badge } from "@/components/ui/Badge/Badge";
import { useQueryState } from "nuqs";
import type { BidProjectStatus } from "@/lib/schema/bidding";

const STATUS_LABELS: Record<BidProjectStatus, string> = {
    draft: "임시저장",
    open: "매칭중",
    bidding: "입찰중",
    selecting: "선정중",
    contracted: "계약완료",
    in_progress: "시공중",
    completed: "완료",
    settled: "정산완료",
    canceled: "취소됨",
};

const STATUS_COLORS: Record<BidProjectStatus, "green" | "blue" | "orange" | "red" | "gray"> = {
    draft: "gray",
    open: "blue",
    bidding: "blue",
    selecting: "orange",
    contracted: "green",
    in_progress: "green",
    completed: "green",
    settled: "gray",
    canceled: "red",
};

export default function AdminBidProjectsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useQueryState("status");

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/admin/bid-projects/${id}`);
        },
        onSuccess: () => {
            toast.success("프로젝트가 삭제되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin", "bid-projects"] });
        },
        onError: () => toast.error("삭제에 실패했습니다."),
    });

    const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
        e.stopPropagation();
        if (confirm(`"${title}" 프로젝트를 삭제하시겠습니까?\n입찰 응답도 함께 삭제됩니다.`)) {
            deleteMutation.mutate(id);
        }
    };

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "bid-projects", statusFilter],
        queryFn: () => biddingApi.adminList({ status: statusFilter as BidProjectStatus | undefined }),
    });

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                    <Gavel className="w-6 h-6 text-primary" />
                    비딩 프로젝트 관리
                </h1>
                <p className="text-gray-500 mt-1">총 {total}건</p>
            </div>

            {/* 상태 필터 */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setStatusFilter(null)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        !statusFilter
                            ? "bg-primary-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                    전체
                </button>
                {(Object.keys(STATUS_LABELS) as BidProjectStatus[]).map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            statusFilter === s
                                ? "bg-primary-900 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                        {STATUS_LABELS[s]}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spinner size="lg" />
                </div>
            ) : items.length === 0 ? (
                <Empty title="프로젝트가 없습니다" description="아직 등록된 비딩 프로젝트가 없습니다" />
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">제목</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">위치</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">예산</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">상태</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">등록일</th>
                                <th className="px-4 py-3 w-16" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((project) => (
                                <tr
                                    key={project.id}
                                    onClick={() => router.push(`/admin/bid-projects/${project.id}`)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3 font-medium text-content-primary">
                                        {project.title}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{project.location}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {project.budgetMin.toLocaleString()}~{project.budgetMax.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge color={STATUS_COLORS[project.status]}>
                                            {STATUS_LABELS[project.status]}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">
                                        {new Date(project.createdAt).toLocaleDateString("ko-KR")}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={(e) => handleDelete(e, project.id, project.title)}
                                            disabled={deleteMutation.isPending}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                            title="삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
