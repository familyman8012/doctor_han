"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HERO_BANNER_IMAGES } from "@/lib/constants/assets";

interface BannerSlide {
    id: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonHref: string;
    bgColor: string;
    textColor: string;
    accentColor: string;
    imageUrl?: string;
    overlayClass?: string;
}

const defaultSlides: BannerSlide[] = [
    {
        id: "1",
        title: "병의원 개원, 어디서부터 시작할지 막막하신가요?",
        subtitle: "검증된 파트너사와 함께 성공적인 개원을 준비하세요",
        buttonText: "개원 준비 시작하기",
        buttonHref: "/categories",
        bgColor: "from-primary-900 to-primary-800",
        textColor: "text-white",
        accentColor: "text-white/70",
        imageUrl: HERO_BANNER_IMAGES[0],
        overlayClass:
            "bg-gradient-to-r from-black/50 via-black/25 to-transparent",
    },
    {
        id: "2",
        title: "원외탕전, 믿을 수 있는 업체를 찾고 계신가요?",
        subtitle: "실제 한의사들의 리뷰로 검증된 탕전실을 만나보세요",
        buttonText: "탕전실 비교하기",
        buttonHref: "/categories/external-decoction",
        bgColor: "from-primary-800 to-primary-800",
        textColor: "text-white",
        accentColor: "text-white/70",
        imageUrl: HERO_BANNER_IMAGES[1],
        overlayClass:
            "bg-gradient-to-r from-black/55 via-black/30 to-transparent",
    },
    {
        id: "3",
        title: "의료기기, 비교하고 선택하세요",
        subtitle: "다양한 의료기기 업체를 한눈에 비교하고 문의하세요",
        buttonText: "의료기기 비교하기",
        buttonHref: "/categories/medical-devices",
        bgColor: "from-primary-900 to-primary-900",
        textColor: "text-white",
        accentColor: "text-white/70",
        imageUrl: HERO_BANNER_IMAGES[2],
        overlayClass:
            "bg-gradient-to-r from-black/50 via-black/25 to-transparent",
    },
];

interface HeroBannerProps {
    slides?: BannerSlide[];
    autoPlayInterval?: number;
}

export function HeroBanner({ slides = defaultSlides, autoPlayInterval = 5000 }: HeroBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    useEffect(() => {
        if (isPaused || slides.length <= 1) return;

        const interval = setInterval(goToNext, autoPlayInterval);
        return () => clearInterval(interval);
    }, [isPaused, goToNext, autoPlayInterval, slides.length]);

    // Reset progress bar animation on slide change
    useEffect(() => {
        if (progressRef.current) {
            progressRef.current.style.animation = "none";
            // Force reflow
            void progressRef.current.offsetHeight;
            progressRef.current.style.animation = "";
        }
    }, [currentIndex]);

    return (
        <section
            className="relative overflow-hidden rounded-2xl min-h-[280px] md:min-h-[380px] lg:min-h-[440px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* All slides stacked for fade transition */}
            {slides.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`${index === 0 ? "relative" : "absolute inset-0"} transition-opacity duration-700 ${
                        index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                    aria-hidden={index !== currentIndex}
                >
                    {/* Background */}
                    {slide.imageUrl ? (
                        <>
                            <Image
                                src={slide.imageUrl}
                                alt=""
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />
                            <div className={`absolute inset-0 ${slide.overlayClass ?? "bg-gradient-to-r from-black/50 via-black/25 to-transparent"}`} />
                        </>
                    ) : (
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${slide.bgColor}`}
                        />
                    )}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                    {/* Content */}
                    <div className="relative flex items-center min-h-[280px] md:min-h-[380px] lg:min-h-[440px] px-6 py-8 md:px-12 md:py-12 lg:px-16 lg:py-16">
                        <div className="max-w-3xl">
                            <h1
                                className={`text-2xl md:text-3xl lg:text-4xl font-bold ${slide.textColor} mb-3`}
                            >
                                {slide.title}
                            </h1>
                            <p className={`text-base md:text-lg ${slide.accentColor} mb-6`}>
                                {slide.subtitle}
                            </p>
                            <Link
                                href={slide.buttonHref}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-content-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                                tabIndex={index === currentIndex ? 0 : -1}
                            >
                                {slide.buttonText}
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={goToPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        aria-label="이전 슬라이드"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        aria-label="다음 슬라이드"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                </>
            )}

            {/* Progress Bar Indicator */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-6 right-6 z-20 flex items-center gap-3">
                    {/* Numbering */}
                    <span className="text-xs font-medium text-white/80 tabular-nums whitespace-nowrap">
                        {String(currentIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                    </span>

                    {/* Progress bars */}
                    <div className="flex-1 flex gap-1.5">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
                                aria-label={`슬라이드 ${index + 1}`}
                            >
                                <div
                                    ref={index === currentIndex ? progressRef : undefined}
                                    className={`h-full rounded-full bg-white ${
                                        index === currentIndex
                                            ? "animate-progress-fill"
                                            : index < currentIndex
                                              ? "w-full"
                                              : "w-0"
                                    }`}
                                    style={
                                        index === currentIndex
                                            ? {
                                                  animationDuration: `${autoPlayInterval}ms`,
                                                  animationPlayState: isPaused ? "paused" : "running",
                                              }
                                            : undefined
                                    }
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
