"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { ChevronRight, Building2 } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { ProductCard } from "@/components/widgets/ProductCard";
import { SimplePagination } from "@/app/(main)/categories/[slug]/components/SimplePagination";
import type { ProductListItem } from "@/lib/schema/product";

const PAGE_SIZE = 12;

export default function VendorProductsPage() {
    const params = useParams();
    const vendorId = params.id as string;
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

    // 업체 기본 정보
    const { data: vendorInfo } = useQuery({
        queryKey: ["vendor", vendorId, "basic"],
        queryFn: async () => {
            const response = await api.get<{
                data: { vendor: { id: string; name: string; summary: string | null } };
            }>(`/api/vendors/${vendorId}`);
            return response.data.data.vendor;
        },
    });

    // 업체의 상품 목록
    const { data: productData, isLoading } = useQuery({
        queryKey: ["vendor-products", vendorId, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("pageSize", String(PAGE_SIZE));

            const response = await api.get<{
                data: { items: ProductListItem[]; page: number; pageSize: number; total: number };
            }>(`/api/vendors/${vendorId}/products?${params.toString()}`);
            return response.data.data;
        },
    });

    return (
        <div className="space-y-6">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/categories" className="hover:text-content-primary">
                    전체 카테고리
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-content-primary font-medium">
                    {vendorInfo?.name ?? "업체"} 상품
                </span>
            </nav>

            {/* 업체 정보 헤더 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                        <Building2 className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-content-primary">
                            {vendorInfo?.name ?? "업체"}
                        </h1>
                        {vendorInfo?.summary && (
                            <p className="text-sm text-gray-500 mt-1">{vendorInfo.summary}</p>
                        )}
                        <p className="text-sm text-gray-400 mt-1">
                            {productData?.total ?? 0}개의 상품
                        </p>
                    </div>
                </div>
            </div>

            {/* 상품 목록 */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner size="lg" />
                </div>
            ) : productData?.items.length === 0 ? (
                <Empty
                    title="등록된 상품이 없습니다"
                    description="이 업체의 상품이 아직 없습니다"
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {productData?.items.map((product) => (
                            <ProductCard key={product.id} product={product} />
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
        </div>
    );
}
