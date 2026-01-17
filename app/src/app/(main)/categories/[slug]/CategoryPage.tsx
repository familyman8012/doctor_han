"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { ChevronRight } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { VendorCard } from "./components/VendorCard";
import { VendorFilter } from "./components/VendorFilter";
import { SimplePagination } from "./components/SimplePagination";
import { useFavoriteIds } from "./hooks/useFavoriteIds";
import type { Category } from "@/lib/schema/category";
import type { VendorListItem } from "@/lib/schema/vendor";

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

    const { data: favorites = [] } = useFavoriteIds();

    // 업체 리스트 조회
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
        enabled: !!currentCategory,
    });

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
                <Link href="/categories" className="hover:text-[#0a3b41]">
                    전체 카테고리
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#0a3b41] font-medium">{currentCategory.name}</span>
            </nav>

            {/* 헤더 */}
            <div>
                <h1 className="text-2xl font-bold text-[#0a3b41] mb-2">{currentCategory.name}</h1>
                <p className="text-gray-500">
                    {vendorData?.total ?? 0}개의 업체가 있습니다
                </p>
            </div>

            {/* 하위 카테고리 */}
            {subCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/categories/${slug}`}
                        className="px-4 py-2 text-sm font-medium rounded-full bg-[#0a3b41] text-white"
                    >
                        전체
                    </Link>
                    {subCategories.map((sub) => (
                        <Link
                            key={sub.id}
                            href={`/categories/${slug}/${sub.slug}`}
                            className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-[#62e3d5]/20 hover:text-[#0a3b41] transition-colors"
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

            {/* 업체 리스트 */}
            {isLoadingVendors ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner size="lg" />
                </div>
            ) : vendorData?.items.length === 0 ? (
                <Empty
                    title="등록된 업체가 없습니다"
                    description="다른 카테고리를 선택하거나 필터를 변경해 보세요"
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {vendorData?.items.map((vendor) => (
                            <VendorCard
                                key={vendor.id}
                                vendor={vendor}
                                isFavorited={favorites.includes(vendor.id)}
                            />
                        ))}
                    </div>

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
