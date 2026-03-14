"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gavel, DollarSign } from "lucide-react";
import { biddingApi } from "@/api-client/bidding";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Badge } from "@/components/ui/Badge/Badge";
import type { BidProjectStatus, BidResponseStatus, BidCommissionStatus } from "@/lib/schema/bidding";

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

const COMMISSION_STATUS_LABELS: Record<BidCommissionStatus, string> = {
    pending: "대기",
    charged: "차감완료",
    refunded: "환불됨",
    waived: "면제",
};

// 상태 전환 가능 목록
const ALLOWED_TRANSITIONS: Partial<Record<BidProjectStatus, BidProjectStatus[]>> = {
    contracted: ["in_progress", "canceled"],
    in_progress: ["completed", "canceled"],
    completed: ["settled"],
};

export default function AdminBidProjectDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["bid-projects", params.id],
        queryFn: () => biddingApi.getDetail(params.id),
        enabled: !!params.id,
    });

    const statusMutation = useMutation({
        mutationFn: (status: BidProjectStatus) => biddingApi.adminUpdateStatus(params.id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bid-projects", params.id] });
        },
    });

    const settleMutation = useMutation({
        mutationFn: () => biddingApi.adminSettle(params.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bid-projects", params.id] });
        },
    });

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

    const nextStatuses = ALLOWED_TRANSITIONS[project.status] ?? [];
    const canSettle =
        project.contract &&
        project.contract.commissionStatus === "pending" &&
        (project.status === "completed" || project.status === "settled");

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push("/admin/bid-projects")}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-primary" />
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
                        <dd className="font-medium">{project.location}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">예산</dt>
                        <dd className="font-medium">
                            {project.budgetMin.toLocaleString()}~{project.budgetMax.toLocaleString()}원
                        </dd>
                    </div>
                    {project.bidDeadline && (
                        <div>
                            <dt className="text-gray-500">입찰 마감</dt>
                            <dd className="font-medium">
                                {new Date(project.bidDeadline).toLocaleDateString("ko-KR")}
                            </dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-gray-500">등록일</dt>
                        <dd className="font-medium">
                            {new Date(project.createdAt).toLocaleDateString("ko-KR")}
                        </dd>
                    </div>
                </dl>
            </div>

            {/* 입찰 응답 목록 */}
            {project.responses.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-content-primary mb-4">
                        입찰 응답 ({project.responses.length}건)
                    </h2>
                    <div className="space-y-3">
                        {project.responses.map((resp) => (
                            <div key={resp.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-content-primary">
                                            {resp.vendorName ?? resp.vendorId.slice(0, 8)}
                                        </p>
                                        <Badge
                                            color={resp.status === "selected" ? "green" : resp.status === "submitted" ? "blue" : "gray"}
                                        >
                                            {RESPONSE_STATUS_LABELS[resp.status]}
                                        </Badge>
                                    </div>
                                    {resp.price != null && (
                                        <p className="font-bold text-content-primary">
                                            {resp.price.toLocaleString()}원
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 계약 정보 */}
            {project.contract && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        계약 / 수수료
                    </h2>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-gray-500">업체</dt>
                            <dd className="font-medium">{project.contract.vendorName ?? "업체"}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">계약 금액</dt>
                            <dd className="font-medium">
                                {project.contract.contractAmount.toLocaleString()}원
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">수수료</dt>
                            <dd className="font-medium">
                                {project.contract.commissionAmount.toLocaleString()}원
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">수수료 상태</dt>
                            <dd>
                                <Badge
                                    color={project.contract.commissionStatus === "charged" ? "green" : "orange"}
                                >
                                    {COMMISSION_STATUS_LABELS[project.contract.commissionStatus]}
                                </Badge>
                            </dd>
                        </div>
                    </dl>
                </div>
            )}

            {/* 상태 변경 이력 */}
            {project.statusHistory.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-content-primary mb-4">상태 변경 이력</h2>
                    <div className="space-y-2">
                        {project.statusHistory.map((h) => (
                            <div key={h.id} className="flex items-center gap-3 text-sm">
                                <span className="text-gray-400 whitespace-nowrap">
                                    {new Date(h.createdAt).toLocaleString("ko-KR")}
                                </span>
                                <span className="text-gray-500">
                                    {h.fromStatus ? STATUS_LABELS[h.fromStatus] : "시작"}
                                </span>
                                <span className="text-gray-400">&rarr;</span>
                                <span className="font-medium text-content-primary">
                                    {STATUS_LABELS[h.toStatus]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 액션 */}
            <div className="flex gap-3 flex-wrap">
                {nextStatuses.map((status) => (
                    <button
                        key={status}
                        onClick={() => {
                            if (confirm(`상태를 "${STATUS_LABELS[status]}"(으)로 변경하시겠습니까?`)) {
                                statusMutation.mutate(status);
                            }
                        }}
                        disabled={statusMutation.isPending}
                        className="px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-900/90 transition-colors disabled:opacity-50"
                    >
                        {STATUS_LABELS[status]}(으)로 변경
                    </button>
                ))}

                {canSettle && (
                    <button
                        onClick={() => {
                            if (confirm("수수료를 정산하시겠습니까?")) {
                                settleMutation.mutate();
                            }
                        }}
                        disabled={settleMutation.isPending}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <DollarSign className="w-4 h-4" />
                        수수료 정산
                    </button>
                )}
            </div>
        </div>
    );
}
