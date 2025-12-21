"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, CheckCircle, XCircle, Clock, FileText, Building2 } from "lucide-react";
import dayjs from "dayjs";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { Badge } from "@/components/ui/Badge/Badge";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";
import type { AdminVerificationType, AdminDoctorVerificationListItem, AdminVendorVerificationListItem } from "@/lib/schema/admin";
import type { VerificationStatus } from "@/lib/schema/verification";
import { RejectModal } from "./components/RejectModal";
import { VerificationDetailModal } from "./components/DetailModal";

const PAGE_SIZE = 10;

const TYPE_OPTIONS: { value: AdminVerificationType; label: string; icon: typeof FileText }[] = [
    { value: "doctor", label: "한의사", icon: FileText },
    { value: "vendor", label: "업체", icon: Building2 },
];

const STATUS_OPTIONS: { value: VerificationStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "pending", label: "대기중" },
    { value: "approved", label: "승인됨" },
    { value: "rejected", label: "반려됨" },
];

type VerificationListItem = AdminDoctorVerificationListItem | AdminVendorVerificationListItem;

export default function AdminVerificationsPage() {
    const queryClient = useQueryClient();
    const [type, setType] = useState<AdminVerificationType>("doctor");
    const [status, setStatus] = useState<VerificationStatus | "all">("pending");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    // 모달 상태
    const [rejectTarget, setRejectTarget] = useState<{ id: string; type: AdminVerificationType } | null>(null);
    const [detailTarget, setDetailTarget] = useState<VerificationListItem | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "verifications", type, status, search, page],
        queryFn: () =>
            adminApi.getVerifications({
                type,
                status: status === "all" ? undefined : status,
                q: search || undefined,
                page,
                pageSize: PAGE_SIZE,
            }),
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, type }: { id: string; type: AdminVerificationType }) =>
            adminApi.approveVerification(id, { type }),
        onSuccess: () => {
            toast.success("승인되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin", "verifications"] });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, type, reason }: { id: string; type: AdminVerificationType; reason: string }) =>
            adminApi.rejectVerification(id, { type, reason }),
        onSuccess: () => {
            toast.success("반려되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin", "verifications"] });
            setRejectTarget(null);
        },
    });

    const handleApprove = (id: string) => {
        if (confirm("승인하시겠습니까?")) {
            approveMutation.mutate({ id, type });
        }
    };

    const handleReject = (reason: string) => {
        if (!rejectTarget) return;
        rejectMutation.mutate({ id: rejectTarget.id, type: rejectTarget.type, reason });
    };

    const items = (data?.data?.items ?? []) as VerificationListItem[];
    const total = data?.data?.total ?? 0;

    const searchPlaceholder =
        type === "doctor"
            ? "면허번호, 이름, 병원명으로 검색"
            : "회사명, 사업자번호, 담당자, 연락처, 이메일로 검색";

    const getStatusBadge = (status: VerificationStatus) => {
        switch (status) {
            case "pending":
                return (
                    <Badge color="warning" size="sm">
                        <Clock className="w-3 h-3 mr-1" />
                        대기중
                    </Badge>
                );
            case "approved":
                return (
                    <Badge color="success" size="sm">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        승인됨
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge color="error" size="sm">
                        <XCircle className="w-3 h-3 mr-1" />
                        반려됨
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">인증 승인 관리</h1>
                <p className="text-sm text-gray-500 mt-1">한의사 및 업체 인증 요청을 검토하고 승인/반려합니다.</p>
            </div>

            {/* 필터 영역 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                {/* 유형 탭 */}
                <div className="flex gap-2">
                    {TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                            <Button
                                key={opt.value}
                                variant={type === opt.value ? "listActive" : "list"}
                                size="sm"
                                onClick={() => {
                                    setType(opt.value);
                                    setPage(1);
                                }}
                                LeadingIcon={<Icon />}
                            >
                                {opt.label}
                            </Button>
                        );
                    })}
                </div>

                {/* 상태 필터 + 검색 */}
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
                    <div className="flex-1 max-w-xs">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 목록 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : items.length === 0 ? (
                    <Empty title="인증 요청이 없습니다" description="조건에 맞는 인증 요청이 없습니다." />
                ) : (
                    <div className="divide-y divide-gray-100">
                        {items.map((item) => {
                            const verification = item.verification;
                            const user = item.user;
                            const isPending = verification.status === "pending";

                            return (
                                <div
                                    key={verification.id}
                                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => setDetailTarget(item)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getStatusBadge(verification.status)}
                                                <span className="text-xs text-gray-400">
                                                    {dayjs(verification.createdAt).format("YYYY.MM.DD HH:mm")}
                                                </span>
                                            </div>
                                            <p className="font-medium text-[#0a3b41] truncate">
                                                {user.displayName ?? user.email ?? "이름 없음"}
                                            </p>
                                            {type === "doctor" && "licenseNo" in verification && (
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    면허번호: {verification.licenseNo} /{" "}
                                                    {verification.clinicName ?? "-"}
                                                </p>
                                            )}
                                            {type === "vendor" && "companyName" in verification && (
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {verification.companyName} / 사업자번호:{" "}
                                                    {verification.businessNo}
                                                </p>
                                            )}
                                            {verification.status === "rejected" && verification.rejectReason && (
                                                <p className="text-sm text-red-500 mt-1">
                                                    반려 사유: {verification.rejectReason}
                                                </p>
                                            )}
                                        </div>
                                        {isPending && (
                                            <div
                                                className="flex gap-2 shrink-0"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button
                                                    variant="primary"
                                                    size="xs"
                                                    onClick={() => handleApprove(verification.id)}
                                                    isLoading={approveMutation.isPending}
                                                    LeadingIcon={<CheckCircle />}
                                                >
                                                    승인
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="xs"
                                                    onClick={() => setRejectTarget({ id: verification.id, type })}
                                                    LeadingIcon={<XCircle />}
                                                >
                                                    반려
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 페이지네이션 */}
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

            {/* 반려 모달 */}
            {rejectTarget && (
                <RejectModal
                    isOpen={!!rejectTarget}
                    onClose={() => setRejectTarget(null)}
                    onSubmit={handleReject}
                    isLoading={rejectMutation.isPending}
                />
            )}

            {/* 상세 모달 */}
            {detailTarget && (
                <VerificationDetailModal
                    isOpen={!!detailTarget}
                    onClose={() => setDetailTarget(null)}
                    item={detailTarget}
                />
            )}
        </div>
    );
}
