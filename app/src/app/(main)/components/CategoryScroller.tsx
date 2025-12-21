"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HomeCategoryGridSection } from "@/lib/schema/home";

const categoryIcons: Record<string, string> = {
    원외탕전: "🏥",
    의료기기: "🩺",
    인테리어: "🏠",
    간판: "🪧",
    전자차트: "💻",
    마케팅: "📣",
    "세무·노무": "📊",
    홈페이지: "🌐",
    컨설팅: "💼",
    보험: "🛡️",
};

interface CategoryScrollerProps {
    categories: HomeCategoryGridSection["items"];
}

export function CategoryScroller({ categories }: CategoryScrollerProps) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">카테고리</h2>
                <Link
                    href="/categories"
                    className="text-sm text-gray-500 hover:text-[#0a3b41] flex items-center gap-1"
                >
                    전체보기 <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="flex-shrink-0 flex flex-col items-center gap-2 p-3 min-w-[72px]"
                    >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f0faf9] to-[#e0f5f3] flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-2xl">{categoryIcons[category.name] || "📦"}</span>
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center whitespace-nowrap">
                            {category.name}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
