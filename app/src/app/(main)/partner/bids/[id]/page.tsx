"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gavel, Send, XCircle } from "lucide-react";
import { biddingApi } from "@/api-client/bidding";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Badge } from "@/components/ui/Badge/Badge";
import { useIsAuthenticated, useUserRole, useAuthStore } from "@/stores/auth";
import type { BidProjectStatus, BidResponseStatus, BidResponseSubmitBody } from "@/lib/schema/bidding";

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

export default function PartnerBidDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const { isInitialized } = useAuthStore();

    const [bidForm, setBidForm] = useState<BidResponseSubmitBody>({
        price: 0,
        proposal: "",
    });

    const { data, isLoading } = useQuery({
        queryKey: ["bid-projects", params.id],
        queryFn: () => biddingApi.getDetail(params.id),
        enabled: isAuthenticated && !!params.id,
    });

    const submitMutation = useMutation({
        mutationFn: (payload: BidResponseSubmitBody) =>
            biddingApi.submitResponse(params.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bid-projects", params.id] });
        },
    });

    const withdrawMutation = useMutation({
        mutationFn: () => biddingApi.withdrawResponse(params.id),
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

    if (!isAuthenticated || role !== "vendor") {
        router.replace("/");
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

    // 현재 vendor의 응답 찾기 (responses에서 본인 것)
    const myResponse = project.responses[0] ?? null; // vendor는 자기 응답만 보임 (RLS)
    const canSubmit = myResponse?.status === "invited" && project.status === "bidding";
    const canWithdraw = !!myResponse && (myResponse.status === "invited" || myResponse.status === "submitted");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitMutation.mutate(bidForm);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push("/partner/bids")}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <Gavel className="w-6 h-6 text-primary" />
                        {project.title}
                    </h1>
                </div>
                <Badge color={project.status === "bidding" ? "blue" : "gray"}>
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

            {/* 내 입찰 상태 */}
            {myResponse && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-content-primary mb-4">내 입찰 현황</h2>
                    <div className="flex items-center gap-3 mb-4">
                        <Badge
                            color={
                                myResponse.status === "selected"
                                    ? "green"
                                    : myResponse.status === "submitted"
                                      ? "blue"
                                      : myResponse.status === "rejected"
                                        ? "red"
                                        : "gray"
                            }
                        >
                            {RESPONSE_STATUS_LABELS[myResponse.status]}
                        </Badge>
                        {myResponse.price != null && myResponse.status === "submitted" && (
                            <span className="text-lg font-bold text-content-primary">
                                {myResponse.price.toLocaleString()}원
                            </span>
                        )}
                    </div>
                    {myResponse.proposal && (
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {myResponse.proposal}
                        </p>
                    )}
                </div>
            )}

            {/* 입찰 제출 폼 */}
            {canSubmit && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-content-primary">입찰 제출</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            견적 금액 (원) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={bidForm.price || ""}
                            onChange={(e) =>
                                setBidForm((prev) => ({ ...prev, price: Number(e.target.value) }))
                            }
                            placeholder="견적 금액을 입력하세요"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            min={0}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            제안서 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={bidForm.proposal}
                            onChange={(e) =>
                                setBidForm((prev) => ({ ...prev, proposal: e.target.value }))
                            }
                            placeholder="프로젝트에 대한 제안 내용을 작성해주세요"
                            rows={6}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            예상 소요일
                        </label>
                        <input
                            type="number"
                            value={bidForm.estimatedDays ?? ""}
                            onChange={(e) =>
                                setBidForm((prev) => ({
                                    ...prev,
                                    estimatedDays: e.target.value ? Number(e.target.value) : undefined,
                                }))
                            }
                            placeholder="예: 30"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            min={1}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitMutation.isPending}
                        className="w-full py-3 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-900/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {submitMutation.isPending ? "제출 중..." : "입찰 제출"}
                    </button>

                    {submitMutation.isError && (
                        <p className="text-sm text-red-500 text-center">
                            입찰 제출에 실패했습니다. 다시 시도해주세요.
                        </p>
                    )}
                </form>
            )}

            {/* 철회 */}
            {canWithdraw && (
                <div className="flex justify-end">
                    <button
                        onClick={() => {
                            if (confirm("입찰을 철회하시겠습니까?")) {
                                withdrawMutation.mutate();
                            }
                        }}
                        disabled={withdrawMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                        <XCircle className="w-4 h-4" />
                        입찰 철회
                    </button>
                </div>
            )}
        </div>
    );
}
