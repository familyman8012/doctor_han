import type { Tables } from "@/lib/database.types";
import type { z } from "zod";
import { VendorListQuerySchema } from "@/lib/schema/vendor";
import { internalServerError } from "@/server/api/errors";
import { buildOrIlikeFilter } from "@/server/api/postgrest";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { mapVendorListItem } from "@/server/vendor/mapper";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

type VendorRow = Tables<"vendors">;
type ParsedQuery = z.infer<typeof VendorListQuerySchema>;

// Supabase 쿼리 빌더에 공통 필터 및 정렬 적용
function applyFiltersAndSort<T>(qb: T, query: ParsedQuery): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase 쿼리 빌더 체이닝
    let result = qb as any;

    if (query.q) {
        const orFilter = buildOrIlikeFilter(["name", "summary", "description"], query.q);
        if (orFilter) {
            result = result.or(orFilter);
        }
    }

    if (typeof query.priceMin !== "undefined") {
        result = result.gte("price_max", query.priceMin);
    }

    if (typeof query.priceMax !== "undefined") {
        result = result.lte("price_min", query.priceMax);
    }

    if (query.sort === "rating") {
        result = result.order("rating_avg", { ascending: false });
        result = result.order("review_count", { ascending: false });
    } else {
        result = result.order("created_at", { ascending: false });
    }

    return result as T;
}

export const GET = withApi(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = VendorListQuerySchema.parse({
        q: searchParams.get("q") ?? undefined,
        categoryId: searchParams.get("categoryId") ?? undefined,
        priceMin: searchParams.get("priceMin") ?? undefined,
        priceMax: searchParams.get("priceMax") ?? undefined,
        sort: searchParams.get("sort") ?? undefined,
        page: searchParams.get("page") ?? undefined,
        pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const supabase = await createSupabaseServerClient();

    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;

    // categoryId가 있으면 vendor_categories와 inner join
    const baseQuery = query.categoryId
        ? supabase
              .from("vendors")
              .select("*, vendor_categories!inner(category_id)", { count: "exact" })
              .eq("vendor_categories.category_id", query.categoryId)
        : supabase.from("vendors").select("*", { count: "exact" });

    // 공통 필터 및 정렬 적용
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase 쿼리 빌더 타입 호환성
    const filteredQuery = applyFiltersAndSort(baseQuery as any, query);

    const { data, error, count } = await filteredQuery.range(from, to);

    if (error) {
        throw internalServerError("업체 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return ok({
        items: (data ?? []).map((row: VendorRow) => mapVendorListItem(row)),
        page: query.page,
        pageSize: query.pageSize,
        total: count ?? 0,
    });
});
