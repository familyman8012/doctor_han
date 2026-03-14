"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adsApi } from "@/api-client/ads";
import type { PriorityVendor } from "@/lib/schema/ad";
import { cn } from "@/components/utils";

interface PriorityVendorSectionProps {
    categoryId: string;
}

const TIER_STYLES: Record<string, { border: string; bg: string; badge: string; label: string }> = {
    premium: {
        border: "border-amber-400",
        bg: "bg-amber-50",
        badge: "bg-amber-400 text-white",
        label: "Premium",
    },
    plus_up: {
        border: "border-gray-400",
        bg: "bg-gray-50",
        badge: "bg-gray-400 text-white",
        label: "Plus+",
    },
    plus: {
        border: "border-blue-400",
        bg: "bg-blue-50",
        badge: "bg-blue-400 text-white",
        label: "Plus",
    },
    rookie: {
        border: "border-gray-300",
        bg: "bg-white",
        badge: "bg-gray-300 text-gray-700",
        label: "Rookie",
    },
};

function PriorityVendorCard({ vendor }: { vendor: PriorityVendor }) {
    const style = TIER_STYLES[vendor.tier] ?? TIER_STYLES.rookie;

    return (
        <Link
            href={`/vendors/${vendor.vendorId}`}
            className={cn(
                "block rounded-xl border-2 p-4 transition-all hover:shadow-lg hover:border-primary",
                style.border,
                style.bg,
                vendor.isJumpedUp && "animate-pulse border-amber-400 ring-2 ring-amber-200",
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-content-primary truncate">{vendor.vendorName}</h3>
                    {vendor.vendorSummary && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{vendor.vendorSummary}</p>
                    )}
                </div>
                <span className={cn("shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full", style.badge)}>
                    {style.label}
                </span>
            </div>
        </Link>
    );
}

export function PriorityVendorSection({ categoryId }: PriorityVendorSectionProps) {
    const { data } = useQuery({
        queryKey: ["ads", "priority", categoryId],
        queryFn: () => adsApi.getPriorityVendors({ categoryId }),
        staleTime: 30_000,
        enabled: !!categoryId,
    });

    const vendors = data?.data?.vendors ?? [];

    if (vendors.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-content-primary">추천 파트너</h2>
                <span className="px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 rounded">
                    광고
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {vendors.map((vendor) => (
                    <PriorityVendorCard key={vendor.purchaseId} vendor={vendor} />
                ))}
            </div>
        </div>
    );
}
