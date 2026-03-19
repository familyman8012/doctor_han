"use client";

import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import type { VendorPortfolio } from "@/lib/schema/vendor";
import { VENDOR_DEFAULT_THUMBNAILS } from "@/lib/constants/assets";
import { ImageLightbox } from "./gallery/ImageLightbox";

interface HeroGalleryProps {
    portfolios: VendorPortfolio[];
    categorySlug?: string;
}

export function HeroGallery({ portfolios, categorySlug }: HeroGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Collect all images from portfolio assets
    const images: Array<{ url: string; alt?: string }> = portfolios.flatMap((portfolio) =>
        portfolio.assets
            .filter((asset): asset is typeof asset & { url: string } => asset.url !== null)
            .map((asset) => ({ url: asset.url, alt: portfolio.title ?? undefined })),
    );

    // Fallback to default thumbnail if no portfolio images
    if (images.length === 0 && categorySlug) {
        const defaultUrl = VENDOR_DEFAULT_THUMBNAILS[categorySlug];
        if (defaultUrl) {
            images.push({ url: defaultUrl, alt: "기본 이미지" });
        }
    }

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1 });

    const scrollTo = useCallback(
        (index: number) => {
            emblaApi?.scrollTo(index);
            setSelectedIndex(index);
        },
        [emblaApi],
    );

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    // Sync selected index with Embla scroll
    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
        emblaApi.on("select", onSelect);
        return () => {
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi]);

    const hasMultiple = images.length > 1;

    if (images.length === 0) {
        return (
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-300" />
            </div>
        );
    }

    return (
        <div>
            {/* Main carousel */}
            <div className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                <div ref={emblaRef} className="h-full overflow-hidden">
                    <div className="flex h-full">
                        {images.map((image, index) => (
                            <button
                                type="button"
                                key={`${image.url}-${index}`}
                                className="flex-[0_0_100%] min-w-0 h-full cursor-zoom-in"
                                onClick={() => setLightboxOpen(true)}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={image.url}
                                    alt={image.alt || ""}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Prev / Next buttons (visible on hover) */}
                {hasMultiple && (
                    <>
                        <button
                            type="button"
                            onClick={scrollPrev}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 text-gray-700 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={scrollNext}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 text-gray-700 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnail strip */}
            {hasMultiple && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {images.map((image, index) => (
                        <button
                            key={`thumb-${image.url}-${index}`}
                            type="button"
                            onClick={() => scrollTo(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                                index === selectedIndex ? "ring-2 ring-primary" : "ring-1 ring-gray-200"
                            }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={image.url}
                                alt={image.alt || ""}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightboxOpen && (
                <ImageLightbox
                    images={images}
                    currentIndex={selectedIndex}
                    onIndexChange={(index) => {
                        setSelectedIndex(index);
                        emblaApi?.scrollTo(index);
                    }}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </div>
    );
}
