import Image from "next/image";
import { Star } from "lucide-react";
import { VENDOR_DEFAULT_THUMBNAILS } from "@/lib/constants/assets";

interface VendorCardThumbnailProps {
    vendorName: string;
    ratingAvg: number | null;
    reviewCount: number;
    thumbnail?: { fileId: string | null; url: string | null } | null;
    categorySlug?: string;
}

export function VendorCardThumbnail({
    vendorName,
    ratingAvg,
    reviewCount,
    thumbnail,
    categorySlug,
}: VendorCardThumbnailProps) {
    const thumbnailSrc = thumbnail?.fileId
        ? `/api/files/open?fileId=${thumbnail.fileId}`
        : thumbnail?.url || null;

    const defaultSrc = categorySlug ? VENDOR_DEFAULT_THUMBNAILS[categorySlug] : null;
    const imageSrc = thumbnailSrc || defaultSrc;

    return (
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
            {imageSrc ? (
                <Image
                    src={imageSrc}
                    alt={vendorName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                    <span className="text-4xl text-primary-200 select-none" aria-hidden="true">
                        🏢
                    </span>
                </div>
            )}

            {/* Rating badge overlay */}
            {typeof ratingAvg === "number" && ratingAvg > 0 && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-white font-medium">
                        {ratingAvg.toFixed(1)}
                    </span>
                    {reviewCount > 0 && (
                        <span className="text-[10px] text-white/70">({reviewCount})</span>
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
        </div>
    );
}
