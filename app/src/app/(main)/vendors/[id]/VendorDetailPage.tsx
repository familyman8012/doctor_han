"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import api from "@/api-client/client";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { Empty } from "@/components/ui/Empty/Empty";
import { useIsAuthenticated, useUser, useUserRole } from "@/stores/auth";
import type { VendorDetail } from "@/lib/schema/vendor";
import { HeroGallery } from "./components/HeroGallery";
import { HeroInfo } from "./components/HeroInfo";
import { StickyCtaPanel } from "./components/StickyCtaPanel";
import { MobileCtaBar } from "./components/MobileCtaBar";
import { VendorTabs } from "./components/VendorTabs";
import { ServiceIntroTab } from "./components/tabs/ServiceIntroTab";
import { PortfolioTab } from "./components/tabs/PortfolioTab";
import { PricingTab } from "./components/tabs/PricingTab";
import { ReviewTab } from "./components/tabs/ReviewTab";
import { VendorInfoTab } from "./components/tabs/VendorInfoTab";

interface VendorDetailPageProps {
    vendorId: string;
}

export default function VendorDetailPage({ vendorId }: VendorDetailPageProps) {
    const user = useUser();
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const queryClient = useQueryClient();
    const canFetchFavorites = isAuthenticated && role === "doctor";

    // 업체 상세 조회
    const { data: vendorData, isLoading, isError } = useQuery({
        queryKey: ["vendor", vendorId],
        queryFn: async () => {
            const response = await api.get<{ data: { vendor: VendorDetail } }>(
                `/api/vendors/${vendorId}`,
            );
            return response.data.data;
        },
    });

    // 찜 목록 조회
    const { data: favorites = [] } = useQuery({
        queryKey: ["favorites", "ids"],
        queryFn: async (): Promise<string[]> => {
            const response = await api.get<{
                data: { items: { vendor: { id: string } | null }[] };
            }>("/api/favorites");
            return (response.data.data.items ?? [])
                .map((item) => item.vendor?.id)
                .filter((id): id is string => Boolean(id));
        },
        staleTime: 60 * 1000,
        enabled: canFetchFavorites,
    });

    // 찜 토글 mutation (StickyCtaPanel + MobileCtaBar 공유)
    const favoriteMutation = useMutation({
        mutationFn: async (vId: string) => {
            const response = await api.post<{
                data: { vendorId: string; isFavorited: boolean };
            }>("/api/favorites/toggle", { vendorId: vId });
            return response.data.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
            queryClient.invalidateQueries({ queryKey: ["vendor", vendorId] });
            toast.success(
                data.isFavorited
                    ? "찜 목록에 추가되었습니다"
                    : "찜 목록에서 삭제되었습니다",
            );
        },
    });

    const handleFavoriteClick = () => {
        if (!isAuthenticated) {
            toast.error("로그인이 필요합니다");
            return;
        }
        if (role !== "doctor") {
            toast.error("한의사 회원만 찜할 수 있습니다");
            return;
        }
        if (vendorData?.vendor) {
            favoriteMutation.mutate(vendorData.vendor.id);
        }
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-4 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Skeleton className="lg:col-span-3 aspect-[4/3] rounded-xl" />
                    <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <Skeleton className="lg:col-span-3 h-96 rounded-xl" />
                    <Skeleton className="lg:col-span-2 h-72 rounded-xl" />
                </div>
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
    const categorySlug = vendor.categories.find((c) => c.depth === 1)?.slug;

    const tabSections = [
        {
            id: "service-intro",
            title: "서비스 소개",
            content: <ServiceIntroTab vendor={vendor} />,
        },
        {
            id: "portfolio",
            title: "포트폴리오",
            label: vendor.portfolios.length > 0 ? String(vendor.portfolios.length) : undefined,
            content: <PortfolioTab portfolios={vendor.portfolios} />,
        },
        {
            id: "pricing",
            title: "가격 정보",
            content: <PricingTab vendor={vendor} />,
        },
        {
            id: "reviews",
            title: "리뷰",
            label: vendor.reviewCount > 0 ? String(vendor.reviewCount) : undefined,
            content: (
                <ReviewTab
                    vendorId={vendor.id}
                    ratingAvg={vendor.ratingAvg}
                    reviewCount={vendor.reviewCount}
                    currentUserId={user?.id}
                />
            ),
        },
        {
            id: "vendor-info",
            title: "업체 정보",
            content: <VendorInfoTab vendor={vendor} />,
        },
    ];

    return (
        <div className="space-y-6 pb-24 lg:pb-6">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/categories" className="hover:text-content-primary">
                    전체 카테고리
                </Link>
                {vendor.categories[0] && (
                    <>
                        <ChevronRight className="w-4 h-4" />
                        <Link
                            href={`/categories/${vendor.categories[0].slug}`}
                            className="hover:text-content-primary"
                        >
                            {vendor.categories[0].name}
                        </Link>
                    </>
                )}
                <ChevronRight className="w-4 h-4" />
                <span className="text-content-primary font-medium truncate max-w-[200px]">
                    {vendor.name}
                </span>
            </nav>

            {/* 히어로: 갤러리 + 기본 정보 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <HeroGallery portfolios={vendor.portfolios} categorySlug={categorySlug} />
                </div>
                <div className="lg:col-span-2">
                    <HeroInfo vendor={vendor} />
                </div>
            </div>

            {/* 탭 콘텐츠 + 사이드바 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <VendorTabs sections={tabSections} />
                </div>
                <div className="lg:col-span-2">
                    <StickyCtaPanel
                        vendor={vendor}
                        isFavorited={isFavorited}
                    />
                </div>
            </div>

            {/* 모바일 하단 CTA 바 */}
            <MobileCtaBar
                vendor={vendor}
                isFavorited={isFavorited}
                onFavoriteClick={handleFavoriteClick}
            />
        </div>
    );
}
