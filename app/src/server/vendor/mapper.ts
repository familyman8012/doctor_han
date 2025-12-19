import type { Tables } from "@/lib/database.types";
import type { VendorDetail, VendorListItem, VendorPortfolio, VendorPortfolioAsset } from "@/lib/schema/vendor";

type VendorRow = Tables<"vendors">;
type VendorPortfolioRow = Tables<"vendor_portfolios">;
type VendorPortfolioAssetRow = Tables<"vendor_portfolio_assets">;

export function mapVendorListItem(row: VendorRow): VendorListItem {
    return {
        id: row.id,
        name: row.name,
        summary: row.summary,
        regionPrimary: row.region_primary,
        regionSecondary: row.region_secondary,
        priceMin: row.price_min,
        priceMax: row.price_max,
        ratingAvg: row.rating_avg,
        reviewCount: row.review_count,
    };
}

export function mapVendorPortfolioAsset(row: VendorPortfolioAssetRow): VendorPortfolioAsset {
    return {
        id: row.id,
        portfolioId: row.portfolio_id,
        fileId: row.file_id,
        url: row.url,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
    };
}

export function mapVendorPortfolio(row: VendorPortfolioRow, assets: VendorPortfolioAsset[]): VendorPortfolio {
    return {
        id: row.id,
        vendorId: row.vendor_id,
        title: row.title,
        description: row.description,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        assets,
    };
}

export function mapVendorDetail(input: {
    vendor: VendorRow;
    ownerUserId?: string;
    categories: VendorDetail["categories"];
    portfolios: VendorDetail["portfolios"];
}): VendorDetail {
    const row = input.vendor;
    return {
        ...mapVendorListItem(row),
        ...(input.ownerUserId ? { ownerUserId: input.ownerUserId } : {}),
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        categories: input.categories,
        portfolios: input.portfolios,
    };
}

