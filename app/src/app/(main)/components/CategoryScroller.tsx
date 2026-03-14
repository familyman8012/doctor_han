"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { HomeCategoryGridSection } from "@/lib/schema/home";
import { CATEGORY_ICON_PATHS } from "@/lib/constants/assets";

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
                    className="text-sm text-gray-500 hover:text-content-primary flex items-center gap-1"
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
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-25 to-primary-50 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            {CATEGORY_ICON_PATHS[category.slug] ? (
                                <Image
                                    src={CATEGORY_ICON_PATHS[category.slug]}
                                    alt={category.name}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl">📦</span>
                            )}
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
