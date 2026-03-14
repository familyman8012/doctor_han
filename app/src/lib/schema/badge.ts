import { z } from "zod";

export const VendorBadgeTypeSchema = z.enum([
    "verified",
    "fast_response",
    "top_rated",
    "premium_partner",
    "new_vendor",
]);
export type VendorBadgeType = z.infer<typeof VendorBadgeTypeSchema>;

export const VendorBadgeSchema = z.object({
    type: VendorBadgeTypeSchema,
    label: z.string(),
    awardedAt: z.string(),
    meta: z.record(z.string(), z.unknown()).optional(),
});
export type VendorBadge = z.infer<typeof VendorBadgeSchema>;

export const VendorBadgeListSchema = z.array(VendorBadgeSchema);

export const BADGE_DISPLAY_CONFIG: Record<VendorBadgeType, { label: string; color: string }> = {
    verified: { label: "메디허브 인증", color: "success" },
    fast_response: { label: "빠른 응답", color: "info" },
    top_rated: { label: "Top 20%", color: "purple" },
    premium_partner: { label: "프리미엄 파트너", color: "amber" },
    new_vendor: { label: "신규 입점", color: "teal" },
};
