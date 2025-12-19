import type { Tables } from "@/lib/database.types";
import type {
    AdminDoctorVerificationListItem,
    AdminVendorListItem,
    AdminVendorVerificationListItem,
} from "@/lib/schema/admin";
import { mapCategoryRow } from "@/server/category/mapper";
import { mapProfileRow } from "@/server/profile/mapper";
import { mapDoctorVerificationRow, mapVendorVerificationRow } from "@/server/verification/mapper";

type ProfileRow = Tables<"profiles">;
type CategoryRow = Tables<"categories">;
type VendorRow = Tables<"vendors">;
type DoctorVerificationRow = Tables<"doctor_verifications">;
type VendorVerificationRow = Tables<"vendor_verifications">;

export function mapAdminDoctorVerificationListItemRow(row: DoctorVerificationRow & { user: ProfileRow }): AdminDoctorVerificationListItem {
    return {
        type: "doctor",
        user: mapProfileRow(row.user),
        verification: mapDoctorVerificationRow(row),
    };
}

export function mapAdminVendorVerificationListItemRow(row: VendorVerificationRow & { user: ProfileRow }): AdminVendorVerificationListItem {
    return {
        type: "vendor",
        user: mapProfileRow(row.user),
        verification: mapVendorVerificationRow(row),
    };
}

export function mapAdminVendorListItemRow(input: {
    vendor: VendorRow;
    owner: ProfileRow;
    categories: CategoryRow[];
    vendorVerification: VendorVerificationRow | null;
}): AdminVendorListItem {
    const row = input.vendor;

    return {
        id: row.id,
        ownerUserId: row.owner_user_id,
        owner: mapProfileRow(input.owner),
        name: row.name,
        summary: row.summary,
        regionPrimary: row.region_primary,
        regionSecondary: row.region_secondary,
        priceMin: row.price_min,
        priceMax: row.price_max,
        status: row.status,
        ratingAvg: row.rating_avg,
        reviewCount: row.review_count,
        vendorVerification: input.vendorVerification ? mapVendorVerificationRow(input.vendorVerification) : null,
        categories: input.categories.map(mapCategoryRow),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

