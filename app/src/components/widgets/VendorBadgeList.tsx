"use client";

import { ShieldCheck, Zap, Trophy, Crown, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge/Badge";
import type { BadgeColor } from "@/components/ui/Badge/Badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip/Tooltip";
import { cn } from "@/components/utils";
import { BADGE_DISPLAY_CONFIG, type VendorBadge, type VendorBadgeType } from "@/lib/schema/badge";

const BADGE_ICONS: Record<VendorBadgeType, LucideIcon> = {
    verified: ShieldCheck,
    fast_response: Zap,
    top_rated: Trophy,
    premium_partner: Crown,
    new_vendor: Sparkles,
};

interface VendorBadgeListProps {
    badges: VendorBadge[];
    maxCount?: number;
    size?: "compact" | "default";
    className?: string;
}

export function VendorBadgeList({ badges, maxCount, size = "default", className }: VendorBadgeListProps) {
    if (!badges || badges.length === 0) return null;

    const sorted = [...badges].sort(
        (a, b) => (BADGE_DISPLAY_CONFIG[a.type]?.priority ?? 99) - (BADGE_DISPLAY_CONFIG[b.type]?.priority ?? 99),
    );

    const visible = maxCount ? sorted.slice(0, maxCount) : sorted;
    const remaining = maxCount ? Math.max(0, sorted.length - maxCount) : 0;
    const badgeSize = size === "compact" ? "xs" as const : "sm" as const;

    return (
        <div className={cn("flex flex-wrap gap-1.5", className)}>
            {visible.map((badge) => {
                const config = BADGE_DISPLAY_CONFIG[badge.type];
                if (!config) return null;
                const Icon = BADGE_ICONS[badge.type];

                return (
                    <Tooltip key={badge.type}>
                        <TooltipTrigger asChild>
                            <span>
                                <Badge
                                    size={badgeSize}
                                    color={config.color as BadgeColor}
                                    LeadingIcon={<Icon />}
                                >
                                    {badge.label}
                                </Badge>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            {badge.type === "top_rated"
                                ? `카테고리 내 평점·리뷰 ${badge.label} 업체입니다`
                                : config.description}
                        </TooltipContent>
                    </Tooltip>
                );
            })}
            {remaining > 0 && (
                <Badge size={badgeSize} color="neutral">
                    +{remaining}
                </Badge>
            )}
        </div>
    );
}
