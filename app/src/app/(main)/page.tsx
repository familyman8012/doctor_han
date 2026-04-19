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
    ExpertShowcase,
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

    // 상품 섹션 분해: 전역 섹션(신상품/고평점/급상승)과 카테고리별 섹션 분리
    const globalNewest = productSections.find((s) => s.id === "product-global:newest");
    const globalTopRated = productSections.find((s) => s.id === "product-global:top-rated");
    const globalTrending = productSections.find((s) => s.id === "product-global:trending");
    const productCategorySections = productSections.filter((s) =>
        s.id.startsWith("product-category:"),
    );

    if (isLoading) {
        return <HomePageSkeleton />;
    }

    return (
        <div className="space-y-8 md:space-y-10">
            {/* 히어로 배너 + 카테고리 묶음 */}
            <div className="space-y-3 sm:space-y-4">
                <HeroBanner />
                {categorySection && <CategoryScroller categories={categorySection.items} />}
            </div>

            {/* ─── 섹션 1: 업체 덩어리 ─────────────────────── */}
            {/* 추천 파트너 (업체 캐러셀) */}
            {recommendedSection && <VendorSection section={recommendedSection} />}

            {/* 이번 달 인기 (업체 그리드) */}
            {popularSection && <VendorSection section={popularSection} variant="grid" />}

            {/* 🟦 메인 광고 — 업체 덩어리 마무리 후 전환 지점 */}
            <AdBanner position="main" />

            {/* ─── 섹션 2: 상품 + 업체 교차 ──────────────── */}
            {/* 이번 주 신상품 (전역 상품) */}
            {globalNewest && <ProductSection section={globalNewest} variant="carousel" />}

            {/* 리뷰로 검증 (업체) */}
            {reviewedSection && <VendorSection section={reviewedSection} />}

            {/* 상품 카테고리 1~2번째 */}
            {productCategorySections[0] && (
                <ProductSection section={productCategorySections[0]} variant="grid" />
            )}

            {/* 전문가 쇼케이스 */}
            <ExpertShowcase />

            {/* 고평점 상품 (전역) */}
            {globalTopRated && <ProductSection section={globalTopRated} variant="carousel" />}

            {/* 신규 입점 (업체) */}
            {newestSection && <VendorSection section={newestSection} />}

            {/* 🟦 서브 광고 — 상품/업체 혼재 구간 지나고 두 번째 전환 */}
            <AdBanner position="sub" />

            {/* 상품 카테고리 3~4번째 */}
            {productCategorySections[1] && (
                <ProductSection section={productCategorySections[1]} variant="carousel" />
            )}

            {productCategorySections[2] && (
                <ProductSection section={productCategorySections[2]} variant="grid" />
            )}

            {/* 조회수 급상승 상품 (전역) */}
            {globalTrending && <ProductSection section={globalTrending} variant="carousel" />}

            {/* 카테고리별 업체 추천 */}
            {categorySections.map((section, index) => (
                <VendorSection
                    key={section.id}
                    section={section}
                    variant={index % 2 === 0 ? "carousel" : "grid"}
                />
            ))}

            {/* 남은 상품 카테고리 (5번 이상) */}
            {productCategorySections.slice(3).map((section, index) => (
                <ProductSection
                    key={section.id}
                    section={section}
                    variant={index % 2 === 0 ? "carousel" : "grid"}
                />
            ))}

            {/* 의사 추천사 */}
            <TestimonialSection />

            {/* 업체/의사 CTA */}
            <PromoBanner variant="vendor-cta" />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function HomePageSkeleton() {
    return (
        <div className="space-y-8 md:space-y-10 animate-pulse">
            {/* 배너 */}
            <div className="min-h-[280px] md:min-h-[380px] lg:min-h-[440px] bg-gray-200 rounded-2xl" />

            {/* 카테고리 */}
            <div className="space-y-4">
                <div className="h-6 w-24 bg-gray-200 rounded" />
                <div className="flex gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 bg-gray-200 rounded-full" />
                            <div className="w-12 h-3 bg-gray-200 rounded" />
                            <div className="w-8 h-2 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* 신뢰 구간 */}
            <div className="h-36 md:h-44 bg-gray-200 rounded-2xl" />

            {/* 특징 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded-xl" />
                ))}
            </div>

            {/* 업체 섹션 x2 */}
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

            {/* 추천사 */}
            <div className="space-y-4">
                <div className="h-6 w-48 bg-gray-200 rounded mx-auto" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-40 bg-gray-200 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
