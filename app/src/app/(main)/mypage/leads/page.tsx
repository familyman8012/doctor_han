"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, ChevronRight } from "lucide-react";
import { leadsApi } from "@/api-client/leads";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { useIsAuthenticated, useUserRole, useAuthStore } from "@/stores/auth";
import { LeadListCard } from "./components/LeadListCard";
import { LeadStatusFilter } from "./components/LeadStatusFilter";
import { useQueryState } from "nuqs";
import type { LeadStatus } from "@/lib/schema/lead";

export default function MyLeadsPage() {
    const router = useRouter();
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const { isInitialized } = useAuthStore();
    const [statusFilter, setStatusFilter] = useQueryState("status");

    // 리드 목록 조회
    const { data, isLoading } = useQuery({
        queryKey: ["leads", "my", statusFilter],
        queryFn: () => leadsApi.list({ status: statusFilter as LeadStatus | undefined }),
        enabled: isAuthenticated && role === "doctor",
    });

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
                    <h1 className="text-2xl font-bold text-[#0a3b41] flex items-center gap-2">
                        <FileText className="w-6 h-6 text-[#62e3d5]" />
                        내 문의함
                    </h1>
                    <p className="text-gray-500 mt-1">총 {total}건의 문의</p>
                </div>
            </div>

            {/* 상태 필터 */}
            <LeadStatusFilter
                value={statusFilter}
                onChange={(v) => setStatusFilter(v || null)}
            />

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
