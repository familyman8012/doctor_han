"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { cn } from "@/components/utils";
import { formatPriceCompact } from "@/lib/utils/format";
import { VendorCardThumbnail } from "./VendorCardThumbnail";
import { VendorCardBadges } from "./VendorCardBadges";
import { VendorCardFavoriteButton } from "./VendorCardFavoriteButton";
import type { VendorCardProps } from "./types";

export function VendorCard({
    vendor,
    variant = "grid",
    categorySlug,
    isFavorited = false,
    showFavoriteButton,
}: VendorCardProps) {
    const showFav = showFavoriteButton ?? variant === "grid";
    const isCarousel = variant === "carousel";
    const isList = variant === "list";

    const getRegion = () => {
        if (vendor.regionPrimary && vendor.regionSecondary) {
            return `${vendor.regionPrimary} ${vendor.regionSecondary}`;
        }
        return vendor.regionPrimary || vendor.regionSecondary || "전국";
    };

    const categoryTags = vendor.categories
        ?.filter((c) => c.depth === 2)
        .slice(0, 3) ?? [];

    const resolvedCategorySlug =
        categorySlug ?? vendor.categories?.find((c) => c.depth === 1)?.slug;

    if (isList) {
        return (
            <Link
                href={`/vendors/${vendor.id}`}
                className="group flex flex-row bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/60"
                aria-label={`${vendor.name} 상세보기`}
            >
                {/* Left: Thumbnail - fixed width */}
                <div className="relative w-48 md:w-56 shrink-0">
                    <VendorCardThumbnail
                        vendorName={vendor.name}
                        ratingAvg={vendor.ratingAvg}
                        reviewCount={vendor.reviewCount}
                        thumbnail={vendor.thumbnail}
                        categorySlug={resolvedCategorySlug}
                    />
                    {showFav && (
                        <VendorCardFavoriteButton
                            vendorId={vendor.id}
                            isFavorited={isFavorited}
                        />
                    )}
                </div>

                {/* Right: Content - dense info */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div className="space-y-1.5">
                        <VendorCardBadges badges={vendor.badges} />
                        <h3 className="font-bold text-base text-gray-900 line-clamp-1 group-hover:text-primary-800 transition-colors">
                            {vendor.name}
                        </h3>
                        {vendor.summary && (
                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                {vendor.summary}
                            </p>
                        )}
                        {categoryTags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {categoryTags.map((c) => (
                                    <span
                                        key={c.id}
                                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-content-primary"
                                    >
                                        {c.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{getRegion()}</span>
                        </div>
                        {vendor.ratingAvg && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span>{vendor.ratingAvg.toFixed(1)}</span>
                                <span>({vendor.reviewCount})</span>
                            </div>
                        )}
                        <div className="ml-auto font-bold text-base text-content-primary">
                            {formatPriceCompact(vendor.priceMin, vendor.priceMax)}
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/vendors/${vendor.id}`}
            className={cn(
                "group block bg-white rounded-xl border border-gray-100 overflow-hidden",
                "transition-all duration-300 hover:shadow-lg hover:border-primary/60",
                isCarousel && "flex-shrink-0 w-[220px] md:w-[260px]",
            )}
            aria-label={`${vendor.name} 상세보기`}
        >
            {/* Thumbnail */}
            <div className="relative">
                <VendorCardThumbnail
                    vendorName={vendor.name}
                    ratingAvg={vendor.ratingAvg}
                    reviewCount={vendor.reviewCount}
                    thumbnail={vendor.thumbnail}
                    categorySlug={resolvedCategorySlug}
                />
                {showFav && (
                    <VendorCardFavoriteButton
                        vendorId={vendor.id}
                        isFavorited={isFavorited}
                    />
                )}
            </div>

            {/* Content */}
            <div className={cn("space-y-1.5", isCarousel ? "p-3" : "p-4")}>
                {/* Badges */}
                <VendorCardBadges badges={vendor.badges} />

                {/* Name */}
                <h3
                    className={cn(
                        "font-bold text-gray-900 line-clamp-1 group-hover:text-primary-800 transition-colors",
                        isCarousel ? "text-sm" : "text-base",
                    )}
                >
                    {vendor.name}
                </h3>

                {/* Summary */}
                {vendor.summary && (
                    <p className={cn(
                        "text-gray-500 line-clamp-2 leading-relaxed",
                        isCarousel ? "text-xs" : "text-sm",
                    )}>
                        {vendor.summary}
                    </p>
                )}

                {/* Category service tags */}
                {categoryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {categoryTags.map((c) => (
                            <span
                                key={c.id}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-content-primary"
                            >
                                {c.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Region */}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{getRegion()}</span>
                </div>

                {/* Price */}
                <div className={cn(
                    "font-bold text-content-primary",
                    isCarousel ? "text-sm" : "text-base",
                )}>
                    {formatPriceCompact(vendor.priceMin, vendor.priceMax)}
                </div>
            </div>
        </Link>
    );
}
