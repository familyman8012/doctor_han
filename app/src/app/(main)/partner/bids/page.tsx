"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Gavel } from "lucide-react";
import { biddingApi } from "@/api-client/bidding";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Badge } from "@/components/ui/Badge/Badge";
import { useIsAuthenticated, useUserRole, useAuthStore } from "@/stores/auth";
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

export default function PartnerBidsPage() {
    const router = useRouter();
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const { isInitialized } = useAuthStore();
    const [statusFilter, setStatusFilter] = useQueryState("status");

    const { data, isLoading } = useQuery({
        queryKey: ["bid-projects", "vendor", statusFilter],
        queryFn: () => biddingApi.list({ status: statusFilter as BidProjectStatus | undefined }),
        enabled: isAuthenticated && role === "vendor",
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

    if (role !== "vendor") {
        router.replace("/");
        return null;
    }

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                    <Gavel className="w-6 h-6 text-primary" />
                    입찰 관리
                </h1>
                <p className="text-gray-500 mt-1">총 {total}건의 프로젝트</p>
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
                {(["bidding", "contracted", "completed"] as BidProjectStatus[]).map((s) => (
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
                <Empty
                    title="입찰 프로젝트가 없습니다"
                    description="초대된 프로젝트가 있으면 여기에 표시됩니다"
                />
            ) : (
                <div className="space-y-3">
                    {items.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => router.push(`/partner/bids/${project.id}`)}
                            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary transition-colors cursor-pointer"
                        >
                            <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge color={project.status === "bidding" ? "blue" : "gray"}>
                                            {STATUS_LABELS[project.status]}
                                        </Badge>
                                    </div>
                                    <h3 className="font-semibold text-content-primary truncate">
                                        {project.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {project.location} · 예산{" "}
                                        {project.budgetMin.toLocaleString()}~
                                        {project.budgetMax.toLocaleString()}원
                                    </p>
                                </div>
                                {project.bidDeadline && (
                                    <p className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                        마감 {new Date(project.bidDeadline).toLocaleDateString("ko-KR")}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
