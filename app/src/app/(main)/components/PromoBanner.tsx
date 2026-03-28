"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/api-client/client";
import {
    ArrowRight,
    Sparkles,
    TrendingUp,
    Building2,
    MessageSquare,
    Clock,
    Stethoscope,
    Store,
    ShieldCheck,
} from "lucide-react";
import type { HomeStats } from "@/lib/schema/home";

interface PromoBannerProps {
    variant?: "vendor-cta" | "feature" | "stats";
}

export function PromoBanner({ variant = "vendor-cta" }: PromoBannerProps) {
    if (variant === "stats") return <StatsBanner />;
    if (variant === "feature") return <FeatureBanner />;

    // vendor-cta — Full-width dark CTA banner with background image
    return (
        <section className="relative overflow-hidden rounded-2xl min-h-[280px] md:min-h-[320px]">
            {/* Background image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url(/images/cta/medical-building.jpg)" }}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-primary-900/85 to-primary-900/60" />

            <div className="relative px-6 py-10 md:px-12 md:py-14 flex flex-col justify-center">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary-300 mb-3">
                    START WITH MEDIHUB
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                    개원의 모든 것,
                    <br />
                    메디허브에서 시작하세요
                </h2>

                {/* Checklist */}
                <div className="flex flex-col gap-2 mb-8">
                    {["검증된 파트너사 비교·선택", "간편한 견적 요청과 빠른 응답", "실제 이용 후기 기반 의사결정"].map(
                        (text) => (
                            <div key={text} className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary-400/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-200">{text}</span>
                            </div>
                        ),
                    )}
                </div>

                {/* Dual CTAs */}
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/categories"
                        className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors text-sm"
                    >
                        <Stethoscope className="w-4 h-4" />
                        개원 준비 시작하기
                    </Link>
                    <Link
                        href="/signup?role=vendor"
                        className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
                    >
                        <Store className="w-4 h-4" />
                        무료 입점하기
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// Stats Banner
// ---------------------------------------------------------------------------

function StatsBanner() {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    const { data: stats } = useQuery({
        queryKey: ["home-stats"],
        queryFn: async (): Promise<HomeStats> => {
            const response = await api.get<{ data: HomeStats }>("/api/home/stats");
            return response.data.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (!ref.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 },
        );
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={ref}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 px-6 py-10 md:px-12 md:py-14"
        >
            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-600/20 blur-3xl" />

            <div className="relative">
                {/* Header */}
                <div className="text-center mb-10 md:mb-12">
                    <p className="text-primary-300 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                        MEDIHUB TRUST
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        메디허브가 연결하는 신뢰
                    </h2>
                    <p className="text-primary-300 text-sm">
                        검증된 파트너사와 의료인을 연결합니다
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3">
                    <StatItem
                        icon={<Building2 className="w-5 h-5" />}
                        value={stats?.vendorCount ?? 0}
                        suffix="+"
                        label="등록 업체"
                        unit="개"
                        isVisible={isVisible}
                        accent="bg-blue-400/20 text-blue-300"
                        position="left"
                    />
                    <StatItem
                        icon={<MessageSquare className="w-5 h-5" />}
                        value={stats?.reviewCount ?? 0}
                        suffix=""
                        label="누적 리뷰"
                        unit="건"
                        isVisible={isVisible}
                        accent="bg-emerald-400/20 text-emerald-300"
                        position="center"
                    />
                    <StatItem
                        icon={<Clock className="w-5 h-5" />}
                        value={stats?.avgResponseHours ?? 0}
                        suffix=""
                        label="평균 응답"
                        unit="시간"
                        isVisible={isVisible}
                        accent="bg-amber-400/20 text-amber-300"
                        position="right"
                    />
                </div>
            </div>
        </section>
    );
}

function StatItem({
    icon,
    value,
    suffix,
    label,
    unit,
    isVisible,
    accent,
    position,
}: {
    icon: React.ReactNode;
    value: number;
    suffix: string;
    label: string;
    unit: string;
    isVisible: boolean;
    accent: string;
    position: "left" | "center" | "right";
}) {
    const [displayed, setDisplayed] = useState(0);
    const hasFraction = !Number.isInteger(value);

    useEffect(() => {
        if (!isVisible || value === 0) return;
        const duration = 1400;
        const startTime = performance.now();
        function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - (1 - progress) ** 3; // ease-out cubic
            const next = eased * value;
            setDisplayed(hasFraction ? Math.round(next * 10) / 10 : Math.round(next));
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }, [hasFraction, isVisible, value]);

    const formatted = displayed.toLocaleString(
        undefined,
        hasFraction ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : undefined,
    );

    return (
        <div
            className={`flex flex-col items-center text-center gap-3 py-4 px-3 md:px-6 ${
                position === "center"
                    ? "border-x border-white/10"
                    : ""
            }`}
        >
            {/* Icon badge */}
            <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center`}>
                {icon}
            </div>

            {/* Number */}
            <div className="flex items-baseline gap-0.5">
                <span className="text-3xl md:text-5xl font-black text-white tabular-nums leading-none">
                    {formatted}
                </span>
                <span className="text-base md:text-xl text-primary-300 ml-0.5">
                    {unit}
                    {suffix}
                </span>
            </div>

            {/* Label */}
            <span className="text-xs md:text-sm text-primary-300 font-medium">{label}</span>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Feature Banner
// ---------------------------------------------------------------------------

function FeatureBanner() {
    const features = [
        {
            step: "01",
            icon: <ShieldCheck className="w-6 h-6 text-white" />,
            title: "검증된 업체",
            description: "사업자 인증과 실제 이용 후기로 검증된 신뢰할 수 있는 파트너사만 입점합니다",
            gradient: "from-blue-500 to-blue-700",
            glow: "group-hover:shadow-blue-500/20",
        },
        {
            step: "02",
            icon: <TrendingUp className="w-6 h-6 text-white" />,
            title: "한눈에 비교",
            description: "카테고리별 업체를 한 화면에서 비교하고 리뷰·가격·지역으로 최적의 파트너를 선택하세요",
            gradient: "from-emerald-500 to-emerald-700",
            glow: "group-hover:shadow-emerald-500/20",
        },
        {
            step: "03",
            icon: <Sparkles className="w-6 h-6 text-white" />,
            title: "빠른 견적 문의",
            description: "원하는 업체에 즉시 문의하고 빠른 답변과 견적을 받아보세요",
            gradient: "from-violet-500 to-violet-700",
            glow: "group-hover:shadow-violet-500/20",
        },
    ];

    return (
        <section className="relative overflow-hidden rounded-2xl bg-gray-950 px-6 py-10 md:px-12 md:py-14">
            {/* Subtle grid background */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="relative">
                {/* Header */}
                <div className="text-center mb-10 md:mb-12">
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-3">
                        WHY MEDIHUB
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        간단하고, 빠르고, 신뢰할 수 있는
                    </h2>
                    <p className="text-gray-400 text-sm">
                        메디허브와 함께라면 개원 준비가 훨씬 쉬워집니다
                    </p>
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {features.map((f) => (
                        <div
                            key={f.step}
                            className="group relative bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-7 overflow-hidden hover:border-gray-700 transition-all duration-300"
                        >
                            {/* Step number in bg */}
                            <span className="absolute -bottom-3 -right-1 text-8xl font-black text-white/[0.03] select-none leading-none">
                                {f.step}
                            </span>

                            {/* Gradient icon */}
                            <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg ${f.glow} group-hover:shadow-xl transition-shadow duration-300`}
                            >
                                {f.icon}
                            </div>

                            {/* Step label */}
                            <p className="text-xs font-semibold tracking-widest text-gray-600 uppercase mb-2">
                                STEP {f.step}
                            </p>

                            <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
