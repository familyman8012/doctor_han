"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Clock, CheckCircle, XCircle, Eye, FileText, Building2, User } from "lucide-react";
import dayjs from "dayjs";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Badge } from "@/components/ui/Badge/Badge";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";
import type { ReportTargetType, ReportStatus, AdminReportListItem } from "@/lib/schema/report";
import { ReportDetailModal } from "./components/ReportDetailModal";
import { SanctionModal } from "./components/SanctionModal";
import { DismissModal } from "./components/DismissModal";

const PAGE_SIZE = 20;

const TARGET_TYPE_OPTIONS: { value: ReportTargetType | "all"; label: string; icon: typeof FileText }[] = [
    { value: "all", label: "전체", icon: FileText },
    { value: "review", label: "리뷰", icon: FileText },
    { value: "vendor", label: "업체", icon: Building2 },
    { value: "profile", label: "사용자", icon: User },
];

const STATUS_OPTIONS: { value: ReportStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "pending", label: "접수" },
    { value: "reviewing", label: "심사중" },
    { value: "resolved", label: "처리완료" },
    { value: "dismissed", label: "기각" },
];

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

export default function AdminReportsPage() {
    const queryClient = useQueryClient();
    const [targetType, setTargetType] = useState<ReportTargetType | "all">("all");
    const [status, setStatus] = useState<ReportStatus | "all">("pending");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [page, setPage] = useState(1);

    // Modal states
    const [detailTarget, setDetailTarget] = useState<AdminReportListItem | null>(null);
    const [sanctionTarget, setSanctionTarget] = useState<AdminReportListItem | null>(null);
    const [dismissTarget, setDismissTarget] = useState<AdminReportListItem | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "reports", targetType, status, search, page],
        queryFn: () =>
            adminApi.getReports({
                targetType: targetType === "all" ? undefined : targetType,
                status: status === "all" ? undefined : status,
                q: search || undefined,
                page,
                pageSize: PAGE_SIZE,
            }),
    });

    const reviewMutation = useMutation({
        mutationFn: (id: string) => adminApi.reviewReport(id),
        onSuccess: () => {
            toast.success("심사가 시작되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const handleStartReview = (id: string) => {
        if (confirm("심사를 시작하시겠습니까?")) {
            reviewMutation.mutate(id);
        }
    };

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    const getStatusBadge = (status: ReportStatus) => {
        switch (status) {
            case "pending":
                return (
                    <Badge color="warning" size="sm">
                        <Clock className="w-3 h-3 mr-1" />
                        접수
                    </Badge>
                );
            case "reviewing":
                return (
                    <Badge color="info" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        심사중
                    </Badge>
                );
            case "resolved":
                return (
                    <Badge color="success" size="sm">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        처리완료
                    </Badge>
                );
            case "dismissed":
                return (
                    <Badge color="neutral" size="sm">
                        <XCircle className="w-3 h-3 mr-1" />
                        기각
                    </Badge>
                );
        }
    };

    const getTargetTypeBadge = (type: ReportTargetType) => {
        const colors: Record<ReportTargetType, "purple" | "teal" | "orange"> = {
            review: "purple",
            vendor: "teal",
            profile: "orange",
        };
        return (
            <Badge color={colors[type]} size="xs">
                {TARGET_TYPE_LABELS[type]}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">신고 관리</h1>
                <p className="text-sm text-gray-500 mt-1">신고 접수 건을 검토하고 제재를 부과합니다.</p>
            </div>

            {/* Filter Area */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                {/* Target Type Tabs */}
                <div className="flex gap-2">
                    {TARGET_TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                            <Button
                                key={opt.value}
                                variant={targetType === opt.value ? "listActive" : "list"}
                                size="sm"
                                onClick={() => {
                                    setTargetType(opt.value);
                                    setPage(1);
                                }}
                                LeadingIcon={<Icon />}
                            >
                                {opt.label}
                            </Button>
                        );
                    })}
                </div>

                {/* Status Filter + Search */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((opt) => (
                            <Button
                                key={opt.value}
                                variant={status === opt.value ? "listActive" : "list"}
                                size="xs"
                                onClick={() => {
                                    setStatus(opt.value);
                                    setPage(1);
                                }}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                    <form onSubmit={handleSearch} className="flex-1 max-w-xs">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="신고자 이름, 이메일로 검색"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </form>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : items.length === 0 ? (
                    <Empty title="신고 내역이 없습니다" description="조건에 맞는 신고가 없습니다." />
                ) : (
                    <div className="divide-y divide-gray-100">
                        {items.map((item) => {
                            const isPending = item.status === "pending";
                            const isReviewing = item.status === "reviewing";
                            const canProcess = isPending || isReviewing;

                            return (
                                <div
                                    key={item.id}
                                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => setDetailTarget(item)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getStatusBadge(item.status)}
                                                {getTargetTypeBadge(item.targetType)}
                                                <span className="text-xs text-gray-400">
                                                    {dayjs(item.createdAt).format("YYYY.MM.DD HH:mm")}
                                                </span>
                                            </div>
                                            <p className="font-medium text-[#0a3b41] truncate">
                                                {item.targetSummary}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                신고자: {item.reporterUser.displayName} ({item.reporterUser.email ?? "-"}) |
                                                사유: {REASON_LABELS[item.reason] ?? item.reason}
                                            </p>
                                        </div>
                                        {canProcess && (
                                            <div
                                                className="flex gap-2 shrink-0"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {isPending && (
                                                    <Button
                                                        variant="secondary"
                                                        size="xs"
                                                        onClick={() => handleStartReview(item.id)}
                                                        isLoading={reviewMutation.isPending}
                                                        LeadingIcon={<Eye />}
                                                    >
                                                        심사 시작
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="primary"
                                                    size="xs"
                                                    onClick={() => setSanctionTarget(item)}
                                                    LeadingIcon={<CheckCircle />}
                                                >
                                                    제재
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="xs"
                                                    onClick={() => setDismissTarget(item)}
                                                    LeadingIcon={<XCircle />}
                                                >
                                                    기각
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {total > PAGE_SIZE && (
                    <div className="border-t border-gray-100 py-4">
                        <Pagination
                            pageInfo={[page, PAGE_SIZE]}
                            totalCount={total}
                            handlePageChange={setPage}
                        />
                    </div>
                )}
            </div>

            {/* Report Detail Modal */}
            {detailTarget && (
                <ReportDetailModal
                    isOpen={!!detailTarget}
                    onClose={() => setDetailTarget(null)}
                    reportId={detailTarget.id}
                    onSanction={() => {
                        setSanctionTarget(detailTarget);
                        setDetailTarget(null);
                    }}
                    onDismiss={() => {
                        setDismissTarget(detailTarget);
                        setDetailTarget(null);
                    }}
                />
            )}

            {/* Sanction Modal */}
            {sanctionTarget && (
                <SanctionModal
                    isOpen={!!sanctionTarget}
                    onClose={() => setSanctionTarget(null)}
                    reportId={sanctionTarget.id}
                />
            )}

            {/* Dismiss Modal */}
            {dismissTarget && (
                <DismissModal
                    isOpen={!!dismissTarget}
                    onClose={() => setDismissTarget(null)}
                    reportId={dismissTarget.id}
                />
            )}
        </div>
    );
}
