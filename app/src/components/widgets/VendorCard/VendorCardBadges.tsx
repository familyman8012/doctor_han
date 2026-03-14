import { Badge } from "@/components/ui/Badge/Badge";
import type { BadgeColor } from "@/components/ui/Badge/Badge";
import { BADGE_DISPLAY_CONFIG, type VendorBadge, type VendorBadgeType } from "@/lib/schema/badge";

const BADGE_PRIORITY: VendorBadgeType[] = [
    "verified",
    "premium_partner",
    "top_rated",
    "fast_response",
    "new_vendor",
];

interface VendorCardBadgesProps {
    badges: VendorBadge[];
    maxBadges?: number;
}

export function VendorCardBadges({ badges, maxBadges = 2 }: VendorCardBadgesProps) {
    if (badges.length === 0) return null;

    const displayBadges = BADGE_PRIORITY
        .map((type) => badges.find((b) => b.type === type))
        .filter((b): b is VendorBadge => b !== undefined)
        .slice(0, maxBadges);

    if (displayBadges.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1">
            {displayBadges.map((badge) => {
                const config = BADGE_DISPLAY_CONFIG[badge.type];
                return (
                    <Badge
                        key={badge.type}
                        size="xs"
                        color={config.color as BadgeColor}
                        fill="fill"
                    >
                        {badge.label}
                    </Badge>
                );
            })}
        </div>
    );
}
