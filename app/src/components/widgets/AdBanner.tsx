"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adsApi } from "@/api-client/ads";
import type { BannerAd } from "@/lib/schema/ad";

interface AdBannerProps {
    position: "main" | "sub";
}

export function AdBanner({ position }: AdBannerProps) {
    const { data } = useQuery({
        queryKey: ["ads", "banners", position],
        queryFn: () => adsApi.getBanners({ position }),
        staleTime: 30_000,
    });

    const banners = data?.data?.banners ?? [];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, [banners.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }, [banners.length]);

    useEffect(() => {
        if (isPaused || banners.length <= 1) return;
        const interval = setInterval(goToNext, 5000);
        return () => clearInterval(interval);
    }, [isPaused, goToNext, banners.length]);

    if (banners.length === 0) return null;

    const currentBanner = banners[currentIndex];

    const handleClick = (banner: BannerAd) => {
        adsApi.trackClick(banner.campaignId, { creativeId: banner.creativeId }).catch(() => {});
        window.open(banner.clickUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <section
            className="relative overflow-hidden rounded-xl cursor-pointer"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onClick={() => handleClick(currentBanner)}
        >
            {currentBanner.imageUrl ? (
                <img
                    src={currentBanner.imageUrl}
                    alt={currentBanner.title}
                    className={`w-full object-cover ${position === "main" ? "h-40 md:h-56" : "h-32 md:h-44"}`}
                />
            ) : (
                <div
                    className={`w-full bg-gradient-to-br from-primary-900 to-primary-800 flex items-center justify-center ${position === "main" ? "h-40 md:h-56" : "h-32 md:h-44"}`}
                >
                    <p className="text-white text-lg md:text-xl font-semibold px-6 text-center">
                        {currentBanner.title}
                    </p>
                </div>
            )}

            {/* "광고" badge */}
            <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-medium text-white/80 bg-black/30 rounded">
                광고
            </span>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        aria-label="이전 광고"
                    >
                        <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        aria-label="다음 광고"
                    >
                        <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {banners.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                                index === currentIndex ? "bg-white w-4" : "bg-white/50 hover:bg-white/70"
                            }`}
                            aria-label={`광고 ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
