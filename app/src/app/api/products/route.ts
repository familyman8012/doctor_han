import type { z } from "zod";
import { ProductListQuerySchema } from "@/lib/schema/product";
import { internalServerError } from "@/server/api/errors";
import { buildOrIlikeFilter } from "@/server/api/postgrest";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { getCategoryWithDescendantIds } from "@/server/category/helpers";
import { mapProductListItem, resolveProductImageUrl } from "@/server/product/mapper";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

type ParsedQuery = z.infer<typeof ProductListQuerySchema>;

function applyFiltersAndSort<T>(qb: T, query: ParsedQuery, matchedVendorIds: string[] = []): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result = qb as any;

    if (query.q) {
        const baseFilter = buildOrIlikeFilter(["title", "summary", "description"], query.q);
        // 업체명(vendors.name)도 검색 대상 — 매칭되는 vendor_id들을 in 필터로 포함
        const parts: string[] = [];
        if (baseFilter) parts.push(baseFilter);
        if (matchedVendorIds.length > 0) {
            parts.push(`vendor_id.in.(${matchedVendorIds.join(",")})`);
        }
        if (parts.length > 0) {
            result = result.or(parts.join(","));
        }
    }

    if (query.vendorId) {
        result = result.eq("vendor_id", query.vendorId);
    }

    if (typeof query.priceMin !== "undefined") {
        result = result.or(
            `and(price_type.eq.fixed,price_min.gte.${query.priceMin}),and(price_type.eq.range,price_max.gte.${query.priceMin})`,
        );
    }

    if (typeof query.priceMax !== "undefined") {
        result = result.or(
            `and(price_type.eq.fixed,price_min.lte.${query.priceMax}),and(price_type.eq.range,price_min.lte.${query.priceMax})`,
        );
    }

    if (typeof query.ratingMin !== "undefined") {
        result = result.gte("rating_avg", query.ratingMin);
    }

    // Sorting
    switch (query.sort) {
        case "rating":
            result = result.order("rating_avg", { ascending: false });
            result = result.order("review_count", { ascending: false });
            break;
        case "reviewCount":
            result = result.order("review_count", { ascending: false });
            result = result.order("rating_avg", { ascending: false });
            break;
        case "popular":
            result = result.order("view_count", { ascending: false });
            break;
        case "priceAsc":
            result = result.order("price_min", { ascending: true, nullsFirst: false });
            break;
        case "priceDesc":
            result = result.order("price_max", { ascending: false, nullsFirst: true });
            break;
        case "newest":
        default:
            result = result.order("created_at", { ascending: false });
            break;
    }

    return result as T;
}

export const GET = withApi(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = ProductListQuerySchema.parse({
        q: searchParams.get("q") ?? undefined,
        categoryId: searchParams.get("categoryId") ?? undefined,
        vendorId: searchParams.get("vendorId") ?? undefined,
        priceMin: searchParams.get("priceMin") ?? undefined,
        priceMax: searchParams.get("priceMax") ?? undefined,
        ratingMin: searchParams.get("ratingMin") ?? undefined,
        sort: searchParams.get("sort") ?? undefined,
        page: searchParams.get("page") ?? undefined,
        pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const supabase = await createSupabaseServerClient();

    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;

    // 검색어에 매칭되는 업체 ID 미리 조회 → products.vendor_id 필터에 활용
    let matchedVendorIds: string[] = [];
    if (query.q) {
        const likePattern = `%${query.q}%`;
        const { data: vendorRows } = await supabase
            .from("vendors")
            .select("id")
            .eq("status", "active")
            .ilike("name", likePattern)
            .limit(200);
        matchedVendorIds = ((vendorRows ?? []) as Array<{ id: string }>).map((v) => v.id);
    }

    // 상위 카테고리 선택 시 하위 카테고리의 상품도 포함
    let categoryIds: string[] | null = null;
    if (query.categoryId) {
        categoryIds = await getCategoryWithDescendantIds(supabase, query.categoryId);
    }

    // RLS ensures only 'active' products are visible to non-owners
    const baseQuery = categoryIds
        ? supabase
              .from("products" as never)
              .select("*, vendors!inner(id, name), categories!inner(slug)", { count: "exact" })
              .in("category_id" as never, categoryIds)
        : supabase
              .from("products" as never)
              .select("*, vendors!inner(id, name), categories!inner(slug)", { count: "exact" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredQuery = applyFiltersAndSort(baseQuery as any, query, matchedVendorIds);

    const { data, error, count } = await filteredQuery.eq("status", "active").range(from, to);

    if (error) {
        throw internalServerError("상품 목록을 조회할 수 없습니다.", {
            message: (error as { message: string }).message,
            code: (error as { code: string }).code,
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = ((data as any[]) ?? []).map((row: Record<string, unknown>) => {
        const vendor = row.vendors as { id: string; name: string } | null;
        const category = row.categories as { slug: string } | null;

        // Derive thumbnail from primary image if available (not joined here)
        return mapProductListItem(
            row,
            { id: vendor?.id ?? "", name: vendor?.name ?? "" },
            category?.slug ?? null,
            null, // thumbnails will be enriched below
        );
    });

    // Enrich thumbnails: fetch primary images for all products in the list
    if (items.length > 0) {
        const productIds = items.map((item) => item.id);
        const { data: imageRows } = await supabase
            .from("product_images" as never)
            .select("product_id, file_id, url, is_primary, sort_order")
            .in("product_id" as never, productIds)
            .order("is_primary" as never, { ascending: false })
            .order("sort_order" as never, { ascending: true });

        if (imageRows) {
            const thumbnailMap = new Map<string, string>();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const img of imageRows as any[]) {
                const pid = img.product_id as string;
                if (!thumbnailMap.has(pid)) {
                    const thumbnail = resolveProductImageUrl({
                        fileId: (img.file_id as string) ?? null,
                        url: (img.url as string) ?? null,
                    });
                    if (thumbnail) {
                        thumbnailMap.set(pid, thumbnail);
                    }
                }
            }
            for (const item of items) {
                item.thumbnail = thumbnailMap.get(item.id) ?? null;
            }
        }
    }

    return ok({
        items,
        page: query.page,
        pageSize: query.pageSize,
        total: count ?? 0,
    });
});
