"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Heart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/components/utils";
import { VendorBadgeList } from "@/components/widgets/VendorBadgeList";
import api from "@/api-client/client";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";
import { toast } from "sonner";
import { VENDOR_DEFAULT_THUMBNAILS } from "@/lib/constants/assets";
import type { VendorBadge } from "@/lib/schema/badge";

interface VendorCardProps {
    vendor: {
        id: string;
        name: string;
        summary: string | null;
        regionPrimary: string | null;
        regionSecondary: string | null;
        priceMin: number | null;
        priceMax: number | null;
        ratingAvg: number | null;
        reviewCount: number;
        badges?: VendorBadge[];
    };
    categorySlug?: string;
    isFavorited?: boolean;
}

export function VendorCard({ vendor, categorySlug, isFavorited = false }: VendorCardProps) {
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const queryClient = useQueryClient();

    const favoriteMutation = useMutation({
        mutationFn: async () => {
            await api.post("/api/favorites/toggle", { vendorId: vendor.id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
            queryClient.invalidateQueries({ queryKey: ["vendors"] });
        },
    });

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.error("로그인이 필요합니다");
            return;
        }
        if (role !== "doctor") {
            toast.error("한의사 회원만 찜할 수 있습니다");
            return;
        }
        favoriteMutation.mutate();
    };

    const formatPrice = (min: number | null, max: number | null) => {
        if (min === null && max === null) return "가격 문의";
        if (min === null) return `~${max?.toLocaleString()}원`;
        if (max === null) return `${min.toLocaleString()}원~`;
        if (min === max) return `${min.toLocaleString()}원`;
        return `${min.toLocaleString()}~${max.toLocaleString()}원`;
    };

    const getRegion = () => {
        if (vendor.regionPrimary && vendor.regionSecondary) {
            return `${vendor.regionPrimary} ${vendor.regionSecondary}`;
        }
        return vendor.regionPrimary || vendor.regionSecondary || "전국";
    };

    return (
        <Link
            href={`/vendors/${vendor.id}`}
            className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary transition-all"
        >
            {/* 썸네일 영역 */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                {categorySlug && VENDOR_DEFAULT_THUMBNAILS[categorySlug] ? (
                    <Image
                        src={VENDOR_DEFAULT_THUMBNAILS[categorySlug]}
                        alt={vendor.name}
                        fill
                        className="object-cover opacity-80"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                        <span className="text-4xl text-primary-200">🏢</span>
                    </div>
                )}
                <button
                    type="button"
                    onClick={handleFavoriteClick}
                    className={cn(
                        "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                        isFavorited
                            ? "bg-red-50 text-red-500"
                            : "bg-white/80 text-gray-400 hover:text-red-500"
                    )}
                >
                    <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
                </button>
            </div>

            {/* 정보 영역 */}
            <div className="p-4">
                <h3 className="text-lg font-bold text-content-primary mb-1 group-hover:text-primary-800 transition-colors">
                    {vendor.name}
                </h3>

                {vendor.badges && vendor.badges.length > 0 && (
                    <VendorBadgeList badges={vendor.badges} maxCount={3} size="compact" className="mb-1" />
                )}

                {vendor.summary && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {vendor.summary}
                    </p>
                )}

                {/* 평점 & 리뷰 */}
                <div className="flex items-center gap-2 mb-2">
                    {vendor.ratingAvg !== null && vendor.ratingAvg > 0 ? (
                        <>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium text-content-primary">
                                    {vendor.ratingAvg.toFixed(1)}
                                </span>
                            </div>
                            <span className="text-sm text-gray-400">
                                리뷰 {vendor.reviewCount}
                            </span>
                        </>
                    ) : (
                        <span className="text-sm text-gray-400">리뷰 없음</span>
                    )}
                </div>

                {/* 지역 */}
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{getRegion()}</span>
                </div>

                {/* 가격 */}
                <div className="text-base font-bold text-content-primary">
                    {formatPrice(vendor.priceMin, vendor.priceMax)}
                </div>
            </div>
        </Link>
    );
}
