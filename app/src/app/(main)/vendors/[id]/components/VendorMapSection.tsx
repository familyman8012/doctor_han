"use client";

import { MapPin } from "lucide-react";
import { KakaoMap } from "@/components/widgets/KakaoMap";
import { DirectionsLink } from "@/components/widgets/DirectionsLink";
import type { VendorDetail } from "@/lib/schema/vendor";

interface VendorMapSectionProps {
    vendor: VendorDetail;
}

export function VendorMapSection({ vendor }: VendorMapSectionProps) {
    const hasAddress = vendor.roadAddress || vendor.jibunAddress;
    const hasCoords = vendor.latitude !== null && vendor.longitude !== null;

    // No address at all -- don't render
    if (!hasAddress && !hasCoords) {
        return null;
    }

    const displayAddress = vendor.roadAddress || vendor.jibunAddress;

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-content-primary mb-4">위치 정보</h2>

            {/* Map */}
            {hasCoords && (
                <div className="mb-4">
                    <KakaoMap
                        latitude={vendor.latitude!}
                        longitude={vendor.longitude!}
                        label={vendor.name}
                    />
                </div>
            )}

            {/* Address text */}
            {displayAddress && (
                <div className="flex items-start gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-gray-700">
                        <p>{displayAddress}</p>
                        {vendor.addressDetail && (
                            <p className="text-gray-500">{vendor.addressDetail}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Directions links */}
            {hasCoords && (
                <div className="mt-4">
                    <DirectionsLink
                        name={vendor.name}
                        latitude={vendor.latitude!}
                        longitude={vendor.longitude!}
                    />
                </div>
            )}
        </div>
    );
}
