"use client";

import Link from "next/link";
import { ChevronRight, Star, Image as ImageIcon } from "lucide-react";
import type { HomeVendorCarouselSection } from "@/lib/schema/home";

interface VendorSectionProps {
    section: HomeVendorCarouselSection;
    variant?: "carousel" | "grid";
}

export function VendorSection({ section, variant = "carousel" }: VendorSectionProps) {
    const viewAllHref = section.category ? `/categories/${section.category.slug}` : "/categories";

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                <Link
                    href={viewAllHref}
                    className="text-sm text-gray-500 hover:text-[#0a3b41] flex items-center gap-1"
                >
                    더보기 <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {variant === "carousel" ? (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {section.items.map((vendor) => (
                        <VendorCard key={vendor.id} vendor={vendor} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {section.items.slice(0, 8).map((vendor) => (
                        <VendorCardGrid key={vendor.id} vendor={vendor} />
                    ))}
                </div>
            )}
        </section>
    );
}

type VendorItem = HomeVendorCarouselSection["items"][number];

function VendorCard({ vendor }: { vendor: VendorItem }) {
    const thumbnailSrc = vendor.thumbnail?.fileId
        ? `/api/files/open?fileId=${vendor.thumbnail.fileId}`
        : vendor.thumbnail?.url || null;

    return (
        <Link
            href={`/vendors/${vendor.id}`}
            className="group flex-shrink-0 w-[220px] md:w-[260px] bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#62e3d5] transition-all"
        >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                {thumbnailSrc ? (
                    <img
                        src={thumbnailSrc}
                        alt={vendor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-gray-300" />
                    </div>
                )}

                {/* Rating Badge */}
                {typeof vendor.ratingAvg === "number" && vendor.ratingAvg > 0 && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-white font-medium">{vendor.ratingAvg.toFixed(1)}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 space-y-1.5">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-[#0a3b41]">
                    {vendor.name}
                </h3>

                {vendor.summary && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{vendor.summary}</p>
                )}

                <div className="flex flex-wrap gap-1">
                    {vendor.categories
                        .filter((c) => c.depth === 2)
                        .slice(0, 2)
                        .map((c) => (
                            <span
                                key={c.id}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[#62e3d5]/10 text-[#0a3b41]"
                            >
                                {c.name}
                            </span>
                        ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>{vendor.regionPrimary || "전국"}</span>
                    <span className="text-[#0a3b41] font-medium">{formatPrice(vendor.priceMin, vendor.priceMax)}</span>
                </div>
            </div>
        </Link>
    );
}

function VendorCardGrid({ vendor }: { vendor: VendorItem }) {
    const thumbnailSrc = vendor.thumbnail?.fileId
        ? `/api/files/open?fileId=${vendor.thumbnail.fileId}`
        : vendor.thumbnail?.url || null;

    return (
        <Link
            href={`/vendors/${vendor.id}`}
            className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[#62e3d5] transition-all"
        >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                {thumbnailSrc ? (
                    <img
                        src={thumbnailSrc}
                        alt={vendor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                )}

                {/* Rating Badge */}
                {typeof vendor.ratingAvg === "number" && vendor.ratingAvg > 0 && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-white font-medium">{vendor.ratingAvg.toFixed(1)}</span>
                    </div>
                )}

                {/* Review Count */}
                {vendor.reviewCount > 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 rounded text-xs text-gray-600">
                        리뷰 {vendor.reviewCount}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 space-y-1">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{vendor.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-1">{vendor.summary || vendor.regionPrimary || "전국"}</p>
                <p className="text-xs text-[#0a3b41] font-semibold">{formatPrice(vendor.priceMin, vendor.priceMax)}</p>
            </div>
        </Link>
    );
}

function formatPrice(priceMin: number | null, priceMax: number | null): string {
    if (priceMin === null && priceMax === null) return "가격 문의";
    if (priceMin === null) return `~${priceMax?.toLocaleString()}원`;
    if (priceMax === null) return `${priceMin.toLocaleString()}원~`;
    if (priceMin === priceMax) return `${priceMin.toLocaleString()}원`;
    return `${priceMin.toLocaleString()}~${priceMax.toLocaleString()}원`;
}
