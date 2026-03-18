"use client";

import { MapPin, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/Badge/Badge";
import { KakaoMap } from "@/components/widgets/KakaoMap";
import { DirectionsLink } from "@/components/widgets/DirectionsLink";
import type { VendorDetail } from "@/lib/schema/vendor";
import dayjs from "dayjs";

interface VendorInfoTabProps {
    vendor: VendorDetail;
}

export function VendorInfoTab({ vendor }: VendorInfoTabProps) {
    const hasCoords = vendor.latitude !== null && vendor.longitude !== null;
    const displayAddress = vendor.roadAddress || vendor.jibunAddress;

    return (
        <div>
            <h2 className="text-xl font-bold text-content-primary mb-4">업체 정보</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column: Basic info */}
                <div className="space-y-4">
                    {/* Registration date */}
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500">가입일</p>
                            <p className="text-sm text-gray-700">
                                {dayjs(vendor.createdAt).format("YYYY년 MM월")}
                            </p>
                        </div>
                    </div>

                    {/* Service categories */}
                    {vendor.categories.length > 0 && (
                        <div className="flex items-start gap-3">
                            <Tag className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500 mb-1">서비스 분야</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {vendor.categories.map((cat) => (
                                        <Badge key={cat.id} color="teal" size="xs">
                                            {cat.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Address */}
                    {displayAddress && (
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">지역</p>
                                <p className="text-sm text-gray-700">{displayAddress}</p>
                                {vendor.addressDetail && (
                                    <p className="text-sm text-gray-500">{vendor.addressDetail}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column: Map */}
                <div>
                    {hasCoords ? (
                        <div>
                            <KakaoMap
                                latitude={vendor.latitude!}
                                longitude={vendor.longitude!}
                                label={vendor.name}
                            />
                            <div className="mt-3">
                                <DirectionsLink
                                    name={vendor.name}
                                    latitude={vendor.latitude!}
                                    longitude={vendor.longitude!}
                                />
                            </div>
                        </div>
                    ) : displayAddress ? (
                        <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">{displayAddress}</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
