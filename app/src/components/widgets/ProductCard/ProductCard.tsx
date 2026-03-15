"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/components/utils";
import api from "@/api-client/client";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";
import type { ProductListItem } from "@/lib/schema/product";
import { formatProductPrice } from "@/lib/utils/product-price";

// ============================================
// Types
// ============================================

export interface ProductCardProps {
    product: ProductListItem;
    isFavorited?: boolean;
    showFavoriteButton?: boolean;
}

// ============================================
// ProductCard
// ============================================

export function ProductCard({ product, isFavorited = false, showFavoriteButton = true }: ProductCardProps) {
    const router = useRouter();
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const queryClient = useQueryClient();

    const favoriteMutation = useMutation({
        mutationFn: async () => {
            await api.post("/api/product-favorites/toggle", { productId: product.id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product-favorites"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        if (role !== "doctor") {
            toast.error("한의사 회원만 찜할 수 있습니다");
            return;
        }
        favoriteMutation.mutate();
    };

    const thumbnailSrc = product.thumbnail || null;

    return (
        <Link
            href={`/products/${product.id}`}
            className={cn(
                "group block bg-white rounded-xl border border-gray-100 overflow-hidden",
                "transition-all duration-300 hover:shadow-lg hover:border-primary/60",
            )}
            aria-label={`${product.title} 상세보기`}
        >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                {thumbnailSrc ? (
                    <Image
                        src={thumbnailSrc}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                        <span
                            className="text-4xl text-primary-200 select-none"
                            aria-hidden="true"
                        >
                            {"📦"}
                        </span>
                    </div>
                )}

                {/* Rating badge overlay */}
                {typeof product.ratingAvg === "number" &&
                    product.ratingAvg > 0 && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-white font-medium">
                                {product.ratingAvg.toFixed(1)}
                            </span>
                            {product.reviewCount > 0 && (
                                <span className="text-[10px] text-white/70">
                                    ({product.reviewCount})
                                </span>
                            )}
                        </div>
                    )}

                {/* "상세보기" hover overlay */}
                <div
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    aria-hidden="true"
                >
                    <span className="text-white text-sm font-medium tracking-wide">
                        상세보기
                    </span>
                </div>

                {/* Favorite (heart) button */}
                {showFavoriteButton && (
                    <button
                        type="button"
                        onClick={handleFavoriteClick}
                        className={cn(
                            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center",
                            "transition-all duration-200 hover:scale-110 active:scale-95",
                            isFavorited
                                ? "bg-red-50 text-red-500"
                                : "bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50",
                        )}
                        aria-label={isFavorited ? "찜 해제" : "찜하기"}
                    >
                        <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-1.5">
                {/* Title */}
                <h3 className="font-semibold text-base text-gray-900 line-clamp-2 group-hover:text-primary-800 transition-colors">
                    {product.title}
                </h3>

                {/* Vendor name */}
                <span
                    role="link"
                    tabIndex={0}
                    className="block text-xs text-gray-500 truncate hover:text-primary-600 transition-colors cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/vendors/${product.vendorId}/products`);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/vendors/${product.vendorId}/products`);
                        }
                    }}
                >
                    {product.vendor.name}
                </span>

                {/* Summary */}
                {product.summary && (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {product.summary}
                    </p>
                )}

                {/* Rating (text version, shown when reviewCount > 0) */}
                {product.reviewCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium text-gray-700">
                            {product.ratingAvg?.toFixed(1) ?? "0.0"}
                        </span>
                        <span>({product.reviewCount}건)</span>
                    </div>
                )}

                {/* Price */}
                <div className="font-bold text-base text-content-primary">
                    {formatProductPrice(product)}
                </div>
            </div>
        </Link>
    );
}
