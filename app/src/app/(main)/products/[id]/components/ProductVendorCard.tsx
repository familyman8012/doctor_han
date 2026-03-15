"use client";

import Link from "next/link";
import { Building2, Star, ChevronRight } from "lucide-react";
import { VendorBadgeList } from "@/components/widgets/VendorBadgeList";
import type { VendorBadge } from "@/lib/schema/badge";

interface ProductVendorCardProps {
    vendorId: string;
    vendorName: string;
    vendorRatingAvg?: number | null;
    vendorReviewCount?: number;
    vendorBadges?: Array<{ type: string; label: string }>;
}

export function ProductVendorCard({
    vendorId,
    vendorName,
    vendorRatingAvg,
    vendorReviewCount,
    vendorBadges,
}: ProductVendorCardProps) {
    const badges = (vendorBadges ?? []) as VendorBadge[];

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            {/* Vendor name + icon */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-content-primary truncate">{vendorName}</p>
                    {/* Rating */}
                    {vendorRatingAvg != null && vendorRatingAvg > 0 ? (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-content-primary">
                                {vendorRatingAvg.toFixed(1)}
                            </span>
                            {typeof vendorReviewCount === "number" && vendorReviewCount > 0 && (
                                <span>({vendorReviewCount}개 리뷰)</span>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400">아직 리뷰가 없습니다</p>
                    )}
                </div>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
                <VendorBadgeList badges={badges} size="compact" maxCount={3} />
            )}

            {/* Links */}
            <div className="flex gap-2 pt-1">
                <Link
                    href={`/vendors/${vendorId}`}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-sm font-medium text-primary bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                    업체 상세
                    <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                    href={`/vendors/${vendorId}/products`}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    다른 상품
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
