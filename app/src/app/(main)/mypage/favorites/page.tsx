"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Button } from "@/components/ui/Button/button";
import { VendorCard } from "../../categories/[slug]/components/VendorCard";
import type { VendorListItem } from "@/lib/schema/vendor";
import { toast } from "sonner";

interface FavoriteItem {
    createdAt: string;
    vendor: VendorListItem;
}

export default function MyFavoritesPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    // 찜 목록 조회
    const { data: favoritesData, isLoading } = useQuery({
        queryKey: ["favorites", "list"],
        queryFn: async (): Promise<FavoriteItem[]> => {
            const res = await api.get<{ data: { items: FavoriteItem[] } }>("/api/favorites");
            return res.data.data.items;
        },
    });

    // 찜 해제
    const toggleMutation = useMutation({
        mutationFn: async (vendorId: string) => {
            await api.post("/api/favorites/toggle", { vendorId });
        },
        onSuccess: () => {
            toast.success("찜 목록에서 삭제되었습니다");
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
        },
    });

    const favoriteVendorIds = favoritesData?.map((f) => f.vendor.id) ?? [];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0a3b41] flex items-center gap-2">
                        <Heart className="w-6 h-6 text-[#62e3d5]" />
                        찜 목록
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {favoritesData?.length ?? 0}개의 업체를 찜했습니다
                    </p>
                </div>
            </div>

            {/* 업체 리스트 */}
            {favoritesData?.length === 0 ? (
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
                    {favoritesData?.map((item) => (
                        <div key={item.vendor.id} className="relative group">
                            <VendorCard
                                vendor={item.vendor}
                                isFavorited={favoriteVendorIds.includes(item.vendor.id)}
                            />
                            {/* 삭제 버튼 오버레이 */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMutation.mutate(item.vendor.id);
                                }}
                                disabled={toggleMutation.isPending}
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
