"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, Users, Building2, FolderTree, CheckCircle, ChevronRight, Flag } from "lucide-react";
import { useIsAuthenticated, useUserRole, useAuthStore } from "@/stores/auth";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { cn } from "@/components/utils";

const NAV_ITEMS = [
    { href: "/admin/verifications", label: "인증 승인 관리", icon: CheckCircle },
    { href: "/admin/reports", label: "신고 관리", icon: Flag },
    { href: "/admin/users", label: "사용자 관리", icon: Users },
    { href: "/admin/vendors", label: "업체 관리", icon: Building2 },
    { href: "/admin/categories", label: "카테고리 관리", icon: FolderTree },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const { isInitialized } = useAuthStore();

    useEffect(() => {
        if (!isInitialized) return;
        if (!isAuthenticated) {
            router.replace("/login");
            return;
        }
        if (role !== "admin") {
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

    if (!isAuthenticated || role !== "admin") {
        return null;
    }

    const isActive = (href: string) => pathname.startsWith(href);

    return (
        <div className="max-w-7xl mx-auto">
            {/* 모바일 헤더 */}
            <div className="lg:hidden mb-6">
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-[#0a3b41]" />
                    <h1 className="text-2xl font-bold text-[#0a3b41]">관리자</h1>
                </div>
                <p className="text-sm text-gray-500 mt-1">시스템 관리 페이지</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* 사이드 네비게이션 */}
                <aside className="lg:w-56 shrink-0">
                    {/* 데스크톱 타이틀 */}
                    <div className="hidden lg:block bg-[#0a3b41] rounded-xl p-5 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-[#62e3d5]" />
                            </div>
                            <div>
                                <p className="font-semibold text-white">관리자</p>
                                <p className="text-xs text-white/60">Admin Panel</p>
                            </div>
                        </div>
                    </div>

                    {/* 네비게이션 */}
                    <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {/* 모바일: 가로 스크롤 */}
                        <div className="lg:hidden flex overflow-x-auto scrollbar-hide">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                                            active
                                                ? "text-[#0a3b41] border-[#62e3d5]"
                                                : "text-gray-500 border-transparent hover:text-[#0a3b41]",
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
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-3.5 text-sm font-medium transition-colors border-l-2",
                                            active
                                                ? "text-[#0a3b41] bg-[#62e3d5]/5 border-[#62e3d5]"
                                                : "text-gray-600 border-transparent hover:bg-gray-50 hover:text-[#0a3b41]",
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
