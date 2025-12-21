"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Search, X } from "lucide-react";
import api from "@/api-client/client";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { VendorCard } from "../categories/[slug]/components/VendorCard";
import { VendorFilter } from "../categories/[slug]/components/VendorFilter";
import { SimplePagination } from "../categories/[slug]/components/SimplePagination";
import type { VendorListItem } from "@/lib/schema/vendor";

const PAGE_SIZE = 12;

export default function SearchPage() {
    // URL 상태 관리
    const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
    const [priceMin, setPriceMin] = useQueryState("priceMin", parseAsInteger);
    const [priceMax, setPriceMax] = useQueryState("priceMax", parseAsInteger);
    const [sort, setSort] = useQueryState("sort", parseAsString.withDefault("newest"));

    // 찜 목록 조회
    const { data: favorites = [] } = useQuery({
        queryKey: ["favorites"],
        queryFn: async (): Promise<string[]> => {
            const response = await api.get<{ data: { items: { vendorId: string }[] } }>("/api/favorites");
            return response.data.data.items.map((f) => f.vendorId);
        },
        staleTime: 60 * 1000,
    });

    // 업체 검색
    const { data: vendorData, isLoading } = useQuery({
        queryKey: ["vendors", "search", q, page, priceMin, priceMax, sort],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
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
        enabled: q.length > 0,
    });

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const searchQuery = formData.get("search") as string;
        setQ(searchQuery.trim());
        setPage(1);
    };

    const handleReset = () => {
        setPriceMin(null);
        setPriceMax(null);
        setSort("newest");
        setPage(1);
    };

    const isFiltered = priceMin !== null || priceMax !== null || sort !== "newest";

    return (
        <div className="space-y-6">
            {/* 검색 헤더 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h1 className="text-2xl font-bold text-[#0a3b41] mb-4">업체 검색</h1>
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="flex-1 relative">
                        <Input
                            name="search"
                            defaultValue={q}
                            placeholder="업체명, 서비스, 키워드로 검색"
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
                            onClick={() => { setQ(keyword); setPage(1); }}
                            className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-600 hover:bg-[#62e3d5]/20 hover:text-[#0a3b41] transition-colors"
                        >
                            {keyword}
                        </button>
                    ))}
                </div>
            </div>

            {/* 검색 결과 */}
            {q && (
                <>
                    {/* 검색어 표시 */}
                    <div className="flex items-center justify-between">
                        <p className="text-gray-600">
                            <span className="font-medium text-[#0a3b41]">"{q}"</span> 검색 결과
                            {vendorData && (
                                <span className="ml-2 text-gray-400">
                                    ({vendorData.total}개)
                                </span>
                            )}
                        </p>
                        <button
                            type="button"
                            onClick={() => setQ("")}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-4 h-4" />
                            검색어 지우기
                        </button>
                    </div>

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

                    {/* 결과 리스트 */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Spinner size="lg" />
                        </div>
                    ) : vendorData?.items.length === 0 ? (
                        <Empty
                            title="검색 결과가 없습니다"
                            description="다른 키워드로 검색하거나 필터를 변경해 보세요"
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
                </>
            )}

            {/* 검색어 없을 때 */}
            {!q && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-medium text-gray-700 mb-2">
                        원하는 업체를 검색해 보세요
                    </h2>
                    <p className="text-gray-500">
                        업체명, 서비스명, 키워드로 검색할 수 있습니다
                    </p>
                </div>
            )}
        </div>
    );
}
