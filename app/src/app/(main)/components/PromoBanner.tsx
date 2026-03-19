"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/api-client/client";
import {
    ArrowRight,
    Users,
    Sparkles,
    TrendingUp,
    Building2,
    MessageSquare,
    Clock,
    Stethoscope,
    Store,
} from "lucide-react";
import type { HomeStats } from "@/lib/schema/home";

interface PromoBannerProps {
    variant?: "vendor-cta" | "feature" | "stats";
}

export function PromoBanner({ variant = "vendor-cta" }: PromoBannerProps) {
    if (variant === "stats") {
        return <StatsBanner />;
    }

    if (variant === "vendor-cta") {
        return (
            <section className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 의사용 CTA */}
                    <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-6 h-6 text-primary-700" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-content-primary mb-1">
                                개원 준비 중이신가요?
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                검증된 파트너사를 비교하고 최적의 업체를 찾으세요
                            </p>
                            <Link
                                href="/categories"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800 transition-colors"
                            >
                                파트너 찾기
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* 업체용 CTA */}
                    <div className="flex items-start gap-4 p-4 bg-white/60 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <Store className="w-6 h-6 text-primary-700" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-content-primary mb-1">
                                업체를 운영하고 계신가요?
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                메디허브에 입점하여 더 많은 의료인에게 다가가세요
                            </p>
                            <Link
                                href="/signup?role=vendor"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800 transition-colors"
                            >
                                무료 입점하기
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 혜택 요약 */}
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                    <span>무료 입점</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>리드 수신</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>매출 확대</span>
                </div>
            </section>
        );
    }

    if (variant === "feature") {
        return (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FeatureCard
                    icon={<Sparkles className="w-6 h-6" />}
                    title="검증된 업체"
                    description="사업자 인증과 실제 이용 후기를 통해 신뢰할 수 있습니다"
                    bgColor="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <FeatureCard
                    icon={<TrendingUp className="w-6 h-6" />}
                    title="쉬운 비교"
                    description="카테고리별로 업체를 비교하고 최적의 파트너를 찾으세요"
                    bgColor="bg-green-50"
                    iconColor="text-green-600"
                />
                <FeatureCard
                    icon={<Users className="w-6 h-6" />}
                    title="빠른 문의"
                    description="원하는 업체에 바로 문의하고 견적을 받아보세요"
                    bgColor="bg-purple-50"
                    iconColor="text-purple-600"
                />
            </section>
        );
    }

    return null;
}

function FeatureCard({
    icon,
    title,
    description,
    bgColor,
    iconColor,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    bgColor: string;
    iconColor: string;
}) {
    return (
        <div
            className={`${bgColor} rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-default`}
        >
            <div
                className={`w-12 h-12 rounded-full bg-white flex items-center justify-center ${iconColor} mb-3`}
            >
                {icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Stats Banner — animated counter with intersection observer
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
            className="bg-primary-900 text-white rounded-2xl p-8 md:p-10"
        >
            <h2 className="text-center text-lg md:text-xl font-bold mb-8">
                메디허브가 연결하는 신뢰
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <StatItem
                    icon={<Building2 className="w-6 h-6" />}
                    value={stats?.vendorCount ?? 0}
                    label="등록 업체"
                    suffix="개"
                    isVisible={isVisible}
                />
                <StatItem
                    icon={<MessageSquare className="w-6 h-6" />}
                    value={stats?.reviewCount ?? 0}
                    label="누적 리뷰"
                    suffix="건"
                    isVisible={isVisible}
                />
                <StatItem
                    icon={<Clock className="w-6 h-6" />}
                    value={stats?.avgResponseHours ?? 0}
                    label="평균 응답"
                    suffix="시간"
                    isVisible={isVisible}
                />
            </div>
        </section>
    );
}

function StatItem({
    icon,
    value,
    label,
    suffix,
    isVisible,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
    suffix: string;
    isVisible: boolean;
}) {
    const [displayed, setDisplayed] = useState(0);
    const hasFraction = !Number.isInteger(value);

    useEffect(() => {
        if (!isVisible || value === 0) return;

        const duration = 1200; // ms
        const startTime = performance.now();

        function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out quad
            const eased = 1 - (1 - progress) * (1 - progress);
            const nextValue = eased * value;
            setDisplayed(hasFraction ? Math.round(nextValue * 10) / 10 : Math.round(nextValue));
            if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }, [hasFraction, isVisible, value]);

    const formattedValue = displayed.toLocaleString(
        undefined,
        hasFraction
            ? {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
              }
            : undefined,
    );

    return (
        <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <span className="text-3xl md:text-4xl font-bold tabular-nums">
                    {formattedValue}
                </span>
                <span className="text-lg ml-1 text-white/80">{suffix}</span>
            </div>
            <span className="text-sm text-white/60">{label}</span>
        </div>
    );
}
