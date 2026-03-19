"use client";

import { Star, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge/Badge";
import { VendorBadgeList } from "@/components/widgets/VendorBadgeList";
import type { VendorDetail } from "@/lib/schema/vendor";

interface HeroInfoProps {
    vendor: VendorDetail;
}

export function HeroInfo({ vendor }: HeroInfoProps) {
    const getRegion = () => {
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
        <div>
            {/* Category badges */}
            <div className="flex flex-wrap gap-2 mb-3">
                {vendor.categories.map((category) => (
                    <Badge key={category.id} color="teal" size="sm">
                        {category.name}
                    </Badge>
                ))}
            </div>

            {/* Vendor name */}
            <h1 className="text-2xl font-bold text-content-primary mb-2">
                {vendor.name}
            </h1>

            {/* Vendor badges */}
            {vendor.badges.length > 0 && (
                <VendorBadgeList badges={vendor.badges} size="default" className="mb-2" />
            )}

            {/* Summary */}
            {vendor.summary && (
                <p className="text-gray-600 mb-4">{vendor.summary}</p>
            )}

            {/* Rating & review count */}
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
                            ({vendor.reviewCount}개)
                        </span>
                    </div>
                ) : (
                    <span className="text-gray-400">아직 리뷰가 없습니다</span>
                )}
            </div>

            {/* Region */}
            <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{getRegion()}</span>
            </div>
        </div>
    );
}
