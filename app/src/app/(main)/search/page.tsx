"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Search, X, ChevronRight } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import api from "@/api-client/client";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Tabs } from "@/components/ui/Tab/Tab";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";
import { VendorCard } from "../categories/[slug]/components/VendorCard";
import { VendorFilter } from "../categories/[slug]/components/VendorFilter";
import { SimplePagination } from "../categories/[slug]/components/SimplePagination";
import { ProductCard } from "@/components/widgets/ProductCard";
import type { VendorListItem } from "@/lib/schema/vendor";
import type { ProductListItem } from "@/lib/schema/product";
const PAGE_SIZE = 12;
const PREVIEW_COUNT = 4;

const TAB_OPTIONS = [
    { title: "전체" },
    { title: "상품" },
    { title: "업체" },
];

type SearchTab = "all" | "product" | "vendor";
const TAB_INDEX_MAP: SearchTab[] = ["all", "product", "vendor"];

function SearchContent() {
    // URL 상태 관리
    const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
    const [priceMin, setPriceMin] = useQueryState("priceMin", parseAsInteger);
    const [priceMax, setPriceMax] = useQueryState("priceMax", parseAsInteger);
    const [sort, setSort] = useQueryState("sort", parseAsString.withDefault("newest"));
    const [tabParam, setTabParam] = useQueryState("tab", parseAsString.withDefault("all"));
    const [regionPrimary, setRegionPrimary] = useQueryState("region", parseAsString);
    const [regionSecondary, setRegionSecondary] = useQueryState("region2", parseAsString);
    const [ratingMin, setRatingMin] = useQueryState("ratingMin", parseAsInteger);
    const [hasReviews, setHasReviews] = useQueryState("hasReviews", parseAsString);
    const [badgeTypes, setBadgeTypes] = useQueryState("badges", parseAsString);

    const tab = (TAB_INDEX_MAP.includes(tabParam as SearchTab) ? tabParam : "all") as SearchTab;
    const activeTabIndex = TAB_INDEX_MAP.indexOf(tab);

    const [searchText, setSearchText] = useState(q);

    useEffect(() => {
        setSearchText(q);
    }, [q]);

    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const canFetchFavorites = isAuthenticated && role === "doctor";

    // 업체 찜 목록 조회
    const { data: vendorFavorites = [] } = useQuery({
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

    // 상품 찜 목록 조회
    const { data: productFavorites = [] } = useQuery({
        queryKey: ["product-favorites", "ids"],
        queryFn: async (): Promise<string[]> => {
            const response = await api.get<{ data: { items: { product?: { id: string } | null; productId?: string }[] } }>("/api/product-favorites");
            return (response.data.data.items ?? [])
                .map((item) => item.productId ?? item.product?.id ?? "")
                .filter(Boolean);
        },
        staleTime: 60 * 1000,
        enabled: canFetchFavorites && tab !== "vendor",
    });

    // 업체 검색
    const { data: vendorData, isLoading: vendorsLoading } = useQuery({
        queryKey: [
            "vendors",
            "search",
            q,
            page,
            priceMin,
            priceMax,
            sort,
            regionPrimary,
            regionSecondary,
            ratingMin,
            hasReviews,
            badgeTypes,
        ],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (tab === "vendor") params.set("page", String(page));
            params.set("pageSize", tab === "all" ? String(PREVIEW_COUNT) : String(PAGE_SIZE));
            if (priceMin !== null) params.set("priceMin", String(priceMin));
            if (priceMax !== null) params.set("priceMax", String(priceMax));
            if (sort) params.set("sort", sort);
            if (tab === "vendor" && regionPrimary) params.set("regionPrimary", regionPrimary);
            if (tab === "vendor" && regionSecondary) params.set("regionSecondary", regionSecondary);
            if (tab === "vendor" && ratingMin !== null) params.set("ratingMin", String(ratingMin));
            if (tab === "vendor" && hasReviews) params.set("hasReviews", hasReviews);
            if (tab === "vendor" && badgeTypes) params.set("badgeTypes", badgeTypes);

            const response = await api.get<{
                data: { items: VendorListItem[]; page: number; pageSize: number; total: number };
            }>(`/api/vendors?${params.toString()}`);
            return response.data.data;
        },
        enabled: q.length > 0 && tab !== "product",
    });

    // 상품 검색
    const { data: productData, isLoading: productsLoading } = useQuery({
        queryKey: ["products", "search", q, page, priceMin, priceMax, sort],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (tab === "product") params.set("page", String(page));
            params.set("pageSize", tab === "all" ? String(PREVIEW_COUNT) : String(PAGE_SIZE));
            if (priceMin !== null) params.set("priceMin", String(priceMin));
            if (priceMax !== null) params.set("priceMax", String(priceMax));
            if (sort) params.set("sort", sort);

            const response = await api.get<{
                data: { items: ProductListItem[]; page: number; pageSize: number; total: number };
            }>(`/api/products?${params.toString()}`);
            return response.data.data;
        },
        enabled: q.length > 0 && tab !== "vendor",
    });

    const isLoading = (tab === "vendor" ? vendorsLoading : tab === "product" ? productsLoading : vendorsLoading || productsLoading);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setQ(searchText.trim());
        setPage(1);
    };

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

    const handleTabChange = (index: number) => {
        setTabParam(TAB_INDEX_MAP[index]);
        setPage(1);
    };

    const isVendorTab = tab === "vendor";
    const isFiltered = isVendorTab
        ? priceMin !== null
            || priceMax !== null
            || sort !== "newest"
            || regionPrimary !== null
            || ratingMin !== null
            || hasReviews !== null
            || badgeTypes !== null
        : priceMin !== null || priceMax !== null || sort !== "newest";

    const totalCount = (tab === "all"
        ? (productData?.total ?? 0) + (vendorData?.total ?? 0)
        : tab === "product"
            ? productData?.total ?? 0
            : vendorData?.total ?? 0);

    return (
        <div className="space-y-6">
            {/* 검색 헤더 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h1 className="text-2xl font-bold text-content-primary mb-4">통합 검색</h1>
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="flex-1 relative">
                        <Input
                            name="search"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="상품명, 업체명, 서비스로 검색"
                            size="lg"
                            LeadingIcon={<Search className="w-5 h-5 text-gray-400" />}
                        />
                    </div>
                    <Button type="submit" variant="primary" size="lg">
                        검색
                    </Button>
                </form>

                {/* 인기 검색어 */}
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-sm text-gray-500">추천:</span>
                    {["원외탕전", "의료기기", "인테리어", "전자차트", "마케팅"].map((keyword) => (
                        <button
                            key={keyword}
                            type="button"
                            onClick={() => { setSearchText(keyword); setQ(keyword); setPage(1); }}
                            className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-content-primary transition-colors"
                        >
                            {keyword}
                        </button>
                    ))}
                </div>
            </div>

            {/* 검색 결과 */}
            {q && (
                <>
                    {/* 검색어 + 탭 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-gray-600">
                                <span className="font-medium text-content-primary">&quot;{q}&quot;</span> 검색 결과
                                {!isLoading && (
                                    <span className="ml-2 text-gray-400">
                                        ({totalCount}건)
                                    </span>
                                )}
                            </p>
                            <button
                                type="button"
                                onClick={() => { setSearchText(""); setQ(""); setPage(1); }}
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-4 h-4" />
                                검색어 지우기
                            </button>
                        </div>

                        <Tabs
                            id="search-tabs"
                            tabs={TAB_OPTIONS}
                            activeTabIndex={activeTabIndex}
                            onTabChange={handleTabChange}
                        />
                    </div>

                    {/* 필터 (상품/업체 단독 탭에서만) */}
                    {tab !== "all" && (
                        <VendorFilter
                            priceMin={priceMin ?? undefined}
                            priceMax={priceMax ?? undefined}
                            regionPrimary={tab === "vendor" ? regionPrimary ?? undefined : undefined}
                            regionSecondary={tab === "vendor" ? regionSecondary ?? undefined : undefined}
                            onPriceMinChange={(v) => { setPriceMin(v ?? null); setPage(1); }}
                            onPriceMaxChange={(v) => { setPriceMax(v ?? null); setPage(1); }}
                            onRegionPrimaryChange={(v) => { setRegionPrimary(v ?? null); setPage(1); }}
                            onRegionSecondaryChange={(v) => { setRegionSecondary(v ?? null); setPage(1); }}
                            ratingMin={tab === "vendor" ? ratingMin ?? undefined : undefined}
                            onRatingMinChange={(v) => { setRatingMin(v ?? null); setPage(1); }}
                            hasReviews={tab === "vendor" ? hasReviews ?? undefined : undefined}
                            onHasReviewsChange={(v) => { setHasReviews(v ?? null); setPage(1); }}
                            badgeTypes={tab === "vendor" ? badgeTypes ?? undefined : undefined}
                            onBadgeTypesChange={(v) => { setBadgeTypes(v ?? null); setPage(1); }}
                            sort={sort}
                            onSortChange={(v) => { setSort(v); setPage(1); }}
                            viewMode="grid"
                            onViewModeChange={() => {}}
                            showViewModeToggle={false}
                            totalCount={tab === "product" ? productData?.total : vendorData?.total}
                            onReset={handleReset}
                            isFiltered={isFiltered}
                            listingType={tab === "product" ? "product" : "vendor"}
                        />
                    )}

                    {/* 로딩 */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Spinner size="lg" />
                        </div>
                    ) : totalCount === 0 ? (
                        <Empty
                            illustration="/images/empty/empty-search.svg"
                            title="검색 결과가 없습니다"
                            description="다른 키워드로 검색하거나 필터를 변경해 보세요"
                        />
                    ) : (
                        <>
                            {/* === 전체 탭 === */}
                            {tab === "all" && (
                                <div className="space-y-8">
                                    {/* 상품 결과 */}
                                    {(productData?.items.length ?? 0) > 0 && (
                                        <section>
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-lg font-bold text-gray-900">
                                                    상품 검색 결과
                                                    <span className="ml-2 text-sm font-normal text-gray-400">
                                                        ({productData?.total ?? 0}건)
                                                    </span>
                                                </h2>
                                                {(productData?.total ?? 0) > PREVIEW_COUNT && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTabChange(1)}
                                                        className="text-sm text-gray-500 hover:text-content-primary flex items-center gap-1"
                                                    >
                                                        더보기 <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {productData?.items.slice(0, PREVIEW_COUNT).map((product) => (
                                                    <ProductCard
                                                        key={product.id}
                                                        product={product}
                                                        isFavorited={productFavorites.includes(product.id)}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* 업체 결과 */}
                                    {(vendorData?.items.length ?? 0) > 0 && (
                                        <section>
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-lg font-bold text-gray-900">
                                                    업체 검색 결과
                                                    <span className="ml-2 text-sm font-normal text-gray-400">
                                                        ({vendorData?.total ?? 0}건)
                                                    </span>
                                                </h2>
                                                {(vendorData?.total ?? 0) > PREVIEW_COUNT && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTabChange(2)}
                                                        className="text-sm text-gray-500 hover:text-content-primary flex items-center gap-1"
                                                    >
                                                        더보기 <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {vendorData?.items.slice(0, PREVIEW_COUNT).map((vendor) => (
                                                    <VendorCard
                                                        key={vendor.id}
                                                        vendor={vendor}
                                                        isFavorited={vendorFavorites.includes(vendor.id)}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}

                            {/* === 상품 탭 === */}
                            {tab === "product" && (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {productData?.items.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                isFavorited={productFavorites.includes(product.id)}
                                            />
                                        ))}
                                    </div>

                                    {productData && productData.total > PAGE_SIZE && (
                                        <div className="flex justify-center mt-8">
                                            <SimplePagination
                                                currentPage={page}
                                                totalPages={Math.ceil(productData.total / PAGE_SIZE)}
                                                onPageChange={setPage}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* === 업체 탭 === */}
                            {tab === "vendor" && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {vendorData?.items.map((vendor) => (
                                            <VendorCard
                                                key={vendor.id}
                                                vendor={vendor}
                                                isFavorited={vendorFavorites.includes(vendor.id)}
                                            />
                                        ))}
                                    </div>

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
                        </>
                    )}
                </>
            )}

            {/* 검색어 없을 때 */}
            {!q && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-medium text-gray-700 mb-2">
                        원하는 상품이나 업체를 검색해 보세요
                    </h2>
                    <p className="text-gray-500">
                        상품명, 업체명, 서비스명으로 검색할 수 있습니다
                    </p>
                </div>
            )}
        </div>
    );
}

function SearchSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
                <div className="flex gap-3">
                    <div className="flex-1 h-12 bg-gray-200 rounded" />
                    <div className="w-20 h-12 bg-gray-200 rounded" />
                </div>
                <div className="mt-4 flex gap-2">
                    <div className="h-6 w-12 bg-gray-200 rounded" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-6 w-16 bg-gray-200 rounded-full" />
                    ))}
                </div>
            </div>
            <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200" />
                <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-2" />
                <div className="h-4 w-64 bg-gray-200 rounded mx-auto" />
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchSkeleton />}>
            <SearchContent />
        </Suspense>
    );
}
