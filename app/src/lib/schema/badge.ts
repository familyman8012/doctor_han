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

export const BADGE_DISPLAY_CONFIG: Record<
    VendorBadgeType,
    { label: string; color: string; description: string; priority: number }
> = {
    verified: { label: "메디허브 인증", color: "success", description: "사업자 인증이 완료된 업체입니다", priority: 1 },
    premium_partner: { label: "프리미엄 파트너", color: "amber", description: "프리미엄 멤버십에 가입한 업체입니다", priority: 2 },
    top_rated: { label: "Top 20%", color: "purple", description: "카테고리 내 평점·리뷰 상위 20% 업체입니다", priority: 3 },
    fast_response: { label: "빠른 응답", color: "info", description: "평균 24시간 이내에 응답하는 업체입니다", priority: 4 },
    new_vendor: { label: "신규 입점", color: "teal", description: "최근 30일 이내에 입점한 업체입니다", priority: 5 },
};
