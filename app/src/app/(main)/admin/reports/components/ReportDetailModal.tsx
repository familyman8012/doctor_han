"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Clock, Eye, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/button";
import { Badge } from "@/components/ui/Badge/Badge";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import type { ReportTargetType, ReportStatus } from "@/lib/schema/report";
import { SanctionHistoryPanel } from "./SanctionHistoryPanel";

interface ReportDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportId: string;
    onSanction: () => void;
    onDismiss: () => void;
}

const REASON_LABELS: Record<string, string> = {
    spam: "스팸/광고",
    inappropriate: "부적절한 내용",
    false_info: "허위 정보",
    privacy: "개인정보 노출",
    other: "기타",
};

const TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
    review: "리뷰",
    vendor: "업체",
    profile: "사용자",
};

export function ReportDetailModal({ isOpen, onClose, reportId, onSanction, onDismiss }: ReportDetailModalProps) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "report", reportId],
        queryFn: () => adminApi.getReport(reportId),
        enabled: isOpen,
    });

    const reviewMutation = useMutation({
        mutationFn: () => adminApi.reviewReport(reportId),
        onSuccess: () => {
            toast.success("심사가 시작되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "report", reportId] });
        },
    });

    const handleStartReview = () => {
        if (confirm("심사를 시작하시겠습니까?")) {
            reviewMutation.mutate();
        }
    };

    if (!isOpen) return null;

    const report = data?.data?.report;
    const targetReportCount = data?.data?.targetReportCount ?? 0;
    const sanctions = data?.data?.sanctions ?? [];

    const getStatusBadge = (status: ReportStatus) => {
        switch (status) {
            case "pending":
                return (
                    <Badge color="warning">
                        <Clock className="w-3 h-3 mr-1" />
                        접수
                    </Badge>
                );
            case "reviewing":
                return (
                    <Badge color="info">
                        <Eye className="w-3 h-3 mr-1" />
                        심사중
                    </Badge>
                );
            case "resolved":
                return (
                    <Badge color="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        처리완료
                    </Badge>
                );
            case "dismissed":
                return (
                    <Badge color="neutral">
                        <XCircle className="w-3 h-3 mr-1" />
                        기각
                    </Badge>
                );
        }
    };

    const isPending = report?.status === "pending";
    const isReviewing = report?.status === "reviewing";
    const canProcess = isPending || isReviewing;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                    <h2 className="text-lg font-semibold text-[#0a3b41]">신고 상세</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Spinner size="lg" />
                        </div>
                    ) : report ? (
                        <div className="space-y-5">
                            {/* Status & Date */}
                            <div className="flex items-center gap-3">
                                {getStatusBadge(report.status)}
                                <span className="text-sm text-gray-500">
                                    신고일: {dayjs(report.createdAt).format("YYYY.MM.DD HH:mm")}
                                </span>
                            </div>

                            {/* Target Report Count Warning */}
                            {targetReportCount >= 3 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                    <p className="text-sm text-amber-700">
                                        이 대상에 대한 누적 신고 <strong>{targetReportCount}건</strong>이 접수되었습니다.
                                    </p>
                                </div>
                            )}

                            {/* Report Target Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">신고 대상</h3>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex">
                                        <dt className="w-24 text-gray-500">유형</dt>
                                        <dd className="text-[#0a3b41]">{TARGET_TYPE_LABELS[report.targetType]}</dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-24 text-gray-500">대상 정보</dt>
                                        <dd className="text-[#0a3b41]">{report.targetSummary}</dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-24 text-gray-500">누적 신고</dt>
                                        <dd className="text-[#0a3b41]">{targetReportCount}건</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Reporter Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">신고자 정보</h3>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex">
                                        <dt className="w-24 text-gray-500">이름</dt>
                                        <dd className="text-[#0a3b41]">{report.reporterUser.displayName}</dd>
                                    </div>
                                    <div className="flex">
                                        <dt className="w-24 text-gray-500">이메일</dt>
                                        <dd className="text-[#0a3b41]">{report.reporterUser.email ?? "-"}</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Report Content */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">신고 내용</h3>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex">
                                        <dt className="w-24 text-gray-500">신고 사유</dt>
                                        <dd className="text-[#0a3b41]">{REASON_LABELS[report.reason] ?? report.reason}</dd>
                                    </div>
                                    {report.detail && (
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">상세 내용</dt>
                                            <dd className="text-[#0a3b41] whitespace-pre-wrap">{report.detail}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            {/* Review Info (if reviewed) */}
                            {report.reviewedBy && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h3 className="text-sm font-medium text-blue-700 mb-3">심사 정보</h3>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">담당자</dt>
                                            <dd className="text-blue-700">{report.reviewedBy.displayName}</dd>
                                        </div>
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">심사 시작</dt>
                                            <dd className="text-blue-700">
                                                {report.reviewedAt && dayjs(report.reviewedAt).format("YYYY.MM.DD HH:mm")}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            )}

                            {/* Resolution Info (if resolved/dismissed) */}
                            {report.resolvedBy && (
                                <div className={`rounded-lg p-4 ${report.status === "resolved" ? "bg-green-50" : "bg-gray-50"}`}>
                                    <h3 className={`text-sm font-medium mb-3 ${report.status === "resolved" ? "text-green-700" : "text-gray-700"}`}>
                                        {report.status === "resolved" ? "처리 결과" : "기각 정보"}
                                    </h3>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">처리자</dt>
                                            <dd className={report.status === "resolved" ? "text-green-700" : "text-gray-700"}>
                                                {report.resolvedBy.displayName}
                                            </dd>
                                        </div>
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">처리일</dt>
                                            <dd className={report.status === "resolved" ? "text-green-700" : "text-gray-700"}>
                                                {report.resolvedAt && dayjs(report.resolvedAt).format("YYYY.MM.DD HH:mm")}
                                            </dd>
                                        </div>
                                        {report.resolutionNote && (
                                            <div className="flex">
                                                <dt className="w-24 text-gray-500">처리 사유</dt>
                                                <dd className={`whitespace-pre-wrap ${report.status === "resolved" ? "text-green-700" : "text-gray-700"}`}>
                                                    {report.resolutionNote}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            )}

                            {/* Sanction History */}
                            {sanctions.length > 0 && (
                                <SanctionHistoryPanel sanctions={sanctions} />
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            신고 정보를 불러올 수 없습니다.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
                    {canProcess && (
                        <>
                            {isPending && (
                                <Button
                                    variant="secondary"
                                    onClick={handleStartReview}
                                    isLoading={reviewMutation.isPending}
                                    LeadingIcon={<Eye />}
                                >
                                    심사 시작
                                </Button>
                            )}
                            <Button variant="danger" onClick={onDismiss} LeadingIcon={<XCircle />}>
                                기각
                            </Button>
                            <Button variant="primary" onClick={onSanction} LeadingIcon={<CheckCircle />}>
                                제재 부과
                            </Button>
                        </>
                    )}
                    <Button variant="secondary" onClick={onClose}>
                        닫기
                    </Button>
                </div>
            </div>
        </div>
    );
}
