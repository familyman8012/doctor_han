"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Hammer, Star, Clock, CheckCircle, XCircle } from "lucide-react";
import { biddingApi } from "@/api-client/bidding";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Badge } from "@/components/ui/Badge/Badge";
import { useIsAuthenticated, useAuthStore } from "@/stores/auth";
import type { BidProjectStatus, BidResponseStatus } from "@/lib/schema/bidding";

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

const RESPONSE_STATUS_LABELS: Record<BidResponseStatus, string> = {
    invited: "초대됨",
    submitted: "입찰완료",
    selected: "선정됨",
    rejected: "미선정",
    withdrawn: "철회",
    expired: "만료",
};

export default function InteriorDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const isAuthenticated = useIsAuthenticated();
    const { isInitialized } = useAuthStore();

    const { data, isLoading } = useQuery({
        queryKey: ["bid-projects", params.id],
        queryFn: () => biddingApi.getDetail(params.id),
        enabled: isAuthenticated && !!params.id,
    });

    const selectMutation = useMutation({
        mutationFn: (vendorId: string) => biddingApi.selectVendor(params.id, vendorId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bid-projects", params.id] });
        },
    });

    const cancelMutation = useMutation({
        mutationFn: () => biddingApi.cancel(params.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bid-projects", params.id] });
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

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <Spinner size="lg" />
            </div>
        );
    }

    const project = data?.data?.project;
    if (!project) {
        return (
            <div className="text-center py-10 text-gray-500">
                프로젝트를 찾을 수 없습니다.
            </div>
        );
    }

    const canSelectVendor = project.status === "bidding" || project.status === "selecting";
    const canCancel = ["draft", "open", "bidding", "selecting"].includes(project.status);
    const submittedResponses = project.responses.filter((r) => r.status === "submitted");

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push("/interior")}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <Hammer className="w-6 h-6 text-primary" />
                        {project.title}
                    </h1>
                </div>
                <Badge color={project.status === "canceled" ? "red" : "blue"}>
                    {STATUS_LABELS[project.status]}
                </Badge>
            </div>

            {/* 프로젝트 정보 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-content-primary mb-4">프로젝트 정보</h2>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt className="text-gray-500">위치</dt>
                        <dd className="font-medium text-content-primary">{project.location}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">예산</dt>
                        <dd className="font-medium text-content-primary">
                            {project.budgetMin.toLocaleString()}~{project.budgetMax.toLocaleString()}원
                        </dd>
                    </div>
                    {project.spaceSize && (
                        <div>
                            <dt className="text-gray-500">공간 크기</dt>
                            <dd className="font-medium text-content-primary">{project.spaceSize}</dd>
                        </div>
                    )}
                    {project.schedule && (
                        <div>
                            <dt className="text-gray-500">희망 일정</dt>
                            <dd className="font-medium text-content-primary">{project.schedule}</dd>
                        </div>
                    )}
                    {project.bidDeadline && (
                        <div>
                            <dt className="text-gray-500">입찰 마감</dt>
                            <dd className="font-medium text-content-primary">
                                {new Date(project.bidDeadline).toLocaleDateString("ko-KR")}
                            </dd>
                        </div>
                    )}
                </dl>
                {project.requirements && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">요구사항</p>
                        <p className="text-sm text-content-primary whitespace-pre-wrap">
                            {project.requirements}
                        </p>
                    </div>
                )}
            </div>

            {/* 추천 업체 스코어 */}
            {project.scores.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-primary" />
                        추천 업체
                    </h2>
                    <div className="space-y-3">
                        {project.scores
                            .filter((s) => s.isRecommended)
                            .map((score, idx) => (
                                <div
                                    key={score.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-content-primary">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-content-primary">
                                                {score.vendorName ?? "업체"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                종합점수 {(score.totalScore * 100).toFixed(1)}점
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 space-x-2">
                                        <span>지역 {(score.regionScore * 100).toFixed(0)}</span>
                                        <span>평점 {(score.ratingScore * 100).toFixed(0)}</span>
                                        <span>응답 {(score.responseScore * 100).toFixed(0)}</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* 입찰 현황 */}
            {project.responses.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        입찰 현황 ({submittedResponses.length}/{project.responses.length})
                    </h2>
                    <div className="space-y-3">
                        {project.responses.map((resp) => (
                            <div
                                key={resp.id}
                                className="p-4 border border-gray-100 rounded-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-content-primary">
                                            {resp.vendorName ?? "업체"}
                                        </p>
                                        <Badge
                                            color={resp.status === "submitted" ? "blue" : resp.status === "selected" ? "green" : "gray"}
                                        >
                                            {RESPONSE_STATUS_LABELS[resp.status]}
                                        </Badge>
                                    </div>
                                    {resp.status === "submitted" && resp.price != null && (
                                        <p className="text-lg font-bold text-content-primary">
                                            {resp.price.toLocaleString()}원
                                        </p>
                                    )}
                                </div>
                                {resp.proposal && (
                                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                                        {resp.proposal}
                                    </p>
                                )}
                                {resp.estimatedDays && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        예상 소요: {resp.estimatedDays}일
                                    </p>
                                )}
                                {canSelectVendor && resp.status === "submitted" && (
                                    <button
                                        onClick={() => selectMutation.mutate(resp.vendorId)}
                                        disabled={selectMutation.isPending}
                                        className="mt-3 px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-900/90 transition-colors disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-4 h-4 inline mr-1" />
                                        이 업체 선정
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 계약 정보 */}
            {project.contract && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        계약 정보
                    </h2>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-gray-500">업체</dt>
                            <dd className="font-medium text-content-primary">
                                {project.contract.vendorName ?? "업체"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">계약 금액</dt>
                            <dd className="font-medium text-content-primary">
                                {project.contract.contractAmount.toLocaleString()}원
                            </dd>
                        </div>
                    </dl>
                </div>
            )}

            {/* 액션 */}
            {canCancel && (
                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            if (confirm("프로젝트를 취소하시겠습니까?")) {
                                cancelMutation.mutate();
                            }
                        }}
                        disabled={cancelMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                        <XCircle className="w-4 h-4" />
                        프로젝트 취소
                    </button>
                </div>
            )}
        </div>
    );
}
