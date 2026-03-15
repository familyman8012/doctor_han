"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Button } from "@/components/ui/Button/button";
import { ProductCard } from "@/components/widgets/ProductCard";
import type { ProductListItem } from "@/lib/schema/product";

interface RecentViewItem {
    lastViewedAt: string;
    viewCount: number;
    product: ProductListItem;
}

export default function MyRecentViewsPage() {
    const router = useRouter();

    const { data, isLoading } = useQuery({
        queryKey: ["product-recent-views"],
        queryFn: async (): Promise<RecentViewItem[]> => {
            const res = await api.get<{ data: { items: RecentViewItem[] } }>(
                "/api/product-recent-views?limit=50",
            );
            return res.data.data.items;
        },
    });

    const items = data ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                    <Clock className="w-6 h-6 text-primary" />
                    최근 본 상품
                </h1>
                <p className="text-gray-500 mt-1">
                    {items.length}개의 상품을 최근에 확인했습니다
                </p>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-20">
                    <Spinner size="lg" />
                </div>
            )}

            {!isLoading && items.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 py-16">
                    <Empty
                        Icon={<Clock className="w-8 h-8" />}
                        title="최근 본 상품이 없습니다"
                        description="상품을 둘러보고 관심 있는 상품을 확인해 보세요"
                    />
                    <div className="flex justify-center mt-6">
                        <Button
                            variant="primary"
                            onClick={() => router.push("/categories")}
                        >
                            상품 둘러보기
                        </Button>
                    </div>
                </div>
            )}

            {!isLoading && items.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((item) => (
                        <ProductCard
                            key={item.product.id}
                            product={item.product}
                            showFavoriteButton={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
