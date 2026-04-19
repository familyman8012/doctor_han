"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/utils";

const TABS: { href: string; label: string; matchPrefix: string }[] = [
    { href: "/admin/ads/campaigns", label: "캠페인 관리", matchPrefix: "/admin/ads/campaigns" },
    { href: "/admin/ads/priority", label: "우선순위 노출 현황", matchPrefix: "/admin/ads/priority" },
    { href: "/admin/ads/reports", label: "광고 리포트", matchPrefix: "/admin/ads/reports" },
];

export default function AdminAdsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-5">
            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
                {TABS.map((tab) => {
                    const active = pathname.startsWith(tab.matchPrefix);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                                active
                                    ? "border-primary text-primary"
                                    : "border-transparent text-gray-500 hover:text-content-primary hover:border-gray-300",
                            )}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            {children}
        </div>
    );
}
