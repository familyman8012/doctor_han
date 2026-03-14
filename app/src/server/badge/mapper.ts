import { VendorBadgeListSchema, type VendorBadge } from "@/lib/schema/badge";

export function parseBadgesFromJson(jsonValue: unknown): VendorBadge[] {
    const result = VendorBadgeListSchema.safeParse(jsonValue);
    return result.success ? result.data : [];
}
