"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { ChevronRight } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
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
        queryKey: ["vendors", currentCategory?.id, page, priceMin, priceMax, sort],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (currentCategory?.id) params.set("categoryId", currentCategory.id);
            if (page) params.set("page", String(page));
            params.set("pageSize", String(PAGE_SIZE));
            if (priceMin !== null) params.set("priceMin", String(priceMin));
            if (priceMax !== null) params.set("priceMax", String(priceMax));
            if (sort) params.set("sort", sort);

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
        setSort("newest");
        setPage(1);
    };

    const isFiltered = priceMin !== null || priceMax !== null || sort !== "newest";

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
                        <p className="text-primary-200">
                            {listData?.total ?? 0}개의 {listLabel}가 있습니다
                        </p>
                    </div>
                </div>
            ) : (
                <div>
                    <h1 className="text-2xl font-bold text-content-primary mb-2">{currentCategory.name}</h1>
                    <p className="text-gray-500">
                        {listData?.total ?? 0}개의 {listLabel}가 있습니다
                    </p>
                </div>
            )}

            {/* 하위 카테고리 */}
            {subCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/categories/${slug}`}
                        className="px-4 py-2 text-sm font-medium rounded-full bg-primary-900 text-white"
                    >
                        전체
                    </Link>
                    {subCategories.map((sub) => (
                        <Link
                            key={sub.id}
                            href={`/categories/${slug}/${sub.slug}`}
                            className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-content-primary transition-colors"
                        >
                            {sub.name}
                        </Link>
                    ))}
                </div>
            )}

            {/* 필터 */}
            <VendorFilter
                priceMin={priceMin ?? undefined}
                priceMax={priceMax ?? undefined}
                sort={sort}
                onPriceMinChange={(v) => { setPriceMin(v ?? null); setPage(1); }}
                onPriceMaxChange={(v) => { setPriceMax(v ?? null); setPage(1); }}
                onSortChange={(v) => { setSort(v); setPage(1); }}
                onReset={handleReset}
                isFiltered={isFiltered}
            />

            {/* 우선순위 광고 업체 (vendor-centric만) */}
            {!isProductListing && currentCategory && <PriorityVendorSection categoryId={currentCategory.id} />}

            {/* 리스트 */}
            {isLoadingList ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner size="lg" />
                </div>
            ) : listData?.items.length === 0 ? (
                <Empty
                    illustration="/images/empty/empty-search.svg"
                    title={`등록된 ${listLabel}가 없습니다`}
                    description="다른 카테고리를 선택하거나 필터를 변경해 보세요"
                />
            ) : (
                <>
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
