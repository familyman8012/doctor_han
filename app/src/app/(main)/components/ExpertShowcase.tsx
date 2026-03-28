"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Expert {
    name: string;
    tags: string[];
    image: string;
}

const experts: Expert[] = [
    {
        name: "한방탕전 전문가",
        tags: ["원외탕전", "한약 조제"],
        image: "/images/experts/expert-herbal.jpg",
    },
    {
        name: "EMR 컨설턴트",
        tags: ["전자차트", "EMR 연동"],
        image: "/images/experts/expert-emr.jpg",
    },
    {
        name: "마케팅 디렉터",
        tags: ["병원마케팅", "SNS 광고"],
        image: "/images/experts/expert-marketing.jpg",
    },
    {
        name: "공간 디자이너",
        tags: ["의원 인테리어", "시공"],
        image: "/images/experts/expert-interior.jpg",
    },
    {
        name: "세무 파트너",
        tags: ["세무·노무", "개원 세무"],
        image: "/images/experts/expert-tax.jpg",
    },
    {
        name: "의료기기 어드바이저",
        tags: ["의료기기", "장비 컨설팅"],
        image: "/images/experts/expert-device.jpg",
    },
    {
        name: "웹 크리에이터",
        tags: ["홈페이지", "웹 디자인"],
        image: "/images/experts/expert-web.jpg",
    },
];

// 크몽 스타일: 카드 크기 3종 (large / medium / small)
// large: 203×173, medium: 170×150, small: 140×130
type CardSize = "lg" | "md" | "sm";

interface CardLayout {
    style: React.CSSProperties;
    size: CardSize;
    opacity: number;
}

const cardLayouts: CardLayout[] = [
    // 한방탕전 전문가
    { style: { top: 50, left: -70 }, size: "lg", opacity: 0.1 },
    // EMR 컨설턴트
    { style: { top: 60, right: -30 }, size: "lg", opacity: 0.1 },
    // 마케팅 디렉터
    { style: { top: 70, left: 116 }, size: "sm", opacity: 0.06 },
    // 공간 디자이너
    { style: { top: 123, left: 272 }, size: "lg", opacity: 0.1 },
    // 세무 파트너
    { style: { top: 283, left: 456 }, size: "md", opacity: 0.1 },
    // 의료기기 어드바이저
    { style: { top: 270, left: 58 }, size: "md", opacity: 0.1 },
    // 웹 크리에이터
    { style: { bottom: 7, right: 222 }, size: "sm", opacity: 0.06 },
];

const sizeConfig = {
    lg: { w: 173, h: 203, photo: 110, nameSize: "text-[13px]", tagSize: "text-[9px]" },
    md: { w: 150, h: 175, photo: 90, nameSize: "text-[12px]", tagSize: "text-[9px]" },
    sm: { w: 130, h: 155, photo: 75, nameSize: "text-[11px]", tagSize: "text-[8px]" },
};

export function ExpertShowcase() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!sectionRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 },
        );
        observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section ref={sectionRef} className="relative overflow-hidden rounded-2xl bg-gray-800 h-[440px] md:h-[510px]">
            <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6 md:px-10">
                {/* Left: Text content */}
                <div className="w-full md:w-[400px] flex-shrink-0 z-10">
                    <h2 className="text-2xl md:text-[36px] font-bold leading-tight md:leading-[44px] text-white">
                        실력있는 전문가들과
                        <br />
                        개원을 시작하세요
                    </h2>

                    <Link
                        href="/categories"
                        className="mt-8 md:mt-10 inline-flex items-center justify-center gap-2 bg-primary-500 text-white font-semibold h-[48px] md:h-[52px] px-8 rounded-lg hover:bg-primary-600 transition-colors text-sm md:text-base w-[220px] md:w-[240px]"
                    >
                        메디허브 시작하기
                    </Link>
                </div>

                {/* Right: Floating expert cards (desktop) */}
                <div className="hidden md:block relative h-full w-[642px]">
                    {/* Center glow */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[262px] h-[262px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-500/40 to-gray-800 blur-[72px]" />

                    {/* Cards — appear one by one when section scrolls into view */}
                    {experts.map((expert, i) => {
                        const layout = cardLayouts[i];
                        const size = sizeConfig[layout.size];
                        return (
                            <div
                                key={expert.name}
                                className={`absolute flex flex-col items-center justify-between rounded-lg ${
                                    isVisible ? "animate-scale-in" : "scale-0"
                                }`}
                                style={{
                                    ...layout.style,
                                    width: size.w,
                                    height: size.h,
                                    padding: layout.size === "sm" ? "12px 10px" : "18px 14px",
                                    backgroundColor: `rgba(255, 255, 255, ${layout.opacity})`,
                                    animationDelay: `${i * 0.2}s`,
                                }}
                            >
                                {/* Profile photo */}
                                <div
                                    className="rounded-full overflow-hidden flex-shrink-0"
                                    style={{ width: size.photo, height: size.photo }}
                                >
                                    <Image
                                        src={expert.image}
                                        alt={expert.name}
                                        width={size.photo}
                                        height={size.photo}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Name */}
                                <span className={`${size.nameSize} font-bold leading-[19px] text-white`}>
                                    {expert.name}
                                </span>

                                {/* Tags */}
                                <div className="flex items-center gap-1">
                                    <span className={`${size.tagSize} text-white h-5 rounded-full px-1.5 flex items-center justify-center bg-gray-700`}>
                                        {expert.tags[0]}
                                    </span>
                                    {expert.tags[1] && (
                                        <span className={`${size.tagSize} text-white h-5 rounded-full px-1.5 flex items-center justify-center border border-gray-600`}>
                                            {expert.tags[1]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile: Horizontal scroll */}
                <div className="md:hidden absolute inset-x-0 bottom-6 overflow-x-auto px-6 scrollbar-hide">
                    <div className="flex gap-3">
                        {experts.slice(0, 4).map((expert) => (
                            <div
                                key={expert.name}
                                className="flex-shrink-0 flex flex-col items-center gap-2 rounded-lg px-3 py-3 w-[120px]"
                                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                            >
                                <div className="w-14 h-14 rounded-full overflow-hidden">
                                    <Image
                                        src={expert.image}
                                        alt={expert.name}
                                        width={56}
                                        height={56}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-[11px] font-bold text-white text-center">
                                    {expert.name}
                                </span>
                                <span className="text-[9px] text-white h-4 rounded-full px-1.5 flex items-center bg-gray-700">
                                    {expert.tags[0]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
