"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, X, User, Heart, FileText, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { useAuthStore, useIsAuthenticated, useUserRole } from "@/stores/auth";
import { signOut } from "@/server/auth/client";
import { cn } from "@/components/utils";

interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    depth: number;
}

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const profile = useAuthStore((state) => state.profile);

    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: async (): Promise<Category[]> => {
            const response = await api.get<{ data: { items: Category[] } }>("/api/categories");
            return response.data.data.items;
        },
        staleTime: 5 * 60 * 1000,
    });

    const mainCategories = categories.filter((c) => c.depth === 1);
    const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId);

    const handleLogout = async () => {
        try {
            await signOut();
            onClose();
            router.push("/");
            router.refresh();
        } catch {
            // 에러는 중앙 에러 핸들러에서 처리
        }
    };

    const handleNavigation = (href: string) => {
        router.push(href);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* 배경 오버레이 */}
            <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={onClose}
            />

            {/* 메뉴 패널 */}
            <div className="fixed inset-y-0 left-0 w-80 max-w-[calc(100vw-3rem)] bg-white z-50 lg:hidden overflow-y-auto">
                {/* 헤더 */}
                <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-100 bg-white">
                    <span className="text-lg font-bold text-[#0a3b41]">메디허브</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 사용자 정보 */}
                {isAuthenticated ? (
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#62e3d5]/20 flex items-center justify-center">
                                {profile?.avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={profile.avatarUrl}
                                        alt="프로필"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-6 h-6 text-[#0a3b41]" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-[#0a3b41]">
                                    {profile?.displayName || "사용자"}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {role === "doctor" && "한의사"}
                                    {role === "vendor" && "업체"}
                                    {role === "admin" && "관리자"}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex gap-2">
                            <Button
                                variant="ghostSecondary"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleNavigation("/login")}
                            >
                                로그인
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleNavigation("/signup")}
                            >
                                회원가입
                            </Button>
                        </div>
                    </div>
                )}

                {/* 메뉴 리스트 */}
                <div className="py-2">
                    {/* 사용자 메뉴 */}
                    {isAuthenticated && (
                        <>
                            <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase">
                                내 메뉴
                            </div>
                            <nav className="space-y-0.5">
                                {role === "doctor" && (
                                    <>
                                        <MenuLink href="/mypage" icon={User} label="마이페이지" onClick={onClose} />
                                        <MenuLink href="/favorites" icon={Heart} label="찜 목록" onClick={onClose} />
                                        <MenuLink href="/mypage/leads" icon={FileText} label="내 문의함" onClick={onClose} />
                                    </>
                                )}
                                {role === "vendor" && (
                                    <>
                                        <MenuLink href="/partner" icon={User} label="파트너센터" onClick={onClose} />
                                        <MenuLink href="/partner/leads" icon={FileText} label="받은 문의" onClick={onClose} />
                                        <MenuLink href="/partner/settings" icon={Settings} label="업체 설정" onClick={onClose} />
                                    </>
                                )}
                                {role === "admin" && (
                                    <MenuLink href="/admin" icon={User} label="관리자" onClick={onClose} />
                                )}
                            </nav>
                            <hr className="my-2 border-gray-100" />
                        </>
                    )}

                    {/* 카테고리 */}
                    <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase">
                        카테고리
                    </div>
                    <nav className="space-y-0.5">
                        <button
                            type="button"
                            onClick={() => handleNavigation("/categories")}
                            className={cn(
                                "flex items-center w-full px-4 py-3 text-sm transition-colors",
                                pathname === "/categories"
                                    ? "text-[#0a3b41] bg-[#62e3d5]/10 font-medium"
                                    : "text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            전체 카테고리
                        </button>
                        {mainCategories.map((category) => {
                            const children = getChildren(category.id);
                            const hasChildren = children.length > 0;
                            const isExpanded = expandedCategory === category.id;
                            const isActive = pathname?.startsWith(`/categories/${category.slug}`);

                            return (
                                <div key={category.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (hasChildren) {
                                                setExpandedCategory(isExpanded ? null : category.id);
                                            } else {
                                                handleNavigation(`/categories/${category.slug}`);
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center justify-between w-full px-4 py-3 text-sm transition-colors",
                                            isActive
                                                ? "text-[#0a3b41] bg-[#62e3d5]/10 font-medium"
                                                : "text-gray-700 hover:bg-gray-50"
                                        )}
                                    >
                                        {category.name}
                                        {hasChildren && (
                                            <ChevronRight
                                                className={cn(
                                                    "w-4 h-4 text-gray-400 transition-transform",
                                                    isExpanded && "rotate-90"
                                                )}
                                            />
                                        )}
                                    </button>
                                    {hasChildren && isExpanded && (
                                        <div className="bg-gray-50">
                                            <button
                                                type="button"
                                                onClick={() => handleNavigation(`/categories/${category.slug}`)}
                                                className="block w-full text-left pl-8 pr-4 py-2.5 text-sm text-gray-600 hover:text-[#0a3b41]"
                                            >
                                                {category.name} 전체
                                            </button>
                                            {children.map((child) => (
                                                <button
                                                    key={child.id}
                                                    type="button"
                                                    onClick={() => handleNavigation(`/categories/${category.slug}/${child.slug}`)}
                                                    className="block w-full text-left pl-8 pr-4 py-2.5 text-sm text-gray-600 hover:text-[#0a3b41]"
                                                >
                                                    {child.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* 로그아웃 */}
                {isAuthenticated && (
                    <div className="sticky bottom-0 p-4 border-t border-gray-100 bg-white">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                        >
                            <LogOut className="w-4 h-4" />
                            로그아웃
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

function MenuLink({
    href,
    icon: Icon,
    label,
    onClick,
}: {
    href: string;
    icon: React.ElementType;
    label: string;
    onClick: () => void;
}) {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                isActive
                    ? "text-[#0a3b41] bg-[#62e3d5]/10 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
            )}
        >
            <Icon className="w-4 h-4 text-gray-400" />
            {label}
        </Link>
    );
}
