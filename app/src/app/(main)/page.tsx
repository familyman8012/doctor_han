"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/api-client/client";
import type {
    HomeCategoryGridSection,
    HomeProductCarouselSection,
    HomeScreen,
    HomeVendorCarouselSection,
} from "@/lib/schema/home";
import {
    HeroBanner,
    CategoryScroller,
    VendorSection,
    ProductSection,
    PromoBanner,
    TestimonialSection,
} from "./components";
import { AdBanner } from "@/components/widgets/AdBanner";

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
    const categorySection = sections.find(
        (s): s is HomeCategoryGridSection => s.type === "category_grid",
    );
    const vendorSections = sections.filter(
        (s): s is HomeVendorCarouselSection => s.type === "vendor_carousel",
    );
    const productSections = sections.filter(
        (s): s is HomeProductCarouselSection => s.type === "product_carousel",
    );

    const recommendedSection = vendorSections.find((s) => s.id === "recommended");
    const popularSection = vendorSections.find((s) => s.id === "popular");
    const reviewedSection = vendorSections.find((s) => s.id === "reviewed");
    const newestSection = vendorSections.find((s) => s.id === "newest");
    const categorySections = vendorSections.filter((s) => s.id.startsWith("category:"));

    if (isLoading) {
        return <HomePageSkeleton />;
    }

    return (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            {/* 히어로 배너 */}
            <SectionWrapper bg="white">
                <HeroBanner />
            </SectionWrapper>

            {/* 카테고리 */}
            <SectionWrapper bg="gray">
                {categorySection && <CategoryScroller categories={categorySection.items} />}
            </SectionWrapper>

            {/* 신뢰 구간 — 통계 */}
            <SectionWrapper bg="white">
                <PromoBanner variant="stats" />
            </SectionWrapper>

            {/* 메인 광고 배너 */}
            <SectionWrapper bg="gray">
                <AdBanner position="main" />
            </SectionWrapper>

            {/* 추천 파트너 */}
            {recommendedSection && (
                <SectionWrapper bg="white">
                    <VendorSection section={recommendedSection} />
                </SectionWrapper>
            )}

            {/* 인기 업체 (그리드) */}
            {popularSection && (
                <SectionWrapper bg="gray">
                    <VendorSection section={popularSection} variant="grid" />
                </SectionWrapper>
            )}

            {/* 특징 소개 */}
            <SectionWrapper bg="white">
                <PromoBanner variant="feature" />
            </SectionWrapper>

            {/* 상품 섹션들 */}
            {productSections.map((section, index) => (
                <SectionWrapper key={section.id} bg={index % 2 === 0 ? "gray" : "white"}>
                    <ProductSection
                        section={section}
                        variant={index % 2 === 0 ? "carousel" : "grid"}
                    />
                </SectionWrapper>
            ))}

            {/* 의사 추천사 */}
            <SectionWrapper bg="gray">
                <TestimonialSection />
            </SectionWrapper>

            {/* 업체/의사 CTA */}
            <SectionWrapper bg="white">
                <PromoBanner variant="vendor-cta" />
            </SectionWrapper>

            {/* 서브 광고 배너 */}
            <SectionWrapper bg="gray">
                <AdBanner position="sub" />
            </SectionWrapper>

            {/* 리뷰로 검증 */}
            {reviewedSection && (
                <SectionWrapper bg="white">
                    <VendorSection section={reviewedSection} />
                </SectionWrapper>
            )}

            {/* 신규 입점 */}
            {newestSection && (
                <SectionWrapper bg="gray">
                    <VendorSection section={newestSection} />
                </SectionWrapper>
            )}

            {/* 카테고리별 추천 */}
            {categorySections.map((section, index) => (
                <SectionWrapper
                    key={section.id}
                    bg={index % 2 === 0 ? "white" : "gray"}
                >
                    <VendorSection
                        section={section}
                        variant={index % 2 === 0 ? "carousel" : "grid"}
                    />
                </SectionWrapper>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Section wrapper for alternating backgrounds
// ---------------------------------------------------------------------------

function SectionWrapper({
    children,
    bg,
}: {
    children: React.ReactNode;
    bg: "white" | "gray";
}) {
    return (
        <div className={bg === "gray" ? "bg-gray-50" : "bg-white"}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
                {children}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function HomePageSkeleton() {
    return (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 animate-pulse">
            {/* 배너 */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="h-48 md:h-64 bg-gray-200 rounded-2xl" />
                </div>
            </div>

            {/* 카테고리 */}
            <div className="bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
                    <div className="flex gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                                <div className="w-12 h-3 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 신뢰 구간 */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="h-36 md:h-44 bg-gray-200 rounded-2xl" />
                </div>
            </div>

            {/* 업체 섹션 x2 */}
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
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
                </div>
            ))}

            {/* 추천사 */}
            <div className="bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-40 bg-gray-200 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
