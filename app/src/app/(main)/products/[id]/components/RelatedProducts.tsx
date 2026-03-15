"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import api from "@/api-client/client";
import { ProductCard } from "@/components/widgets/ProductCard/ProductCard";
import type { ProductListItem } from "@/lib/schema/product";

interface RelatedProductsProps {
    categoryId: string;
    currentProductId: string;
    categorySlug?: string | null;
}

export function RelatedProducts({ categoryId, currentProductId, categorySlug }: RelatedProductsProps) {
    const { data } = useQuery({
        queryKey: ["products", "related", categoryId, currentProductId],
        queryFn: async () => {
            const params = new URLSearchParams({
                categoryId,
                pageSize: "5",
                sort: "popular",
            });
            const response = await api.get<{
                data: { items: ProductListItem[] };
            }>(`/api/products?${params.toString()}`);
            return response.data.data.items;
        },
    });

    const items = (data ?? []).filter((p) => p.id !== currentProductId).slice(0, 4);

    if (items.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-content-primary">같은 카테고리 상품</h2>
                {categorySlug && (
                    <Link
                        href={`/categories/${categorySlug}`}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                        더 보기
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        showFavoriteButton={false}
                    />
                ))}
            </div>
        </section>
    );
}
