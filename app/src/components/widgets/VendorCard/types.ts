import type { VendorBadge } from "@/lib/schema/badge";
import type { CategoryView } from "@/lib/schema/category";

export type VendorCardVariant = "grid" | "carousel" | "list";

export interface VendorCardData {
    id: string;
    name: string;
    summary: string | null;
    regionPrimary: string | null;
    regionSecondary: string | null;
    priceMin: number | null;
    priceMax: number | null;
    ratingAvg: number | null;
    reviewCount: number;
    badges: VendorBadge[];
    categories?: CategoryView[];
    thumbnail?: { fileId: string | null; url: string | null } | null;
}

export interface VendorCardProps {
    vendor: VendorCardData;
    variant?: VendorCardVariant;
    categorySlug?: string;
    isFavorited?: boolean;
    showFavoriteButton?: boolean;
}
