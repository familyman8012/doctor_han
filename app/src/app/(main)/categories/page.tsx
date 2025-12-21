"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";

interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    depth: number;
    sortOrder: number;
}

const CATEGORY_ICONS: Record<string, string> = {
    원외탕전: "🏥",
    의료기기: "🩺",
    인테리어: "🏠",
    간판: "🪧",
    전자차트: "💻",
    마케팅: "📣",
    "세무·노무": "📊",
    홈페이지: "🌐",
};

export default function CategoriesPage() {
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: async (): Promise<Category[]> => {
            const response = await api.get<{ data: { items: Category[] } }>("/api/categories");
            return response.data.data.items;
        },
        staleTime: 5 * 60 * 1000,
    });

    const mainCategories = categories.filter((c) => c.depth === 1);
    const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0a3b41] mb-2">전체 카테고리</h1>
                <p className="text-gray-500">병의원 개원 및 운영에 필요한 다양한 서비스를 찾아보세요</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mainCategories.map((category) => {
                    const children = getChildren(category.id);
                    return (
                        <div
                            key={category.id}
                            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <Link
                                href={`/categories/${category.slug}`}
                                className="flex items-center gap-4 p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#62e3d5]/10 flex items-center justify-center text-2xl">
                                    {CATEGORY_ICONS[category.name] || "📦"}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-[#0a3b41]">{category.name}</h2>
                                    <p className="text-sm text-gray-500">
                                        {children.length > 0 ? `${children.length}개 하위 카테고리` : "전체 보기"}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </Link>

                            {children.length > 0 && (
                                <div className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {children.map((child) => (
                                            <Link
                                                key={child.id}
                                                href={`/categories/${category.slug}/${child.slug}`}
                                                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-full hover:bg-[#62e3d5]/10 hover:text-[#0a3b41] transition-colors"
                                            >
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
