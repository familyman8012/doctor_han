"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { ChevronRight } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { Button } from "@/components/ui/Button/button";
import { CATEGORY_BG_PATHS } from "@/lib/constants/assets";
import { VendorCard } from "./components/VendorCard";
import { VendorFilter } from "./components/VendorFilter";
import { SimplePagination } from "./components/SimplePagination";
import { useFavoriteIds } from "./hooks/useFavoriteIds";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";
import type { Category } from "@/lib/schema/category";
import type { VendorListItem } from "@/lib/schema/vendor";
import type { ProductListItem } from "@/lib/schema/product";
import { ProductCard } from "@/components/widgets/ProductCard";
import { PriorityVendorSection } from "@/components/widgets/PriorityVendorSection";

const PAGE_SIZE = 12;

interface CategoryPageProps {
    slug: string;
}

export default function CategoryPage({ slug }: CategoryPageProps) {
    // URL 상태 관리
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
    const [priceMin, setPriceMin] = useQueryState("priceMin", parseAsInteger);
    const [priceMax, setPriceMax] = useQueryState("priceMax", parseAsInteger);
    const [sort, setSort] = useQueryState("sort", parseAsString.withDefault("newest"));
    const [regionPrimary, setRegionPrimary] = useQueryState("region", parseAsString);
    const [regionSecondary, setRegionSecondary] = useQueryState("region2", parseAsString);
    const [ratingMin, setRatingMin] = useQueryState("ratingMin", parseAsInteger);
    const [hasReviews, setHasReviews] = useQueryState("hasReviews", parseAsString);
    const [badgeTypes, setBadgeTypes] = useQueryState("badges", parseAsString);
    const [viewMode, setViewMode] = useQueryState("view", parseAsString.withDefault("grid"));

    // 카테고리 조회
    const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
        queryKey: ["categories"],
        queryFn: async (): Promise<Category[]> => {
            const response = await api.get<{ data: { items: Category[] } }>("/api/categories");
            return response.data.data.items;
        },
        staleTime: 5 * 60 * 1000,
    });

    const currentCategory = categories.find((c) => c.slug === slug && c.depth === 1);
    const subCategories = categories.filter((c) => c.parentId === currentCategory?.id);
    const isProductListing = currentCategory?.listingType === "product";

    const { data: favorites = [] } = useFavoriteIds();

    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const canFetchFavorites = isAuthenticated && role === "doctor";

    // 상품 찜 목록 (product-centric categories)
    const { data: productFavorites = [] } = useQuery({
        queryKey: ["product-favorites", "ids"],
        queryFn: async (): Promise<string[]> => {
            const response = await api.get<{ data: { items: { productId?: string; product?: { id: string } }[] } }>("/api/product-favorites");
            return (response.data.data.items ?? []).map((item) => item.productId ?? item.product?.id ?? "").filter(Boolean);
        },
        staleTime: 60 * 1000,
        enabled: isProductListing && canFetchFavorites,
    });

    // 업체 리스트 조회 (vendor-centric categories)
    const { data: vendorData, isLoading: isLoadingVendors } = useQuery({
        queryKey: ["vendors", currentCategory?.id, page, priceMin, priceMax, sort, regionPrimary, regionSecondary, ratingMin, hasReviews, badgeTypes],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (currentCategory?.id) params.set("categoryId", currentCategory.id);
            if (page) params.set("page", String(page));
            params.set("pageSize", String(PAGE_SIZE));
            if (priceMin !== null) params.set("priceMin", String(priceMin));
            if (priceMax !== null) params.set("priceMax", String(priceMax));
            if (sort) params.set("sort", sort);
            if (regionPrimary) params.set("regionPrimary", regionPrimary);
            if (regionSecondary) params.set("regionSecondary", regionSecondary);
            if (ratingMin !== null) params.set("ratingMin", String(ratingMin));
            if (hasReviews) params.set("hasReviews", hasReviews);
            if (badgeTypes) params.set("badgeTypes", badgeTypes);

            const response = await api.get<{
                data: { items: VendorListItem[]; page: number; pageSize: number; total: number };
            }>(`/api/vendors?${params.toString()}`);
            return response.data.data;
        },
        enabled: !!currentCategory && !isProductListing,
    });

    // 상품 리스트 조회 (product-centric categories)
    const { data: productData, isLoading: isLoadingProducts } = useQuery({
        queryKey: ["products", currentCategory?.id, page, priceMin, priceMax, sort],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (currentCategory?.id) params.set("categoryId", currentCategory.id);
            if (page) params.set("page", String(page));
            params.set("pageSize", String(PAGE_SIZE));
            if (priceMin !== null) params.set("priceMin", String(priceMin));
            if (priceMax !== null) params.set("priceMax", String(priceMax));
            if (sort) params.set("sort", sort);

            const response = await api.get<{
                data: { items: ProductListItem[]; page: number; pageSize: number; total: number };
            }>(`/api/products?${params.toString()}`);
            return response.data.data;
        },
        enabled: !!currentCategory && isProductListing,
    });

    const listData = isProductListing ? productData : vendorData;
    const isLoadingList = isProductListing ? isLoadingProducts : isLoadingVendors;
    const listLabel = isProductListing ? "상품" : "업체";

    const handleReset = () => {
        setPriceMin(null);
        setPriceMax(null);
        setRegionPrimary(null);
        setRegionSecondary(null);
        setRatingMin(null);
        setHasReviews(null);
        setBadgeTypes(null);
        setSort("newest");
        setPage(1);
    };

    const isFiltered =
        priceMin !== null ||
        priceMax !== null ||
        sort !== "newest" ||
        regionPrimary !== null ||
        ratingMin !== null ||
        hasReviews !== null ||
        badgeTypes !== null;

    if (isLoadingCategories) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!currentCategory) {
        return (
            <div className="py-20">
                <Empty title="카테고리를 찾을 수 없습니다" description="다른 카테고리를 선택해 주세요." />
            </div>
        );
    }

    // 히어로 설명 문구
    const heroDescription = isProductListing
        ? `${currentCategory.name} 분야 ${listData?.total ?? 0}개 상품을 비교해보세요`
        : `${currentCategory.name} 분야 검증된 업체 ${listData?.total ?? 0}곳을 비교해보세요`;

    return (
        <div className="space-y-6">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/categories" className="hover:text-content-primary">
                    전체 카테고리
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-content-primary font-medium">{currentCategory.name}</span>
            </nav>

            {/* 헤더 */}
            {CATEGORY_BG_PATHS[slug] ? (
                <div className="relative rounded-xl overflow-hidden">
                    <Image
                        src={CATEGORY_BG_PATHS[slug]}
                        alt={currentCategory.name}
                        width={1200}
                        height={400}
                        className="w-full h-32 md:h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 to-primary-900/40" />
                    <div className="absolute inset-0 flex flex-col justify-center px-6">
                        <h1 className="text-2xl font-bold text-white mb-2">{currentCategory.name}</h1>
                        <p className="text-primary-200">{heroDescription}</p>
                    </div>
                </div>
            ) : (
                <div>
                    <h1 className="text-2xl font-bold text-content-primary mb-2">{currentCategory.name}</h1>
                    <p className="text-gray-500">{heroDescription}</p>
                </div>
            )}

            {/* 하위 카테고리 — 모바일 가로 스크롤 */}
            {subCategories.length > 0 && (
                <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                    <div className="flex gap-2 min-w-max md:flex-wrap md:min-w-0">
                        <Link
                            href={`/categories/${slug}`}
                            className="px-4 py-2 text-sm font-medium rounded-full bg-primary-900 text-white shrink-0"
                        >
                            전체
                        </Link>
                        {subCategories.map((sub) => (
                            <Link
                                key={sub.id}
                                href={`/categories/${slug}/${sub.slug}`}
                                className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-content-primary transition-colors shrink-0"
                            >
                                {sub.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* 필터 */}
            <VendorFilter
                priceMin={priceMin ?? undefined}
                priceMax={priceMax ?? undefined}
                onPriceMinChange={(v) => { setPriceMin(v ?? null); setPage(1); }}
                onPriceMaxChange={(v) => { setPriceMax(v ?? null); setPage(1); }}
                regionPrimary={regionPrimary ?? undefined}
                regionSecondary={regionSecondary ?? undefined}
                onRegionPrimaryChange={(v) => { setRegionPrimary(v ?? null); setPage(1); }}
                onRegionSecondaryChange={(v) => { setRegionSecondary(v ?? null); setPage(1); }}
                ratingMin={ratingMin ?? undefined}
                onRatingMinChange={(v) => { setRatingMin(v ?? null); setPage(1); }}
                hasReviews={hasReviews ?? undefined}
                onHasReviewsChange={(v) => { setHasReviews(v ?? null); setPage(1); }}
                badgeTypes={badgeTypes ?? undefined}
                onBadgeTypesChange={(v) => { setBadgeTypes(v ?? null); setPage(1); }}
                sort={sort}
                onSortChange={(v) => { setSort(v); setPage(1); }}
                viewMode={viewMode}
                onViewModeChange={(v) => { setViewMode(v); }}
                totalCount={listData?.total}
                onReset={handleReset}
                isFiltered={isFiltered}
                listingType={currentCategory.listingType}
            />

            {/* 우선순위 광고 업체 (vendor-centric만) */}
            {!isProductListing && currentCategory && <PriorityVendorSection categoryId={currentCategory.id} />}

            {/* 리스트 */}
            {isLoadingList ? (
                <div className={viewMode === "list" ? "space-y-4" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className={
                                viewMode === "list"
                                    ? "flex gap-4 bg-white rounded-xl border border-gray-100 p-4"
                                    : "bg-white rounded-xl border border-gray-100 overflow-hidden"
                            }
                        >
                            <Skeleton
                                variant="rounded"
                                className={viewMode === "list" ? "w-48 h-32 shrink-0" : "w-full aspect-[4/3]"}
                            />
                            <div className={viewMode === "list" ? "flex-1 space-y-2" : "p-4 space-y-2"}>
                                <Skeleton variant="text" className="w-16 h-4" />
                                <Skeleton variant="text" className="w-3/4 h-5" />
                                <Skeleton variant="text" className="w-full h-4" />
                                <Skeleton variant="text" className="w-1/2 h-4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : listData?.items.length === 0 ? (
                <div className="py-12">
                    <Empty
                        illustration="/images/empty/empty-search.svg"
                        title={isFiltered ? `필터 조건에 맞는 ${listLabel}가 없습니다` : `등록된 ${listLabel}가 없습니다`}
                        description={isFiltered ? "필터를 변경하거나 초기화해 보세요" : "다른 카테고리를 선택해 주세요"}
                    >
                        {isFiltered ? (
                            <Button variant="ghostSecondary" size="sm" onClick={handleReset} className="mt-3">
                                필터 초기화
                            </Button>
                        ) : (
                            <Link href="/categories" className="mt-3 inline-block text-sm text-primary hover:underline">
                                다른 카테고리 둘러보기
                            </Link>
                        )}
                    </Empty>
                </div>
            ) : (
                <>
                    {/* 뷰 모드에 따른 렌더링 */}
                    {viewMode === "list" ? (
                        <div className="space-y-4">
                            {isProductListing
                                ? productData?.items.map((product) => (
                                      <ProductCard
                                          key={product.id}
                                          product={product}
                                          isFavorited={productFavorites.includes(product.id)}
                                      />
                                  ))
                                : vendorData?.items.map((vendor) => (
                                      <VendorCard
                                          key={vendor.id}
                                          vendor={vendor}
                                          variant="list"
                                          categorySlug={slug}
                                          isFavorited={favorites.includes(vendor.id)}
                                      />
                                  ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {isProductListing
                                ? productData?.items.map((product) => (
                                      <ProductCard
                                          key={product.id}
                                          product={product}
                                          isFavorited={productFavorites.includes(product.id)}
                                      />
                                  ))
                                : vendorData?.items.map((vendor) => (
                                      <VendorCard
                                          key={vendor.id}
                                          vendor={vendor}
                                          categorySlug={slug}
                                          isFavorited={favorites.includes(vendor.id)}
                                      />
                                  ))}
                        </div>
                    )}

                    {/* 페이지네이션 */}
                    {listData && listData.total > PAGE_SIZE && (
                        <div className="flex justify-center mt-8">
                            <SimplePagination
                                currentPage={page}
                                totalPages={Math.ceil(listData.total / PAGE_SIZE)}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
