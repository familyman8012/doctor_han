"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, Shield, Star, Users } from "lucide-react";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";

interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    depth: number;
}

export default function HomePage() {
    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: async (): Promise<Category[]> => {
            const response = await api.get<{ data: { items: Category[] } }>("/api/categories");
            return response.data.data.items;
        },
        staleTime: 5 * 60 * 1000,
    });

    const mainCategories = categories.filter((c) => c.depth === 1);

    return (
        <div className="space-y-12">
            {/* 히어로 섹션 */}
            <section className="relative bg-gradient-to-br from-[#0a3b41] to-[#155a62] rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="relative px-8 py-16 md:py-24 text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                        병의원 개원 및 운영을 위한
                        <br />
                        <span className="text-[#62e3d5]">B2B 업체 매칭 플랫폼</span>
                    </h1>
                    <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                        원외탕전, 의료기기, 인테리어, 마케팅 등
                        <br className="hidden md:block" />
                        믿을 수 있는 업체를 한눈에 비교하고 선택하세요
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/categories">
                            <Button variant="primary" size="lg" TrailingIcon={<ArrowRight />}>
                                업체 둘러보기
                            </Button>
                        </Link>
                        <Link href="/signup?role=vendor">
                            <Button variant="ghostPrimary" size="lg" className="border-white text-white hover:bg-white/10">
                                업체 등록하기
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 특징 섹션 */}
            <section>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={<Search className="w-6 h-6" />}
                        title="쉬운 검색"
                        description="카테고리별, 조건별로 원하는 업체를 빠르게 찾을 수 있습니다"
                    />
                    <FeatureCard
                        icon={<Shield className="w-6 h-6" />}
                        title="검증된 업체"
                        description="사업자 인증과 실제 이용 후기를 통해 신뢰할 수 있습니다"
                    />
                    <FeatureCard
                        icon={<Star className="w-6 h-6" />}
                        title="리뷰 시스템"
                        description="실제 의료인들의 솔직한 리뷰로 현명한 선택을 도와드립니다"
                    />
                </div>
            </section>

            {/* 카테고리 섹션 */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-[#0a3b41]">카테고리</h2>
                    <Link
                        href="/categories"
                        className="text-sm text-gray-500 hover:text-[#0a3b41] flex items-center gap-1"
                    >
                        전체보기 <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {mainCategories.slice(0, 10).map((category) => (
                        <Link
                            key={category.id}
                            href={`/categories/${category.slug}`}
                            className="group flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-100 hover:border-[#62e3d5] hover:shadow-md transition-all"
                        >
                            <div className="w-12 h-12 rounded-full bg-[#62e3d5]/10 flex items-center justify-center group-hover:bg-[#62e3d5]/20 transition-colors">
                                <CategoryIcon name={category.name} />
                            </div>
                            <span className="text-sm font-medium text-[#0a3b41] text-center">
                                {category.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* CTA 섹션 */}
            <section className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#62e3d5]/10 flex items-center justify-center">
                            <Users className="w-8 h-8 text-[#0a3b41]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#0a3b41]">
                                업체를 운영하고 계신가요?
                            </h3>
                            <p className="text-gray-500">
                                메디허브에 입점하여 더 많은 의료인에게 다가가세요
                            </p>
                        </div>
                    </div>
                    <Link href="/signup?role=vendor">
                        <Button variant="primary" size="lg">
                            무료로 시작하기
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="w-12 h-12 rounded-full bg-[#62e3d5]/10 flex items-center justify-center text-[#0a3b41] mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-[#0a3b41] mb-2">{title}</h3>
            <p className="text-gray-500 text-sm">{description}</p>
        </div>
    );
}

function CategoryIcon({ name }: { name: string }) {
    // 카테고리 이름에 따른 이모지 또는 아이콘
    const iconMap: Record<string, string> = {
        원외탕전: "🏥",
        의료기기: "🩺",
        인테리어: "🏠",
        간판: "🪧",
        전자차트: "💻",
        마케팅: "📣",
        "세무·노무": "📊",
        홈페이지: "🌐",
    };
    return <span className="text-2xl">{iconMap[name] || "📦"}</span>;
}
