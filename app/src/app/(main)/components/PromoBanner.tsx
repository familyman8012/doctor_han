"use client";

import Link from "next/link";
import { ArrowRight, Users, Sparkles, TrendingUp } from "lucide-react";

interface PromoBannerProps {
    variant?: "vendor-cta" | "feature" | "stats";
}

export function PromoBanner({ variant = "vendor-cta" }: PromoBannerProps) {
    if (variant === "vendor-cta") {
        return (
            <section className="bg-gradient-to-r from-[#f0faf9] to-[#e0f5f3] rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <Users className="w-7 h-7 text-[#0a3b41]" />
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-bold text-[#0a3b41]">
                                업체를 운영하고 계신가요?
                            </h3>
                            <p className="text-sm text-gray-600">
                                메디허브에 입점하여 더 많은 의료인에게 다가가세요
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/signup?role=vendor"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a3b41] text-white font-medium rounded-lg hover:bg-[#155a62] transition-colors whitespace-nowrap"
                    >
                        무료로 시작하기
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>
        );
    }

    if (variant === "feature") {
        return (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FeatureCard
                    icon={<Sparkles className="w-5 h-5" />}
                    title="검증된 업체"
                    description="사업자 인증과 실제 이용 후기를 통해 신뢰할 수 있습니다"
                    bgColor="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <FeatureCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    title="쉬운 비교"
                    description="카테고리별로 업체를 비교하고 최적의 파트너를 찾으세요"
                    bgColor="bg-green-50"
                    iconColor="text-green-600"
                />
                <FeatureCard
                    icon={<Users className="w-5 h-5" />}
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
        <div className={`${bgColor} rounded-xl p-5`}>
            <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${iconColor} mb-3`}>
                {icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    );
}
