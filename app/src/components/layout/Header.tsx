"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Menu, X, User, Heart, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { useAuthStore, useIsAuthenticated, useUserRole } from "@/stores/auth";
import { signOut } from "@/server/auth/client";

interface HeaderProps {
    onMenuToggle?: () => void;
    isMobileMenuOpen?: boolean;
}

export function Header({ onMenuToggle, isMobileMenuOpen }: HeaderProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [showUserMenu, setShowUserMenu] = useState(false);

    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const profile = useAuthStore((state) => state.profile);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            router.push("/");
            router.refresh();
        } catch {
            // 에러는 중앙 에러 핸들러에서 처리
        }
    };

    const getUserMenuItems = () => {
        const baseItems = [
            { href: "/mypage", label: "마이페이지", icon: User },
            { href: "/favorites", label: "찜 목록", icon: Heart },
        ];

        if (role === "doctor") {
            return [
                ...baseItems,
                { href: "/mypage/leads", label: "내 문의함", icon: FileText },
            ];
        }

        if (role === "vendor") {
            return [
                { href: "/partner", label: "파트너센터", icon: User },
                { href: "/partner/leads", label: "받은 문의", icon: FileText },
            ];
        }

        if (role === "admin") {
            return [
                { href: "/admin", label: "관리자", icon: User },
            ];
        }

        return baseItems;
    };

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* 로고 */}
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
                            onClick={onMenuToggle}
                            aria-label="메뉴 열기"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-xl font-bold text-[#0a3b41]">메디허브</span>
                        </Link>
                    </div>

                    {/* 검색창 - 데스크톱 */}
                    <form
                        onSubmit={handleSearch}
                        className="hidden md:flex flex-1 max-w-xl mx-8"
                    >
                        <div className="relative w-full">
                            <Input
                                type="text"
                                placeholder="업체명, 서비스로 검색"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                size="sm"
                                className="pr-12"
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#62e3d5]"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </form>

                    {/* 우측 메뉴 */}
                    <div className="flex items-center gap-2">
                        {/* 모바일 검색 버튼 */}
                        <button
                            type="button"
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                            onClick={() => router.push("/search")}
                            aria-label="검색"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#62e3d5]/20 flex items-center justify-center">
                                        {profile?.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={profile.avatarUrl}
                                                alt="프로필"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-4 h-4 text-[#0a3b41]" />
                                        )}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium text-[#0a3b41]">
                                        {profile?.displayName || "사용자"}
                                    </span>
                                </button>

                                {/* 드롭다운 메뉴 */}
                                {showUserMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowUserMenu(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                            {getUserMenuItems().map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                                    onClick={() => setShowUserMenu(false)}
                                                >
                                                    <item.icon className="w-4 h-4 text-gray-400" />
                                                    {item.label}
                                                </Link>
                                            ))}
                                            <hr className="my-1 border-gray-100" />
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <LogOut className="w-4 h-4 text-gray-400" />
                                                로그아웃
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghostSecondary"
                                    size="sm"
                                    onClick={() => router.push("/login")}
                                >
                                    로그인
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => router.push("/signup")}
                                    className="hidden sm:inline-flex"
                                >
                                    회원가입
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
