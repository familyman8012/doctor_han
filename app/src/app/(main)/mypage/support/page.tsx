"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import Link from "next/link";
import { Plus, MessageCircle } from "lucide-react";
import { supportApi } from "@/api-client/support";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";
import type { SupportTicketStatus } from "@/lib/schema/support";
import { TicketListItem } from "./components/TicketListItem";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: SupportTicketStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "open", label: "접수" },
    { value: "in_progress", label: "처리중" },
    { value: "resolved", label: "해결" },
    { value: "closed", label: "종료" },
];

export default function MypageSupportPage() {
    const [status, setStatus] = useQueryState("status", parseAsString.withDefault("all"));
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

    const { data, isLoading } = useQuery({
        queryKey: ["support", "tickets", status, page],
        queryFn: () =>
            supportApi.list({
                status: status === "all" ? undefined : (status as SupportTicketStatus),
                page,
                pageSize: PAGE_SIZE,
            }),
    });

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[#0a3b41]">고객지원</h1>
                    <p className="text-sm text-gray-500 mt-1">문의 내역을 확인하고 새 문의를 등록하세요.</p>
                </div>
                <Link href="/mypage/support/new">
                    <Button size="sm" LeadingIcon={<Plus />}>
                        새 문의
                    </Button>
                </Link>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
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
                        description="새 문의를 등록해보세요."
                    />
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {items.map((ticket) => (
                            <li key={ticket.id}>
                                <TicketListItem ticket={ticket} basePath="/mypage/support" />
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
