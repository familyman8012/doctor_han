"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
}

const defaultSlides: BannerSlide[] = [
    {
        id: "1",
        title: "병의원 개원, 어디서부터 시작할지 막막하신가요?",
        subtitle: "검증된 파트너사와 함께 성공적인 개원을 준비하세요",
        buttonText: "파트너 찾기",
        buttonHref: "/categories",
        bgColor: "from-[#0a3b41] to-[#155a62]",
        textColor: "text-white",
        accentColor: "text-[#62e3d5]",
    },
    {
        id: "2",
        title: "원외탕전, 믿을 수 있는 업체를 찾고 계신가요?",
        subtitle: "실제 한의사들의 리뷰로 검증된 탕전실을 만나보세요",
        buttonText: "탕전실 보기",
        buttonHref: "/categories/external-decoction",
        bgColor: "from-[#1e4a5f] to-[#2d6b7d]",
        textColor: "text-white",
        accentColor: "text-[#7de8dc]",
    },
    {
        id: "3",
        title: "의료기기, 비교하고 선택하세요",
        subtitle: "다양한 의료기기 업체를 한눈에 비교하고 문의하세요",
        buttonText: "의료기기 보기",
        buttonHref: "/categories/medical-devices",
        bgColor: "from-[#2c5364] to-[#203a43]",
        textColor: "text-white",
        accentColor: "text-[#6dd5ed]",
    },
];

interface HeroBannerProps {
    slides?: BannerSlide[];
    autoPlayInterval?: number;
}

export function HeroBanner({ slides = defaultSlides, autoPlayInterval = 5000 }: HeroBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

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

    const currentSlide = slides[currentIndex];

    return (
        <section
            className="relative overflow-hidden rounded-2xl"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${currentSlide.bgColor} transition-all duration-500`}
            />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            {/* Content */}
            <div className="relative px-6 py-12 md:px-12 md:py-20 lg:py-24">
                <div className="max-w-3xl">
                    <h1
                        className={`text-2xl md:text-3xl lg:text-4xl font-bold ${currentSlide.textColor} mb-3 transition-all duration-300`}
                    >
                        {currentSlide.title}
                    </h1>
                    <p className={`text-base md:text-lg ${currentSlide.accentColor} mb-6 transition-all duration-300`}>
                        {currentSlide.subtitle}
                    </p>
                    <Link
                        href={currentSlide.buttonHref}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0a3b41] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {currentSlide.buttonText}
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={goToPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        aria-label="이전 슬라이드"
                    >
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        aria-label="다음 슬라이드"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                index === currentIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/70"
                            }`}
                            aria-label={`슬라이드 ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
