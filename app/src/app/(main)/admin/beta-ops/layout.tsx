"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, FileText, Award, History } from "lucide-react";
import { cn } from "@/components/utils";
import type { ReactNode } from "react";

const TABS = [
    { href: "/admin/beta-ops", label: "일일 점검", icon: ClipboardCheck, exact: true },
    { href: "/admin/beta-ops/leads", label: "리드 목록", icon: FileText },
    { href: "/admin/beta-ops/vendor-grades", label: "업체 등급", icon: Award },
    { href: "/admin/beta-ops/history", label: "상태 이력", icon: History },
];

export default function BetaOpsLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    const isActive = (tab: (typeof TABS)[number]) => {
        if (tab.exact) return pathname === tab.href;
        return pathname.startsWith(tab.href);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-content-primary">베타 운영 콘솔</h1>
                <p className="text-sm text-gray-500 mt-1">클로즈드 베타 운영 상태를 모니터링합니다</p>
            </div>
            <nav className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-gray-200 bg-white rounded-t-xl px-2">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                                active
                                    ? "text-content-primary border-primary"
                                    : "text-gray-500 border-transparent hover:text-content-primary hover:border-gray-300",
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </Link>
                    );
                })}
            </nav>
            {children}
        </div>
    );
}
