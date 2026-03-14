"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    FileText,
    DollarSign,
    Megaphone,
    GitBranch,
    Settings,
} from "lucide-react";
import { cn } from "@/components/utils";

const TABS: { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/dashboard/users", label: "사용자", icon: Users },
    { href: "/admin/dashboard/leads", label: "리드", icon: FileText },
    { href: "/admin/dashboard/revenue", label: "매출", icon: DollarSign },
    { href: "/admin/dashboard/ads", label: "광고", icon: Megaphone },
    { href: "/admin/dashboard/funnel", label: "퍼널", icon: GitBranch },
    { href: "/admin/dashboard/operations", label: "운영", icon: Settings },
];

export default function DashboardNav() {
    const pathname = usePathname();

    const isActive = (tab: (typeof TABS)[number]) => {
        if (tab.exact) {
            return pathname === tab.href;
        }
        return pathname.startsWith(tab.href);
    };

    return (
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
    );
}
