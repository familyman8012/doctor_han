"use client";

import Link from "next/link";
import Image from "next/image";
import type { HomeCategoryGridSection } from "@/lib/schema/home";
import { CATEGORY_ICON_PATHS } from "@/lib/constants/assets";

interface CategoryScrollerProps {
    categories: HomeCategoryGridSection["items"];
}

export function CategoryScroller({ categories }: CategoryScrollerProps) {
    return (
        <section>
            {/* 모바일: 5열 2행 그리드 / 데스크탑: 10열 1행 그리드 — 히어로 너비에 꽉 차게 */}
            <div className="grid grid-cols-5 md:grid-cols-10 gap-y-3">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-primary-25 hover:scale-105 transition-all duration-200"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                            {CATEGORY_ICON_PATHS[category.slug] ? (
                                <Image
                                    src={CATEGORY_ICON_PATHS[category.slug]}
                                    alt={category.name}
                                    width={80}
                                    height={80}
                                    className="w-16 h-16 md:w-20 md:h-20 object-contain"
                                />
                            ) : (
                                <span className="text-3xl">📦</span>
                            )}
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                            {category.name}
                        </span>
                        {category.vendorCount > 0 && (
                            <span className="text-[11px] text-gray-400 -mt-1">
                                업체 {category.vendorCount}개
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </section>
    );
}
