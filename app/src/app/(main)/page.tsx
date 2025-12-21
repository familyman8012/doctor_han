"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/api-client/client";
import type { HomeCategoryGridSection, HomeScreen, HomeVendorCarouselSection } from "@/lib/schema/home";
import { HeroBanner, CategoryScroller, VendorSection, PromoBanner } from "./components";

export default function HomePage() {
    const { data: home, isLoading } = useQuery({
        queryKey: ["home"],
        queryFn: async (): Promise<HomeScreen> => {
            const response = await api.get<{ data: HomeScreen }>("/api/home");
            return response.data.data;
        },
        staleTime: 60 * 1000,
    });

    const sections = home?.sections ?? [];
    const categorySection = sections.find((s): s is HomeCategoryGridSection => s.type === "category_grid");
    const vendorSections = sections.filter((s): s is HomeVendorCarouselSection => s.type === "vendor_carousel");

    // 메인 섹션들 분리
    const recommendedSection = vendorSections.find((s) => s.id === "recommended");
    const popularSection = vendorSections.find((s) => s.id === "popular");
    const reviewedSection = vendorSections.find((s) => s.id === "reviewed");
    const newestSection = vendorSections.find((s) => s.id === "newest");
    const categorySections = vendorSections.filter((s) => s.id.startsWith("category:"));

    if (isLoading) {
        return <HomePageSkeleton />;
    }

    return (
        <div className="space-y-8 md:space-y-10">
            {/* 메인 배너 슬라이더 */}
            <HeroBanner />

            {/* 카테고리 가로 스크롤 */}
            {categorySection && <CategoryScroller categories={categorySection.items} />}

            {/* 특징 소개 배너 */}
            <PromoBanner variant="feature" />

            {/* 추천 파트너 섹션 */}
            {recommendedSection && <VendorSection section={recommendedSection} />}

            {/* 인기 업체 (그리드 형태) */}
            {popularSection && <VendorSection section={popularSection} variant="grid" />}

            {/* 업체 등록 CTA 배너 */}
            <PromoBanner variant="vendor-cta" />

            {/* 리뷰로 검증 섹션 */}
            {reviewedSection && <VendorSection section={reviewedSection} />}

            {/* 신규 입점 섹션 */}
            {newestSection && <VendorSection section={newestSection} />}

            {/* 카테고리별 추천 섹션들 */}
            {categorySections.map((section, index) => (
                <VendorSection
                    key={section.id}
                    section={section}
                    variant={index % 2 === 0 ? "carousel" : "grid"}
                />
            ))}
        </div>
    );
}

function HomePageSkeleton() {
    return (
        <div className="space-y-8 md:space-y-10 animate-pulse">
            {/* 배너 스켈레톤 */}
            <div className="h-48 md:h-64 bg-gray-200 rounded-2xl" />

            {/* 카테고리 스켈레톤 */}
            <div className="space-y-4">
                <div className="h-6 w-24 bg-gray-200 rounded" />
                <div className="flex gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 bg-gray-200 rounded-full" />
                            <div className="w-12 h-3 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* 특징 카드 스켈레톤 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded-xl" />
                ))}
            </div>

            {/* 업체 섹션 스켈레톤 */}
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-4">
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="flex-shrink-0 w-[220px] md:w-[260px]">
                                <div className="aspect-[4/3] bg-gray-200 rounded-t-xl" />
                                <div className="p-3 space-y-2 bg-gray-100 rounded-b-xl">
                                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                                    <div className="h-3 w-full bg-gray-200 rounded" />
                                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
