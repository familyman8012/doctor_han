"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { leadsApi } from "@/api-client/leads";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { useIsAuthenticated, useUserRole, useAuthStore } from "@/stores/auth";
import { VendorLeadCard } from "./components/VendorLeadCard";
import { LeadStatusFilter } from "./components/LeadStatusFilter";
import { useQueryState } from "nuqs";
import type { LeadStatus } from "@/lib/schema/lead";

export default function PartnerLeadsPage() {
    const router = useRouter();
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const { isInitialized } = useAuthStore();
    const [statusFilter, setStatusFilter] = useQueryState("status");

    // 리드 목록 조회
    const { data, isLoading } = useQuery({
        queryKey: ["leads", "vendor", statusFilter],
        queryFn: () => leadsApi.list({ status: statusFilter as LeadStatus | undefined }),
        enabled: isAuthenticated && role === "vendor",
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

    if (role !== "vendor") {
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
                        <Inbox className="w-6 h-6 text-[#62e3d5]" />
                        받은 리드함
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
                    title="받은 문의가 없습니다"
                    description={statusFilter ? "해당 상태의 문의가 없습니다" : "아직 받은 문의가 없습니다"}
                />
            ) : (
                <div className="space-y-4">
                    {leads.map((lead) => (
                        <VendorLeadCard
                            key={lead.id}
                            lead={lead}
                            onClick={() => router.push(`/partner/leads/${lead.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
