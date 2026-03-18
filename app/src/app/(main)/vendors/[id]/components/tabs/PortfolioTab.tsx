"use client";

import { useState, useMemo } from "react";
import { Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge/Badge";
import { Empty } from "@/components/ui/Empty/Empty";
import type { VendorPortfolio } from "@/lib/schema/vendor";
import { ImageLightbox } from "../gallery/ImageLightbox";

interface PortfolioTabProps {
    portfolios: VendorPortfolio[];
}

export function PortfolioTab({ portfolios }: PortfolioTabProps) {
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [selectedPortfolio, setSelectedPortfolio] = useState<VendorPortfolio | null>(null);
    const [currentAssetIndex, setCurrentAssetIndex] = useState(0);

    // Extract unique tags
    const allTags = useMemo(
        () => [...new Set(portfolios.flatMap((p) => p.tags))],
        [portfolios],
    );

    // Filter + sort: featured first, then by sortOrder
    const filtered = useMemo(() => {
        const items = activeTag
            ? portfolios.filter((p) => p.tags.includes(activeTag))
            : portfolios;
        return [...items].sort((a, b) => {
            if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
            return a.sortOrder - b.sortOrder;
        });
    }, [portfolios, activeTag]);

    if (portfolios.length === 0) {
        return (
            <div>
                <h2 className="text-xl font-bold text-content-primary mb-4">포트폴리오</h2>
                <Empty title="등록된 포트폴리오가 없습니다" />
            </div>
        );
    }

    const lightboxImages = selectedPortfolio
        ? selectedPortfolio.assets.map((a) => ({
              url: a.url ?? "",
              alt: selectedPortfolio.title ?? "포트폴리오",
          }))
        : [];

    return (
        <div>
            <h2 className="text-xl font-bold text-content-primary mb-4">포트폴리오</h2>

            {/* Tag filter bar */}
            {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    <Badge
                        color={activeTag === null ? "primary" : "neutral"}
                        size="sm"
                        onClick={() => setActiveTag(null)}
                        className="cursor-pointer"
                    >
                        전체
                    </Badge>
                    {allTags.map((tag) => (
                        <Badge
                            key={tag}
                            color={activeTag === tag ? "primary" : "neutral"}
                            size="sm"
                            onClick={() => setActiveTag(tag)}
                            className="cursor-pointer"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Portfolio grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filtered.map((portfolio) => (
                    <button
                        key={portfolio.id}
                        type="button"
                        onClick={() => {
                            setSelectedPortfolio(portfolio);
                            setCurrentAssetIndex(0);
                        }}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer"
                    >
                        {/* Cover image */}
                        {portfolio.assets[0]?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={portfolio.assets[0].url}
                                alt={portfolio.title || "포트폴리오"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <ImageIcon className="w-8 h-8 text-gray-300" />
                            </div>
                        )}

                        {/* Featured badge */}
                        {portfolio.isFeatured && (
                            <div className="absolute top-2 left-2">
                                <Badge color="amber" size="xs">
                                    대표 사례
                                </Badge>
                            </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <div className="w-full p-3">
                                <p className="text-sm font-medium text-white truncate">
                                    {portfolio.title || "포트폴리오"}
                                </p>
                                {portfolio.assets.length > 1 && (
                                    <p className="text-xs text-white/80">
                                        {portfolio.assets.length}장
                                    </p>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {selectedPortfolio && lightboxImages.length > 0 && (
                <ImageLightbox
                    images={lightboxImages}
                    currentIndex={currentAssetIndex}
                    onIndexChange={setCurrentAssetIndex}
                    onClose={() => setSelectedPortfolio(null)}
                />
            )}
        </div>
    );
}
