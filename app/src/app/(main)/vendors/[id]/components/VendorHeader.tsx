"use client";

import Image from "next/image";
import { Star, MapPin, Heart, Share2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button/button";
import { Badge } from "@/components/ui/Badge/Badge";
import { cn } from "@/components/utils";
import { VendorBadgeList } from "@/components/widgets/VendorBadgeList";
import api from "@/api-client/client";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";
import type { VendorDetail } from "@/lib/schema/vendor";
import { VENDOR_DEFAULT_THUMBNAILS } from "@/lib/constants/assets";

interface VendorHeaderProps {
    vendor: VendorDetail;
    isFavorited: boolean;
}

export function VendorHeader({ vendor, isFavorited }: VendorHeaderProps) {
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const queryClient = useQueryClient();

    const favoriteMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post<{ data: { vendorId: string; isFavorited: boolean } }>("/api/favorites/toggle", {
                vendorId: vendor.id,
            });
            return response.data.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
            queryClient.invalidateQueries({ queryKey: ["vendor", vendor.id] });
            toast.success(data.isFavorited ? "찜 목록에 추가되었습니다" : "찜 목록에서 삭제되었습니다");
        },
    });

    const handleFavoriteClick = () => {
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

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("링크가 복사되었습니다");
        } catch {
            toast.error("링크 복사에 실패했습니다");
        }
    };

    const formatPrice = (min: number | null, max: number | null) => {
        if (min === null && max === null) return "가격 문의";
        if (min === null) return `~${max?.toLocaleString()}원`;
        if (max === null) return `${min.toLocaleString()}원~`;
        if (min === max) return `${min.toLocaleString()}원`;
        return `${min.toLocaleString()}~${max.toLocaleString()}원`;
    };

    const getRegion = () => {
        // Prefer structured address over free-text region
        if (vendor.roadAddress) {
            return vendor.addressDetail
                ? `${vendor.roadAddress} ${vendor.addressDetail}`
                : vendor.roadAddress;
        }
        if (vendor.jibunAddress) {
            return vendor.addressDetail
                ? `${vendor.jibunAddress} ${vendor.addressDetail}`
                : vendor.jibunAddress;
        }
        if (vendor.regionPrimary && vendor.regionSecondary) {
            return `${vendor.regionPrimary} ${vendor.regionSecondary}`;
        }
        return vendor.regionPrimary || vendor.regionSecondary || "전국";
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* 썸네일 */}
            <div className="relative aspect-[3/1] bg-gradient-to-br from-primary-900 to-primary-800 overflow-hidden">
                {(() => {
                    const categorySlug = vendor.categories.find((c) => c.depth === 1)?.slug;
                    const defaultImg = categorySlug ? VENDOR_DEFAULT_THUMBNAILS[categorySlug] : null;
                    return defaultImg ? (
                        <>
                            <Image
                                src={defaultImg}
                                alt=""
                                fill
                                className="object-cover opacity-40"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/60 to-transparent" />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-6xl text-white/20">
                            🏢
                        </div>
                    );
                })()}
            </div>

            {/* 정보 영역 */}
            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                        {/* 카테고리 */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {vendor.categories.map((category) => (
                                <Badge key={category.id} color="teal" size="sm">
                                    {category.name}
                                </Badge>
                            ))}
                        </div>

                        {/* 업체명 */}
                        <h1 className="text-2xl font-bold text-content-primary mb-2">
                            {vendor.name}
                        </h1>

                        {/* 배지 */}
                        {vendor.badges.length > 0 && (
                            <VendorBadgeList badges={vendor.badges} size="default" className="mb-2" />
                        )}

                        {/* 소개 */}
                        {vendor.summary && (
                            <p className="text-gray-600 mb-4">{vendor.summary}</p>
                        )}

                        {/* 평점 & 리뷰 */}
                        <div className="flex items-center gap-4 mb-3">
                            {vendor.ratingAvg !== null && vendor.ratingAvg > 0 ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        <span className="text-lg font-bold text-content-primary">
                                            {vendor.ratingAvg.toFixed(1)}
                                        </span>
                                    </div>
                                    <span className="text-gray-500">
                                        리뷰 {vendor.reviewCount}개
                                    </span>
                                </div>
                            ) : (
                                <span className="text-gray-400">아직 리뷰가 없습니다</span>
                            )}
                        </div>

                        {/* 지역 */}
                        <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{getRegion()}</span>
                        </div>
                    </div>

                    {/* 가격 & 액션 */}
                    <div className="flex flex-col items-end gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">서비스 가격</p>
                            <p className="text-2xl font-bold text-content-primary">
                                {formatPrice(vendor.priceMin, vendor.priceMax)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghostSecondary"
                                size="md"
                                onClick={handleShare}
                                IconOnly={<Share2 className="w-5 h-5" />}
                            />
                            <Button
                                variant={isFavorited ? "danger" : "ghostSecondary"}
                                size="md"
                                onClick={handleFavoriteClick}
                                LeadingIcon={
                                    <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
                                }
                            >
                                {isFavorited ? "찜 해제" : "찜하기"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
