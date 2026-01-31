"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Search, FileText, Building2, User, MessageSquare, Shield, Download } from "lucide-react";
import dayjs from "dayjs";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Badge } from "@/components/ui/Badge/Badge";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Modal } from "@/components/Modal";
import Pagination from "@/components/widgets/Pagination/Pagination";
import type { AuditLogView } from "@/lib/schema/audit";

const PAGE_SIZE = 20;

const ACTION_OPTIONS: { value: string; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "profile", label: "프로필" },
    { value: "vendor", label: "업체" },
    { value: "verification", label: "인증" },
    { value: "report", label: "신고" },
    { value: "file", label: "파일" },
];

const TARGET_TYPE_OPTIONS: { value: string; label: string; icon: typeof FileText }[] = [
    { value: "all", label: "전체", icon: FileText },
    { value: "profile", label: "프로필", icon: User },
    { value: "vendor", label: "업체", icon: Building2 },
    { value: "review", label: "리뷰", icon: MessageSquare },
    { value: "verification", label: "인증", icon: Shield },
    { value: "file", label: "파일", icon: Download },
];

const ACTION_LABELS: Record<string, string> = {
    "profile.create": "프로필 생성",
    "profile.update": "프로필 수정",
    "vendor.create": "업체 생성",
    "vendor.update": "업체 수정",
    "doctor_verification.approve": "의사 인증 승인",
    "doctor_verification.reject": "의사 인증 반려",
    "vendor_verification.approve": "업체 인증 승인",
    "vendor_verification.reject": "업체 인증 반려",
    "report.create": "신고 생성",
    "report.review": "신고 심사",
    "report.resolve": "신고 처리",
    "report.dismiss": "신고 기각",
    "file.download": "파일 다운로드",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
    profile: "프로필",
    vendor: "업체",
    review: "리뷰",
    verification: "인증",
    doctor_verification: "의사 인증",
    vendor_verification: "업체 인증",
    verification_file: "파일",
    file: "파일",
};

export default function AdminAuditLogsPage() {
    const [action, setAction] = useQueryState("action", parseAsString.withDefault("all"));
    const [targetType, setTargetType] = useQueryState("type", parseAsString.withDefault("all"));
    const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
    const [startDate, setStartDate] = useQueryState("startDate", parseAsString.withDefault(""));
    const [endDate, setEndDate] = useQueryState("endDate", parseAsString.withDefault(""));
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

    const [searchInput, setSearchInput] = useState(search);
    const [startDateInput, setStartDateInput] = useState(startDate);
    const [endDateInput, setEndDateInput] = useState(endDate);
    const [selectedLog, setSelectedLog] = useState<AuditLogView | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "audit-logs", action, targetType, search, startDate, endDate, page],
        queryFn: () =>
            adminApi.getAuditLogs({
                action: action === "all" ? undefined : action,
                targetType: targetType === "all" ? undefined : targetType,
                actorId: search || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                page,
                pageSize: PAGE_SIZE,
            }),
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setStartDate(startDateInput);
        setEndDate(endDateInput);
        setPage(1);
    };

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    const getActionBadge = (actionValue: string) => {
        const label = ACTION_LABELS[actionValue] ?? actionValue;
        let color: "info" | "success" | "warning" | "error" | "purple" | "teal" = "info";

        if (actionValue.startsWith("profile.")) color = "purple";
        else if (actionValue.startsWith("vendor.")) color = "teal";
        else if (actionValue.includes("verification.")) color = "success";
        else if (actionValue.startsWith("report.")) color = "warning";
        else if (actionValue.startsWith("file.")) color = "info";

        return (
            <Badge color={color} size="xs">
                {label}
            </Badge>
        );
    };

    const getTargetTypeBadge = (type: string) => {
        const label = TARGET_TYPE_LABELS[type] ?? type;
        const colors: Record<string, "purple" | "teal" | "orange" | "info" | "success" | "neutral"> = {
            profile: "purple",
            vendor: "teal",
            review: "orange",
            verification: "success",
            doctor_verification: "success",
            vendor_verification: "success",
            verification_file: "info",
            file: "info",
        };

        return (
            <Badge color={colors[type] ?? "neutral"} size="xs">
                {label}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">감사 로그</h1>
                <p className="text-sm text-gray-500 mt-1">시스템 활동 기록을 조회합니다.</p>
            </div>

            {/* Filter Area */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                {/* Action Filter */}
                <div className="flex gap-2 flex-wrap">
                    {ACTION_OPTIONS.map((opt) => (
                        <Button
                            key={opt.value}
                            variant={action === opt.value ? "listActive" : "list"}
                            size="xs"
                            onClick={() => {
                                setAction(opt.value);
                                setPage(1);
                            }}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>

                {/* Target Type Filter */}
                <div className="flex gap-2 flex-wrap">
                    {TARGET_TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                            <Button
                                key={opt.value}
                                variant={targetType === opt.value ? "listActive" : "list"}
                                size="xs"
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

                {/* Date Range + Search */}
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2 items-center">
                        <Input
                            type="date"
                            placeholder="시작일"
                            value={startDateInput}
                            onChange={(e) => setStartDateInput(e.target.value)}
                            size="xs"
                            className="w-36"
                        />
                        <span className="text-gray-400">~</span>
                        <Input
                            type="date"
                            placeholder="종료일"
                            value={endDateInput}
                            onChange={(e) => setEndDateInput(e.target.value)}
                            size="xs"
                            className="w-36"
                        />
                    </div>
                    <div className="flex-1 max-w-xs">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="행위자 ID로 검색"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-9"
                                size="xs"
                            />
                        </div>
                    </div>
                    <Button type="submit" variant="primary" size="xs">
                        검색
                    </Button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : items.length === 0 ? (
                    <Empty title="검색 결과가 없습니다" description="조건에 맞는 감사 로그가 없습니다." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        일시
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        액션
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        대상유형
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        행위자
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => setSelectedLog(item)}
                                        className="hover:bg-gray-50 cursor-pointer"
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                            {dayjs(item.createdAt).format("YYYY.MM.DD HH:mm:ss")}
                                        </td>
                                        <td className="px-4 py-3">{getActionBadge(item.action)}</td>
                                        <td className="px-4 py-3">{getTargetTypeBadge(item.targetType)}</td>
                                        <td className="px-4 py-3 text-sm text-[#0a3b41]">
                                            <div>
                                                <span className="font-medium">
                                                    {item.actor.displayName ?? "-"}
                                                </span>
                                                {item.actor.email && (
                                                    <span className="text-gray-400 ml-1">
                                                        ({item.actor.email})
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="감사 로그 상세"
                showButtons={false}
                showCloseButton
                className="max-w-lg"
            >
                {selectedLog && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">일시</p>
                            <p className="text-[#0a3b41]">
                                {dayjs(selectedLog.createdAt).format("YYYY.MM.DD HH:mm:ss")}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">액션</p>
                            <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">대상유형</p>
                            <div className="mt-1">{getTargetTypeBadge(selectedLog.targetType)}</div>
                        </div>
                        {selectedLog.targetId && (
                            <div>
                                <p className="text-sm text-gray-500">대상 ID</p>
                                <p className="text-[#0a3b41] font-mono text-sm">{selectedLog.targetId}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-500">행위자</p>
                            <p className="text-[#0a3b41]">
                                {selectedLog.actor.displayName ?? "-"}
                                {selectedLog.actor.email && (
                                    <span className="text-gray-400 ml-1">({selectedLog.actor.email})</span>
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-2">메타데이터</p>
                            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-60 text-[#0a3b41]">
                                {JSON.stringify(selectedLog.metadata, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
