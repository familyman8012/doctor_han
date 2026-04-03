import type { Database, Tables } from "@/lib/database.types";
import type { CategoryView } from "@/lib/schema/category";
import type { VendorPortfolio } from "@/lib/schema/vendor";
import type { VendorServicePrice } from "@/lib/schema/vendor-pricing";
import { internalServerError } from "@/server/api/errors";
import { mapCategoryRow } from "@/server/category/mapper";
import { mapVendorPortfolio, mapVendorPortfolioAsset } from "@/server/vendor/mapper";
import { mapVendorServicePriceRow } from "@/server/vendor/pricing-mapper";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type VendorThumbnail = {
    fileId: string | null;
    url: string | null;
} | null;

export async function fetchVendorCategories(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<CategoryView[]> {
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
        .from("vendor_categories")
        .select("category_id")
        .eq("vendor_id", vendorId);

    if (error) {
        throw internalServerError("업체 카테고리를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const categoryIds = Array.from(
        new Set((data ?? []).map((row) => row.category_id).filter((id): id is string => Boolean(id))),
    );

    if (categoryIds.length === 0) {
        return [];
    }

    const { data: categoryRows, error: categoryError } = await admin
        .from("categories")
        .select("*")
        .in("id", categoryIds);

    if (categoryError) {
        throw internalServerError("카테고리 상세를 조회할 수 없습니다.", {
            message: categoryError.message,
            code: categoryError.code,
        });
    }

    const categoryMap = new Map((categoryRows ?? []).map((row) => [row.id, mapCategoryRow(row)]));
    const items = categoryIds
        .map((categoryId) => categoryMap.get(categoryId))
        .filter((category): category is CategoryView => Boolean(category));

    items.sort((a, b) => a.depth - b.depth || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ko"));
    return items;
}

export async function fetchVendorCategoriesByVendorIds(
    _supabase: SupabaseClient<Database>,
    vendorIds: string[],
): Promise<Map<string, CategoryView[]>> {
    const result = new Map<string, CategoryView[]>();
    if (vendorIds.length === 0) return result;
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
        .from("vendor_categories")
        .select("vendor_id, category_id")
        .in("vendor_id", vendorIds);

    if (error) {
        throw internalServerError("업체 카테고리를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const vendorCategoryRows = data ?? [];
    const categoryIds = Array.from(
        new Set(vendorCategoryRows.map((row) => row.category_id).filter((id): id is string => Boolean(id))),
    );

    if (categoryIds.length === 0) {
        return result;
    }

    const { data: categoryRows, error: categoryError } = await admin
        .from("categories")
        .select("*")
        .in("id", categoryIds);

    if (categoryError) {
        throw internalServerError("카테고리 상세를 조회할 수 없습니다.", {
            message: categoryError.message,
            code: categoryError.code,
        });
    }

    const categoryMap = new Map((categoryRows ?? []).map((row) => [row.id, mapCategoryRow(row)]));

    for (const row of vendorCategoryRows) {
        const category = categoryMap.get(row.category_id);
        if (!category) continue;
        const list = result.get(row.vendor_id) ?? [];
        list.push(category);
        result.set(row.vendor_id, list);
    }

    for (const [vendorId, list] of result) {
        list.sort((a, b) => a.depth - b.depth || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ko"));
        result.set(vendorId, list);
    }

    return result;
}

export async function fetchVendorThumbnailsByVendorIds(
    supabase: SupabaseClient<Database>,
    vendorIds: string[],
): Promise<Map<string, VendorThumbnail>> {
    const thumbnails = new Map<string, VendorThumbnail>();
    if (vendorIds.length === 0) return thumbnails;

    type VendorPortfolioRow = Tables<"vendor_portfolios">;
    type VendorPortfolioAssetRow = Tables<"vendor_portfolio_assets">;

    const { data: portfolios, error: portfolioError } = await supabase
        .from("vendor_portfolios")
        .select("id, vendor_id, sort_order, created_at")
        .in("vendor_id", vendorIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    if (portfolioError) {
        throw internalServerError("포트폴리오를 조회할 수 없습니다.", {
            message: portfolioError.message,
            code: portfolioError.code,
        });
    }

    const portfolioVendorIdById = new Map<string, string>();
    const firstPortfolioIdByVendorId = new Map<string, string>();

    for (const portfolio of (portfolios ?? []) as VendorPortfolioRow[]) {
        portfolioVendorIdById.set(portfolio.id, portfolio.vendor_id);
        if (!firstPortfolioIdByVendorId.has(portfolio.vendor_id)) {
            firstPortfolioIdByVendorId.set(portfolio.vendor_id, portfolio.id);
        }
    }

    const portfolioIds = [...firstPortfolioIdByVendorId.values()];
    if (portfolioIds.length === 0) return thumbnails;

    const { data: assets, error: assetError } = await supabase
        .from("vendor_portfolio_assets")
        .select("portfolio_id, file_id, url, sort_order, created_at")
        .in("portfolio_id", portfolioIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    if (assetError) {
        throw internalServerError("포트폴리오 자산을 조회할 수 없습니다.", {
            message: assetError.message,
            code: assetError.code,
        });
    }

    for (const asset of (assets ?? []) as VendorPortfolioAssetRow[]) {
        const vendorId = portfolioVendorIdById.get(asset.portfolio_id);
        if (!vendorId) continue;
        if (thumbnails.has(vendorId)) continue;
        if (!asset.file_id && !asset.url) continue;
        thumbnails.set(vendorId, {
            fileId: asset.file_id,
            url: asset.url,
        });
    }

    return thumbnails;
}

export async function fetchVendorPortfolios(
    supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<VendorPortfolio[]> {
    const { data: portfolios, error: portfolioError } = await supabase
        .from("vendor_portfolios")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    if (portfolioError) {
        throw internalServerError("포트폴리오를 조회할 수 없습니다.", {
            message: portfolioError.message,
            code: portfolioError.code,
        });
    }

    const portfolioRows = portfolios ?? [];
    const portfolioIds = portfolioRows.map((p) => p.id);

    const assetsByPortfolioId = new Map<string, ReturnType<typeof mapVendorPortfolioAsset>[]>();
    if (portfolioIds.length > 0) {
        const { data: assets, error: assetError } = await supabase
            .from("vendor_portfolio_assets")
            .select("*")
            .in("portfolio_id", portfolioIds)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });

        if (assetError) {
            throw internalServerError("포트폴리오 자산을 조회할 수 없습니다.", {
                message: assetError.message,
                code: assetError.code,
            });
        }

        for (const asset of assets ?? []) {
            const mapped = mapVendorPortfolioAsset(asset);
            const list = assetsByPortfolioId.get(mapped.portfolioId) ?? [];
            list.push(mapped);
            assetsByPortfolioId.set(mapped.portfolioId, list);
        }
    }

    return portfolioRows.map((portfolio) => mapVendorPortfolio(portfolio, assetsByPortfolioId.get(portfolio.id) ?? []));
}

export async function fetchVendorServicePricesPublic(vendorId: string): Promise<VendorServicePrice[]> {
    const admin = createSupabaseAdminClient();

    const { data: rows, error } = await admin
        .from("vendor_service_prices")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("status", "active");

    if (error) {
        throw internalServerError("서비스 단가를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (!rows || rows.length === 0) return [];

    const categoryIds = [...new Set(rows.map((r) => r.category_id))];
    const { data: categoryRows } = await admin.from("categories").select("*").in("id", categoryIds);

    const categoryMap = new Map((categoryRows ?? []).map((c) => [c.id, mapCategoryRow(c)]));

    return rows.map((row) => mapVendorServicePriceRow(row, categoryMap.get(row.category_id)));
}
