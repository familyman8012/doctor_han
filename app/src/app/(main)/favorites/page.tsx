"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useState } from "react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Button } from "@/components/ui/Button/button";
import { Tabs } from "@/components/ui/Tab/Tab";
import { VendorCard } from "../categories/[slug]/components/VendorCard";
import { ProductCard } from "@/components/widgets/ProductCard";
import { useIsAuthenticated } from "@/stores/auth";
import type { VendorListItem } from "@/lib/schema/vendor";
import type { ProductListItem } from "@/lib/schema/product";

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

export default function FavoritesPage() {
    const router = useRouter();
    const isAuthenticated = useIsAuthenticated();
    const [tabIndex, setTabIndex] = useState(0);

    // 업체 찜 목록
    const { data: vendorFavoritesData, isLoading: vendorLoading, isError: vendorError } = useQuery({
        queryKey: ["favorites", "list"],
        queryFn: async (): Promise<VendorFavoriteItem[]> => {
            const response = await api.get<{ data: { items: VendorFavoriteItem[] } }>("/api/favorites");
            return response.data.data.items;
        },
        enabled: isAuthenticated,
    });

    // 상품 찜 목록
    const { data: productFavoritesData, isLoading: productLoading, isError: productError } = useQuery({
        queryKey: ["product-favorites", "list"],
        queryFn: async (): Promise<ProductFavoriteItem[]> => {
            const response = await api.get<{ data: { items: ProductFavoriteItem[] } }>("/api/product-favorites");
            return response.data.data.items;
        },
        enabled: isAuthenticated && tabIndex === 1,
    });

    // 로그인하지 않은 경우
    if (!isAuthenticated) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Heart className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-content-primary mb-2">
                    로그인이 필요합니다
                </h2>
                <p className="text-gray-500 mb-6">
                    찜 목록을 확인하려면 로그인해 주세요
                </p>
                <Button variant="primary" size="lg" onClick={() => router.push("/login")}>
                    로그인
                </Button>
            </div>
        );
    }

    const isLoading = tabIndex === 0 ? vendorLoading : productLoading;
    const isError = tabIndex === 0 ? vendorError : productError;

    const favoriteVendorIds = vendorFavoritesData?.map((f) => f.vendor.id) ?? [];
    const favoriteProductIds = productFavoritesData?.map((f) => f.product.id) ?? [];

    const currentCount = tabIndex === 0
        ? vendorFavoritesData?.length ?? 0
        : productFavoritesData?.length ?? 0;

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-2xl font-bold text-content-primary mb-2">찜 목록</h1>
                <p className="text-gray-500">
                    {currentCount}개의 {tabIndex === 0 ? "업체" : "상품"}를 찜했습니다
                </p>
            </div>

            {/* 탭 */}
            <Tabs
                id="favorites-tabs"
                tabs={TAB_OPTIONS}
                activeTabIndex={tabIndex}
                onTabChange={setTabIndex}
            />

            {/* 로딩 */}
            {isLoading && (
                <div className="flex justify-center items-center py-20">
                    <Spinner size="lg" />
                </div>
            )}

            {/* 에러 */}
            {isError && !isLoading && (
                <div className="py-20">
                    <Empty
                        title="찜 목록을 불러올 수 없습니다"
                        description="잠시 후 다시 시도해 주세요"
                    />
                </div>
            )}

            {/* 업체 탭 */}
            {!isLoading && !isError && tabIndex === 0 && (
                <>
                    {vendorFavoritesData?.length === 0 ? (
                        <Empty
                            illustration="/images/empty/empty-favorite.svg"
                            title="찜한 업체가 없습니다"
                            description="마음에 드는 업체를 찜해 보세요"
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {vendorFavoritesData?.map((item) => (
                                <VendorCard
                                    key={item.vendor.id}
                                    vendor={item.vendor}
                                    isFavorited={favoriteVendorIds.includes(item.vendor.id)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* 상품 탭 */}
            {!isLoading && !isError && tabIndex === 1 && (
                <>
                    {productFavoritesData?.length === 0 ? (
                        <Empty
                            illustration="/images/empty/empty-favorite.svg"
                            title="찜한 상품이 없습니다"
                            description="마음에 드는 상품을 찜해 보세요"
                        />
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {productFavoritesData?.map((item) => (
                                <ProductCard
                                    key={item.product.id}
                                    product={item.product}
                                    isFavorited={favoriteProductIds.includes(item.product.id)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
