"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { useIsAuthenticated, useUser, useUserRole } from "@/stores/auth";
import { VendorHeader } from "./components/VendorHeader";
import { VendorInfo } from "./components/VendorInfo";
import { PortfolioSection } from "./components/PortfolioSection";
import { ReviewSection } from "./components/ReviewSection";
import type { VendorDetail } from "@/lib/schema/vendor";

export default function VendorDetailPage() {
    const params = useParams();
    const vendorId = params.id as string;

    const user = useUser();
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const canFetchFavorites = isAuthenticated && role === "doctor";

    // 업체 상세 조회
    const { data: vendorData, isLoading, isError } = useQuery({
        queryKey: ["vendor", vendorId],
        queryFn: async () => {
            const response = await api.get<{ data: { vendor: VendorDetail } }>(
                `/api/vendors/${vendorId}`
            );
            return response.data.data;
        },
    });

    // 찜 목록 조회
    const { data: favorites = [] } = useQuery({
        queryKey: ["favorites", "ids"],
        queryFn: async (): Promise<string[]> => {
            const response = await api.get<{ data: { items: { vendor: { id: string } | null }[] } }>("/api/favorites");
            return (response.data.data.items ?? [])
                .map((item) => item.vendor?.id)
                .filter((id): id is string => Boolean(id));
        },
        staleTime: 60 * 1000,
        enabled: canFetchFavorites,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isError || !vendorData?.vendor) {
        return (
            <div className="py-20">
                <Empty
                    title="업체를 찾을 수 없습니다"
                    description="요청하신 업체 정보가 존재하지 않습니다"
                />
            </div>
        );
    }

    const vendor = vendorData.vendor;
    const isFavorited = favorites.includes(vendor.id);

    return (
        <div className="space-y-6">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/categories" className="hover:text-[#0a3b41]">
                    전체 카테고리
                </Link>
                {vendor.categories[0] && (
                    <>
                        <ChevronRight className="w-4 h-4" />
                        <Link
                            href={`/categories/${vendor.categories[0].slug}`}
                            className="hover:text-[#0a3b41]"
                        >
                            {vendor.categories[0].name}
                        </Link>
                    </>
                )}
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#0a3b41] font-medium truncate max-w-[200px]">
                    {vendor.name}
                </span>
            </nav>

            {/* 헤더 */}
            <VendorHeader vendor={vendor} isFavorited={isFavorited} />

            {/* 콘텐츠 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 왼쪽: 포트폴리오 + 리뷰 */}
                <div className="lg:col-span-2 space-y-6">
                    <PortfolioSection portfolios={vendor.portfolios} />
                    <ReviewSection
                        vendorId={vendor.id}
                        ratingAvg={vendor.ratingAvg}
                        reviewCount={vendor.reviewCount}
                        currentUserId={user?.id}
                    />
                </div>

                {/* 오른쪽: 정보 + CTA */}
                <div className="space-y-6">
                    <VendorInfo vendor={vendor} />
                </div>
            </div>
        </div>
    );
}
