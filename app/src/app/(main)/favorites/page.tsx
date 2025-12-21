"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Button } from "@/components/ui/Button/button";
import { VendorCard } from "../categories/[slug]/components/VendorCard";
import { useIsAuthenticated } from "@/stores/auth";
import type { VendorListItem } from "@/lib/schema/vendor";

interface FavoriteItem {
    createdAt: string;
    vendor: VendorListItem;
}

export default function FavoritesPage() {
    const router = useRouter();
    const isAuthenticated = useIsAuthenticated();

    // 찜 목록 조회
    const { data: favoritesData, isLoading, isError } = useQuery({
        queryKey: ["favorites", "list"],
        queryFn: async (): Promise<FavoriteItem[]> => {
            const response = await api.get<{ data: { items: FavoriteItem[] } }>("/api/favorites");
            return response.data.data.items;
        },
        enabled: isAuthenticated,
    });

    // 로그인하지 않은 경우
    if (!isAuthenticated) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Heart className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-[#0a3b41] mb-2">
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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="py-20">
                <Empty
                    title="찜 목록을 불러올 수 없습니다"
                    description="잠시 후 다시 시도해 주세요"
                />
            </div>
        );
    }

    const favoriteVendorIds = favoritesData?.map((f) => f.vendor.id) ?? [];

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-2xl font-bold text-[#0a3b41] mb-2">찜 목록</h1>
                <p className="text-gray-500">
                    {favoritesData?.length ?? 0}개의 업체를 찜했습니다
                </p>
            </div>

            {/* 업체 리스트 */}
            {favoritesData?.length === 0 ? (
                <Empty
                    Icon={<Heart className="w-8 h-8" />}
                    title="찜한 업체가 없습니다"
                    description="마음에 드는 업체를 찜해 보세요"
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favoritesData?.map((item) => (
                        <VendorCard
                            key={item.vendor.id}
                            vendor={item.vendor}
                            isFavorited={favoriteVendorIds.includes(item.vendor.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
