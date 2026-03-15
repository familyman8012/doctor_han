"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/lib/schema/product";
import { cn } from "@/components/utils";

interface ProductImageGalleryProps {
    images: ProductImage[];
}

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const sortedImages = [...images].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.sortOrder - b.sortOrder;
    });

    const currentImage = sortedImages[selectedIndex];
    const imageUrl = currentImage?.url || currentImage?.fileId;

    if (sortedImages.length === 0) return null;

    return (
        <div className="space-y-3">
            {/* 메인 이미지 */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={currentImage.altText || "상품 이미지"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 60vw"
                        priority
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        이미지 없음
                    </div>
                )}
            </div>

            {/* 썸네일 목록 */}
            {sortedImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {sortedImages.map((img, idx) => (
                        <button
                            key={img.id}
                            onClick={() => setSelectedIndex(idx)}
                            className={cn(
                                "relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors",
                                idx === selectedIndex
                                    ? "border-primary"
                                    : "border-transparent hover:border-gray-300"
                            )}
                        >
                            {(img.url || img.fileId) ? (
                                <Image
                                    src={img.url || img.fileId || ""}
                                    alt={img.altText || `상품 이미지 ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
