"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { ChevronRight } from "lucide-react";
import api from "@/api-client/client";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { Empty } from "@/components/ui/Empty/Empty";
import { Button } from "@/components/ui/Button/button";
import { VendorCard } from "../components/VendorCard";
import { VendorFilter } from "../components/VendorFilter";
import { SimplePagination } from "../components/SimplePagination";
import { useFavoriteIds } from "../hooks/useFavoriteIds";
import type { Category } from "@/lib/schema/category";
import type { VendorListItem } from "@/lib/schema/vendor";

const PAGE_SIZE = 12;

interface SubCategoryPageProps {
    slug: string;
    subSlug: string;
}

export default function SubCategoryPage({ slug, subSlug }: SubCategoryPageProps) {
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

    const parentCategory = categories.find((c) => c.slug === slug && c.depth === 1);
    const currentCategory = categories.find((c) => c.slug === subSlug && c.parentId === parentCategory?.id);
    const siblingCategories = categories.filter((c) => c.parentId === parentCategory?.id);

    const { data: favorites = [] } = useFavoriteIds();

    // 업체 리스트 조회
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
        enabled: !!currentCategory,
    });

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

    const isFiltered = priceMin !== null || priceMax !== null || sort !== "newest"
        || regionPrimary !== null || ratingMin !== null || hasReviews !== null || badgeTypes !== null;

    if (isLoadingCategories) {
        return (
            <div className="space-y-6">
                <Skeleton variant="text" className="w-48 h-4" />
                <div>
                    <Skeleton variant="text" className="w-64 h-8 mb-2" />
                    <Skeleton variant="text" className="w-32 h-4" />
                </div>
                <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} variant="rounded" className="w-20 h-9" />
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <Skeleton variant="rounded" className="w-full aspect-[4/3]" />
                            <div className="p-4 space-y-2">
                                <Skeleton variant="text" className="w-16 h-4" />
                                <Skeleton variant="text" className="w-3/4 h-5" />
                                <Skeleton variant="text" className="w-full h-4" />
                                <Skeleton variant="text" className="w-1/2 h-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!parentCategory || !currentCategory) {
        return (
            <div className="py-20">
                <Empty title="카테고리를 찾을 수 없습니다" description="다른 카테고리를 선택해 주세요." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/categories" className="hover:text-content-primary">
                    전체 카테고리
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link href={`/categories/${slug}`} className="hover:text-content-primary">
                    {parentCategory.name}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-content-primary font-medium">{currentCategory.name}</span>
            </nav>

            {/* 헤더 */}
            <div>
                <h1 className="text-2xl font-bold text-content-primary mb-2">
                    {parentCategory.name} &middot; {currentCategory.name}
                </h1>
                <p className="text-gray-500">
                    {vendorData?.total ?? 0}개의 업체가 있습니다
                </p>
            </div>

            {/* 형제 카테고리 */}
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                <div className="flex gap-2 min-w-max md:flex-wrap md:min-w-0">
                    <Link
                        href={`/categories/${slug}`}
                        className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-content-primary transition-colors"
                    >
                        전체
                    </Link>
                    {siblingCategories.map((sibling) => (
                        <Link
                            key={sibling.id}
                            href={`/categories/${slug}/${sibling.slug}`}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                                sibling.id === currentCategory.id
                                    ? "bg-primary-900 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-content-primary"
                            }`}
                        >
                            {sibling.name}
                        </Link>
                    ))}
                </div>
            </div>

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
                totalCount={vendorData?.total}
                onReset={handleReset}
                isFiltered={isFiltered}
                listingType="vendor"
            />

            {/* 업체 리스트 */}
            {isLoadingVendors ? (
                <div className={viewMode === "list" ? "space-y-4" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={viewMode === "list" ? "flex gap-4 bg-white rounded-xl border border-gray-100 p-4" : "bg-white rounded-xl border border-gray-100 overflow-hidden"}>
                            <Skeleton variant="rounded" className={viewMode === "list" ? "w-48 h-32 shrink-0" : "w-full aspect-[4/3]"} />
                            <div className={viewMode === "list" ? "flex-1 space-y-2" : "p-4 space-y-2"}>
                                <Skeleton variant="text" className="w-16 h-4" />
                                <Skeleton variant="text" className="w-3/4 h-5" />
                                <Skeleton variant="text" className="w-full h-4" />
                                <Skeleton variant="text" className="w-1/2 h-4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : vendorData?.items.length === 0 ? (
                <div className="py-12">
                    <Empty
                        illustration="/images/empty/empty-search.svg"
                        title={isFiltered ? "필터 조건에 맞는 업체가 없습니다" : "등록된 업체가 없습니다"}
                        description={isFiltered ? "필터를 변경하거나 초기화해 보세요" : "다른 카테고리를 선택해 주세요"}
                    />
                    {isFiltered ? (
                        <div className="flex justify-center mt-3">
                            <Button variant="ghostSecondary" size="sm" onClick={handleReset}>
                                필터 초기화
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-center mt-3">
                            <Link href="/categories" className="text-sm text-primary hover:underline">
                                다른 카테고리 둘러보기
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === "list" ? (
                        <div className="space-y-4">
                            {vendorData?.items.map((vendor) => (
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
                            {vendorData?.items.map((vendor) => (
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
                    {vendorData && vendorData.total > PAGE_SIZE && (
                        <div className="flex justify-center mt-8">
                            <SimplePagination
                                currentPage={page}
                                totalPages={Math.ceil(vendorData.total / PAGE_SIZE)}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
