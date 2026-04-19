"use client";

import Image from "next/image";
import { CATEGORY_ICON_PATHS } from "@/lib/constants/assets";
import { RichContent } from "@/components/ui/RichEditor/RichContent";
import type { VendorDetail } from "@/lib/schema/vendor";

interface ServiceIntroTabProps {
    vendor: VendorDetail;
}

export function ServiceIntroTab({ vendor }: ServiceIntroTabProps) {
    return (
        <div>
            <h2 className="text-xl font-bold text-content-primary mb-4">서비스 소개</h2>

            {/* Description */}
            {vendor.description ? (
                <RichContent html={vendor.description} className="text-gray-700 leading-relaxed" />
            ) : (
                <p className="text-gray-400">등록된 서비스 소개가 없습니다.</p>
            )}

            {/* Category highlights */}
            {vendor.categories.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                    {vendor.categories.map((category) => {
                        const iconPath = CATEGORY_ICON_PATHS[category.slug];
                        return (
                            <div
                                key={category.id}
                                className="bg-gray-50 rounded-lg p-4 flex items-center gap-3"
                            >
                                {iconPath ? (
                                    <Image
                                        src={iconPath}
                                        alt={category.name}
                                        width={40}
                                        height={40}
                                        className="shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-content-primary truncate">
                                        {category.name}
                                    </p>
                                    {category.depth > 1 && (
                                        <p className="text-xs text-gray-500">
                                            하위 카테고리
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
