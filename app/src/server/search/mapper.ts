import "server-only";

import type { VendorListItem } from "@/lib/schema/vendor";
import type { RankedVendorRow } from "./repository";

export function mapRankedVendorRow(row: RankedVendorRow): VendorListItem {
    return {
        id: row.id,
        name: row.name,
        summary: row.summary,
        regionPrimary: row.region_primary,
        regionSecondary: row.region_secondary,
        roadAddress: row.road_address,
        jibunAddress: row.jibun_address,
        addressDetail: row.address_detail,
        zonecode: row.zonecode,
        latitude: row.latitude,
        longitude: row.longitude,
        priceMin: row.price_min,
        priceMax: row.price_max,
        ratingAvg: row.rating_avg,
        reviewCount: row.review_count,
    };
}
