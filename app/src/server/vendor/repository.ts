import type { Database } from "@/lib/database.types";
import type { CategoryView } from "@/lib/schema/category";
import type { VendorPortfolio } from "@/lib/schema/vendor";
import { internalServerError } from "@/server/api/errors";
import { mapCategoryRow } from "@/server/category/mapper";
import { mapVendorPortfolio, mapVendorPortfolioAsset } from "@/server/vendor/mapper";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchVendorCategories(
    supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<CategoryView[]> {
    const { data, error } = await supabase
        .from("vendor_categories")
        .select("categories(*)")
        .eq("vendor_id", vendorId);

    if (error) {
        throw internalServerError("업체 카테고리를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const items: CategoryView[] = [];
    for (const row of data ?? []) {
        const category = (row as unknown as { categories: any }).categories;
        if (category) items.push(mapCategoryRow(category));
    }

    return items;
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

