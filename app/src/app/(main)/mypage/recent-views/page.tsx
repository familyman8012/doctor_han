"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, Search, X } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { ProductCard } from "@/components/widgets/ProductCard";
import type { ProductListItem } from "@/lib/schema/product";

interface RecentViewItem {
    lastViewedAt: string;
    viewCount: number;
    product: ProductListItem;
}

export default function MyRecentViewsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [searchText, setSearchText] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["product-recent-views"],
        queryFn: async (): Promise<RecentViewItem[]> => {
            const res = await api.get<{ data: { items: RecentViewItem[] } }>(
                "/api/product-recent-views?limit=50",
            );
            return res.data.data.items;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (productId: string) => {
            await api.delete("/api/product-recent-views", { data: { productId } });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product-recent-views"] });
            toast.success("삭제되었습니다");
        },
    });

    const items = data ?? [];

    const filtered = useMemo(() => {
        if (!searchText.trim()) return items;
        const q = searchText.trim().toLowerCase();
        return items.filter(
            (item) =>
                item.product.title.toLowerCase().includes(q) ||
                item.product.vendor.name.toLowerCase().includes(q),
        );
    }, [items, searchText]);

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

            {/* 검색 */}
            {items.length > 0 && (
                <Input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="상품명, 업체명으로 검색"
                    size="sm"
                    LeadingIcon={<Search className="w-4 h-4" />}
                />
            )}

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

            {!isLoading && items.length > 0 && filtered.length === 0 && (
                <Empty
                    title="검색 결과가 없습니다"
                    description="다른 키워드로 검색해보세요"
                />
            )}

            {!isLoading && filtered.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filtered.map((item) => (
                        <div key={item.product.id} className="relative group">
                            <ProductCard
                                product={item.product}
                                showFavoriteButton={false}
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteMutation.mutate(item.product.id);
                                }}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 z-10"
                                title="삭제"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
