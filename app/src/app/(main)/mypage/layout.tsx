"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Heart, FileText, Star, Settings, ChevronRight, Bell, MessageCircle } from "lucide-react";
import { useIsAuthenticated, useUserRole, useAuthStore, useProfile } from "@/stores/auth";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { cn } from "@/components/utils";

const NAV_ITEMS = [
    { href: "/mypage", label: "프로필", icon: User, exact: true },
    { href: "/mypage/leads", label: "내 문의함", icon: FileText },
    { href: "/mypage/favorites", label: "찜 목록", icon: Heart },
    { href: "/mypage/reviews", label: "내 리뷰", icon: Star },
    { href: "/mypage/support", label: "고객지원", icon: MessageCircle },
    { href: "/mypage/notifications", label: "알림 설정", icon: Bell },
    { href: "/mypage/settings", label: "계정 설정", icon: Settings },
];

export default function MypageLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const profile = useProfile();
    const { isInitialized } = useAuthStore();

    useEffect(() => {
        if (!isInitialized) return;
        if (!isAuthenticated) {
            router.replace("/login");
            return;
        }
        if (role !== "doctor") {
            router.replace("/");
        }
    }, [isInitialized, isAuthenticated, role, router]);

    if (!isInitialized) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated || role !== "doctor") {
        return null;
    }

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* 모바일 헤더 */}
            <div className="lg:hidden mb-6">
                <h1 className="text-2xl font-bold text-[#0a3b41]">마이페이지</h1>
                <p className="text-sm text-gray-500 mt-1">
                    {profile?.displayName ?? "회원"}님, 안녕하세요
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* 사이드 네비게이션 */}
                <aside className="lg:w-56 shrink-0">
                    {/* 데스크톱 프로필 요약 */}
                    <div className="hidden lg:block bg-white rounded-xl p-5 border border-gray-200 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-full bg-[#62e3d5]/20 flex items-center justify-center overflow-hidden">
                                {profile?.avatarUrl ? (
                                    <Image
                                        src={profile.avatarUrl}
                                        alt="프로필"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <User className="w-6 h-6 text-[#62e3d5]" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-[#0a3b41] truncate">
                                    {profile?.displayName ?? "회원"}
                                </p>
                                <p className="text-xs text-gray-500">한의사</p>
                            </div>
                        </div>
                    </div>

                    {/* 네비게이션 */}
                    <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {/* 모바일: 가로 스크롤 */}
                        <div className="lg:hidden flex overflow-x-auto scrollbar-hide">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href, item.exact);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                                            active
                                                ? "text-[#0a3b41] border-[#62e3d5]"
                                                : "text-gray-500 border-transparent hover:text-[#0a3b41]"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* 데스크톱: 세로 리스트 */}
                        <div className="hidden lg:block">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href, item.exact);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-colors border-l-2",
                                            active
                                                ? "text-[#0a3b41] bg-[#62e3d5]/5 border-[#62e3d5]"
                                                : "text-gray-600 border-transparent hover:bg-gray-50 hover:text-[#0a3b41]"
                                        )}
                                    >
                                        <span className="flex items-center gap-3">
                                            <Icon className={cn("w-4 h-4", active && "text-[#62e3d5]")} />
                                            {item.label}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>
                </aside>

                {/* 메인 콘텐츠 */}
                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    );
}
