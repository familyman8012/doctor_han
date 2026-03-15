"use client";

import Image from "next/image";
import { Star, Eye, MessageSquare, Heart, Share2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button/button";
import { Badge } from "@/components/ui/Badge/Badge";
import { cn } from "@/components/utils";
import { VendorBadgeList } from "@/components/widgets/VendorBadgeList";
import api from "@/api-client/client";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";
import type { ProductDetail } from "@/lib/schema/product";
import type { VendorBadge } from "@/lib/schema/badge";
import { CATEGORY_BG_PATHS, VENDOR_DEFAULT_THUMBNAILS } from "@/lib/constants/assets";
import { formatProductPrice } from "@/lib/utils/product-price";

interface ProductHeroProps {
    product: ProductDetail;
    isFavorited: boolean;
}

// Price formatting uses shared utility


export function ProductHero({ product, isFavorited }: ProductHeroProps) {
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const queryClient = useQueryClient();

    const favoriteMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post<{ data: { productId: string; isFavorited: boolean } }>(
                "/api/product-favorites/toggle",
                { productId: product.id },
            );
            return response.data.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["product-favorites"] });
            queryClient.invalidateQueries({ queryKey: ["product", product.id] });
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

    // Background image: category BG → vendor default → gradient only
    const bgImage =
        (product.categorySlug ? CATEGORY_BG_PATHS[product.categorySlug] : null) ??
        (product.categorySlug ? VENDOR_DEFAULT_THUMBNAILS[product.categorySlug] : null);

    const vendorBadges = (product.vendor.badges ?? []) as VendorBadge[];

    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Banner */}
            <div className="relative aspect-[3/1] bg-gradient-to-br from-primary-900 to-primary-800 overflow-hidden">
                {bgImage ? (
                    <>
                        <Image src={bgImage} alt="" fill className="object-cover opacity-40" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/60 to-transparent" />
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl text-white/20">
                        {"📦"}
                    </div>
                )}
            </div>

            {/* Info area */}
            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                        {/* Category + vendor badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {product.categoryName && (
                                <Badge color="teal" size="sm">
                                    {product.categoryName}
                                </Badge>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-content-primary mb-2">
                            {product.title}
                        </h1>

                        {/* Vendor badges */}
                        {vendorBadges.length > 0 && (
                            <VendorBadgeList badges={vendorBadges} size="default" className="mb-2" />
                        )}

                        {/* Summary */}
                        {product.summary && (
                            <p className="text-gray-600 mb-4">{product.summary}</p>
                        )}

                        {/* Rating + stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            {product.ratingAvg !== null && product.ratingAvg > 0 ? (
                                <div className="flex items-center gap-1">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="text-lg font-bold text-content-primary">
                                        {product.ratingAvg.toFixed(1)}
                                    </span>
                                    <span>리뷰 {product.reviewCount}개</span>
                                </div>
                            ) : (
                                <span className="text-gray-400">아직 리뷰가 없습니다</span>
                            )}
                            <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {product.viewCount.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {product.inquiryCount.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Price + actions */}
                    <div className="flex flex-col items-end gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">상품 가격</p>
                            <p className="text-2xl font-bold text-content-primary">
                                {formatProductPrice(product)}
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
