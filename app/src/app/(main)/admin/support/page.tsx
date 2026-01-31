"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import Link from "next/link";
import dayjs from "dayjs";
import { Search, MessageCircle, ChevronRight } from "lucide-react";
import { adminApi } from "@/api-client/admin";
import { helpCenterApi } from "@/api-client/help-center";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";
import type { SupportTicketStatus, SlaStatus } from "@/lib/schema/support";
import { TicketStatusBadge } from "@/app/(main)/mypage/support/components/TicketStatusBadge";
import { SlaStatusBadge } from "./components/SlaStatusBadge";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: SupportTicketStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "open", label: "접수" },
    { value: "in_progress", label: "처리중" },
    { value: "resolved", label: "해결" },
    { value: "closed", label: "종료" },
];

const SLA_OPTIONS: { value: SlaStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "normal", label: "정상" },
    { value: "warning", label: "임박" },
    { value: "violated", label: "위반" },
];

export default function AdminSupportPage() {
    const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
    const [categoryId, setCategoryId] = useQueryState("category", parseAsString.withDefault("all"));
    const [slaStatus, setSlaStatus] = useQueryState("sla", parseAsString.withDefault("all"));
    const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
    const [searchInput, setSearchInput] = useState(search);
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

    // FAQ 카테고리 조회
    const { data: categoriesData } = useQuery({
        queryKey: ["help", "categories"],
        queryFn: () => helpCenterApi.getPublicCategories(),
    });

    // 티켓 목록 조회
    const { data, isLoading } = useQuery({
        queryKey: ["admin", "support", "tickets", status, categoryId, slaStatus, search, page],
        queryFn: () =>
            adminApi.getSupportTickets({
                status: status === "all" ? undefined : (status as SupportTicketStatus),
                categoryId: categoryId === "all" ? undefined : categoryId,
                slaStatus: slaStatus === "all" ? undefined : (slaStatus as SlaStatus),
                q: search || undefined,
                page,
                pageSize: PAGE_SIZE,
            }),
    });

    const categories = categoriesData?.data?.items ?? [];
    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">고객지원</h1>
                <p className="text-sm text-gray-500 mt-1">고객 문의를 관리하고 응답하세요.</p>
            </div>

            {/* Filter Area */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                {/* Status Filter */}
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

                {/* Category + SLA + Search */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Category Filter */}
                    <select
                        value={categoryId}
                        onChange={(e) => {
                            setCategoryId(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62e3d5]"
                    >
                        <option value="all">전체 카테고리</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>

                    {/* SLA Filter */}
                    <div className="flex gap-2">
                        {SLA_OPTIONS.map((opt) => (
                            <Button
                                key={opt.value}
                                variant={slaStatus === opt.value ? "listActive" : "list"}
                                size="xs"
                                onClick={() => {
                                    setSlaStatus(opt.value);
                                    setPage(1);
                                }}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-xs">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="제목, 사용자 이름으로 검색"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </form>
                </div>
            </div>

            {/* Ticket List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : items.length === 0 ? (
                    <Empty
                        Icon={<MessageCircle className="w-12 h-12 text-gray-300" />}
                        title="문의 내역이 없습니다"
                        description="조건에 맞는 문의가 없습니다."
                    />
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {items.map((ticket) => (
                            <li key={ticket.id}>
                                <Link
                                    href={`/admin/support/${ticket.id}`}
                                    className="flex items-start justify-between gap-4 p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <TicketStatusBadge status={ticket.status} size="xs" />
                                            <SlaStatusBadge status={ticket.slaStatus} />
                                            {ticket.category && (
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    {ticket.category.name}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                {dayjs(ticket.createdAt).format("YYYY.MM.DD HH:mm")}
                                            </span>
                                        </div>
                                        <p className="font-medium text-[#0a3b41] truncate">{ticket.title}</p>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {ticket.user.displayName}
                                            {ticket.user.email && ` (${ticket.user.email})`}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Pagination */}
                {total > PAGE_SIZE && (
                    <div className="border-t border-gray-100 py-4">
                        <Pagination pageInfo={[page, PAGE_SIZE]} totalCount={total} handlePageChange={setPage} />
                    </div>
                )}
            </div>
        </div>
    );
}
