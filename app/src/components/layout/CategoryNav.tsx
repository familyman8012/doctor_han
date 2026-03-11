"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import api from "@/api-client/client";
import { cn } from "@/components/utils";

interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    depth: number;
    sortOrder: number;
}

interface CategoryNavProps {
    className?: string;
}

export function CategoryNav({ className }: CategoryNavProps) {
    const pathname = usePathname();
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
    const navRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: async (): Promise<Category[]> => {
            const response = await api.get<{ data: { items: Category[] } }>("/api/categories");
            return response.data?.data?.items ?? [];
        },
        staleTime: 5 * 60 * 1000, // 5분
    });

    // depth=1인 메인 카테고리
    const mainCategories = categories.filter((c) => c.depth === 1);

    // 자식 카테고리 찾기
    const getChildren = (parentId: string) =>
        categories.filter((c) => c.parentId === parentId);

    const handleToggle = useCallback((categoryId: string) => {
        if (openCategory === categoryId) {
            setOpenCategory(null);
            return;
        }
        const btn = buttonRefs.current.get(categoryId);
        if (btn && navRef.current) {
            const btnRect = btn.getBoundingClientRect();
            const navRect = navRef.current.getBoundingClientRect();
            setDropdownPos({
                left: btnRect.left - navRect.left,
                top: btnRect.bottom - navRect.top,
            });
        }
        setOpenCategory(categoryId);
    }, [openCategory]);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setOpenCategory(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (mainCategories.length === 0) return null;

    const openCat = mainCategories.find((c) => c.id === openCategory);
    const openChildren = openCat ? getChildren(openCat.id) : [];

    return (
        <nav
            ref={navRef}
            className={cn(
                "relative bg-white border-b border-gray-100",
                className
            )}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ul className="flex items-center gap-1 h-12 whitespace-nowrap overflow-x-auto scrollbar-hide">
                    <li>
                        <Link
                            href="/categories"
                            className={cn(
                                "flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                                pathname === "/categories"
                                    ? "text-[#0a3b41] bg-[#62e3d5]/10"
                                    : "text-gray-600 hover:text-[#0a3b41] hover:bg-gray-50"
                            )}
                        >
                            전체
                        </Link>
                    </li>
                    {mainCategories.map((category) => {
                        const children = getChildren(category.id);
                        const hasChildren = children.length > 0;
                        const isActive =
                            pathname?.startsWith(`/categories/${category.slug}`) ||
                            openCategory === category.id;

                        return (
                            <li key={category.id}>
                                {hasChildren ? (
                                    <button
                                        ref={(el) => {
                                            if (el) buttonRefs.current.set(category.id, el);
                                        }}
                                        type="button"
                                        onClick={() => handleToggle(category.id)}
                                        className={cn(
                                            "flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                                            isActive
                                                ? "text-[#0a3b41] bg-[#62e3d5]/10"
                                                : "text-gray-600 hover:text-[#0a3b41] hover:bg-gray-50"
                                        )}
                                    >
                                        {category.name}
                                        <ChevronDown
                                            className={cn(
                                                "w-4 h-4 transition-transform",
                                                openCategory === category.id && "rotate-180"
                                            )}
                                        />
                                    </button>
                                ) : (
                                    <Link
                                        href={`/categories/${category.slug}`}
                                        className={cn(
                                            "flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                                            isActive
                                                ? "text-[#0a3b41] bg-[#62e3d5]/10"
                                                : "text-gray-600 hover:text-[#0a3b41] hover:bg-gray-50"
                                        )}
                                    >
                                        {category.name}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* 드롭다운 - overflow 컨테이너 바깥에 렌더링 */}
            {openCategory && openCat && (
                <div
                    className="absolute min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50"
                    style={{ left: dropdownPos.left, top: dropdownPos.top + 4 }}
                >
                    <Link
                        href={`/categories/${openCat.slug}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                        onClick={() => setOpenCategory(null)}
                    >
                        {openCat.name} 전체
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    {openChildren.map((child) => (
                        <Link
                            key={child.id}
                            href={`/categories/${openCat.slug}/${child.slug}`}
                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#0a3b41]"
                            onClick={() => setOpenCategory(null)}
                        >
                            {child.name}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}
