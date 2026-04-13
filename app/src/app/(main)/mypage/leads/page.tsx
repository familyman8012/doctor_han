"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search, Hammer, ChevronRight } from "lucide-react";
import Link from "next/link";
import { leadsApi } from "@/api-client/leads";
import { biddingApi } from "@/api-client/bidding";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Input } from "@/components/ui/Input/Input";
import { useIsAuthenticated, useUserRole, useAuthStore } from "@/stores/auth";
import { LeadListCard } from "./components/LeadListCard";
import { LeadStatusFilter } from "./components/LeadStatusFilter";
import { parseAsString, useQueryState } from "nuqs";
import type { LeadStatus } from "@/lib/schema/lead";

export default function MyLeadsPage() {
    const router = useRouter();
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const { isInitialized } = useAuthStore();
    const [statusFilter, setStatusFilter] = useQueryState("status");
    const [searchQuery, setSearchQuery] = useQueryState("q", parseAsString.withDefault(""));
    const [searchText, setSearchText] = useState(searchQuery);

    // 인테리어 프로젝트 수 조회
    const { data: bidData } = useQuery({
        queryKey: ["bid-projects", "doctor", null],
        queryFn: () => biddingApi.list({}),
        enabled: isAuthenticated && role === "doctor",
    });
    const activeBidCount = bidData?.data?.items?.filter(
        (p) => !["completed", "settled", "canceled"].includes(p.status),
    ).length ?? 0;

    // 리드 목록 조회
    const { data, isLoading } = useQuery({
        queryKey: ["leads", "my", statusFilter, searchQuery],
        queryFn: () => leadsApi.list({
            status: statusFilter as LeadStatus | undefined,
            q: searchQuery || undefined,
        }),
        enabled: isAuthenticated && role === "doctor",
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(searchText.trim() || null);
    };

    // 로딩 중
    if (!isInitialized) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    // 권한 체크
    if (!isAuthenticated) {
        router.replace("/login");
        return null;
    }

    if (role !== "doctor") {
        router.replace("/");
        return null;
    }

    const leads = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        내 문의함
                    </h1>
                    <p className="text-gray-500 mt-1">총 {total}건의 문의</p>
                </div>
            </div>

            {/* 인테리어 프로젝트 배너 */}
            {activeBidCount > 0 && (
                <Link
                    href="/interior"
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-primary-25 border border-primary/20 rounded-xl hover:border-primary/40 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Hammer className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-content-primary">인테리어 프로젝트</p>
                            <p className="text-sm text-gray-500">진행 중인 프로젝트 {activeBidCount}건</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
            )}

            {/* 상태 필터 */}
            <LeadStatusFilter
                value={statusFilter}
                onChange={(v) => setStatusFilter(v || null)}
            />

            {/* 검색 */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="서비스명, 업체명으로 검색"
                    size="sm"
                    LeadingIcon={<Search className="w-4 h-4" />}
                />
            </form>

            {/* 리드 목록 */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spinner size="lg" />
                </div>
            ) : leads.length === 0 ? (
                <Empty
                    title="문의 내역이 없습니다"
                    description={statusFilter ? "해당 상태의 문의가 없습니다" : "아직 문의한 업체가 없습니다"}
                />
            ) : (
                <div className="space-y-4">
                    {leads.map((lead) => (
                        <LeadListCard
                            key={lead.id}
                            lead={lead}
                            onClick={() => router.push(`/mypage/leads/${lead.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
