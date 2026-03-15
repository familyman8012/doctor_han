"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import { useState } from "react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Button } from "@/components/ui/Button/button";
import { Tabs } from "@/components/ui/Tab/Tab";
import { VendorCard } from "@/components/widgets/VendorCard";
import { ProductCard } from "@/components/widgets/ProductCard";
import type { VendorListItem } from "@/lib/schema/vendor";
import type { ProductListItem } from "@/lib/schema/product";
import { toast } from "sonner";

interface VendorFavoriteItem {
    createdAt: string;
    vendor: VendorListItem;
}

interface ProductFavoriteItem {
    createdAt: string;
    product: ProductListItem;
}

const TAB_OPTIONS = [
    { title: "업체" },
    { title: "상품" },
];

export default function MyFavoritesPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [tabIndex, setTabIndex] = useState(0);

    // 업체 찜 목록
    const { data: vendorFavoritesData, isLoading: vendorLoading } = useQuery({
        queryKey: ["favorites", "list"],
        queryFn: async (): Promise<VendorFavoriteItem[]> => {
            const res = await api.get<{ data: { items: VendorFavoriteItem[] } }>("/api/favorites");
            return res.data.data.items;
        },
    });

    // 상품 찜 목록
    const { data: productFavoritesData, isLoading: productLoading } = useQuery({
        queryKey: ["product-favorites", "list"],
        queryFn: async (): Promise<ProductFavoriteItem[]> => {
            const res = await api.get<{ data: { items: ProductFavoriteItem[] } }>("/api/product-favorites");
            return res.data.data.items;
        },
        enabled: tabIndex === 1,
    });

    // 업체 찜 해제
    const vendorToggleMutation = useMutation({
        mutationFn: async (vendorId: string) => {
            await api.post("/api/favorites/toggle", { vendorId });
        },
        onSuccess: () => {
            toast.success("찜 목록에서 삭제되었습니다");
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
        },
    });

    // 상품 찜 해제
    const productToggleMutation = useMutation({
        mutationFn: async (productId: string) => {
            await api.post("/api/product-favorites/toggle", { productId });
        },
        onSuccess: () => {
            toast.success("찜 목록에서 삭제되었습니다");
            queryClient.invalidateQueries({ queryKey: ["product-favorites"] });
        },
    });

    const isLoading = tabIndex === 0 ? vendorLoading : productLoading;
    const favoriteVendorIds = vendorFavoritesData?.map((f) => f.vendor.id) ?? [];

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <Heart className="w-6 h-6 text-primary" />
                        찜 목록
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {tabIndex === 0
                            ? `${vendorFavoritesData?.length ?? 0}개의 업체를 찜했습니다`
                            : `${productFavoritesData?.length ?? 0}개의 상품을 찜했습니다`}
                    </p>
                </div>
            </div>

            {/* 탭 */}
            <Tabs
                id="mypage-favorites-tabs"
                tabs={TAB_OPTIONS}
                activeTabIndex={tabIndex}
                onTabChange={setTabIndex}
            />

            {isLoading && (
                <div className="flex justify-center items-center py-20">
                    <Spinner size="lg" />
                </div>
            )}

            {/* 업체 탭 */}
            {!isLoading && tabIndex === 0 && (
                <>
                    {vendorFavoritesData?.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 py-16">
                            <Empty
                                Icon={<Heart className="w-8 h-8" />}
                                title="찜한 업체가 없습니다"
                                description="마음에 드는 업체를 찜해 보세요"
                            />
                            <div className="flex justify-center mt-6">
                                <Button
                                    variant="primary"
                                    onClick={() => router.push("/categories")}
                                >
                                    업체 둘러보기
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {vendorFavoritesData?.map((item) => (
                                <div key={item.vendor.id} className="relative group">
                                    <VendorCard
                                        vendor={item.vendor}
                                        isFavorited={favoriteVendorIds.includes(item.vendor.id)}
                                        showFavoriteButton={false}
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            vendorToggleMutation.mutate(item.vendor.id);
                                        }}
                                        disabled={vendorToggleMutation.isPending}
                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* 상품 탭 */}
            {!isLoading && tabIndex === 1 && (
                <>
                    {productFavoritesData?.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 py-16">
                            <Empty
                                Icon={<Heart className="w-8 h-8" />}
                                title="찜한 상품이 없습니다"
                                description="마음에 드는 상품을 찜해 보세요"
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
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {productFavoritesData?.map((item) => (
                                <div key={item.product.id} className="relative group">
                                    <ProductCard
                                        product={item.product}
                                        isFavorited={true}
                                        showFavoriteButton={false}
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            productToggleMutation.mutate(item.product.id);
                                        }}
                                        disabled={productToggleMutation.isPending}
                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
