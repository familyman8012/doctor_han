import type { Tables } from "@/lib/database.types";
import type { z } from "zod";
import { getRegionFilterValues } from "@/lib/constants/regions";
import { VendorListQuerySchema, type VendorListItem } from "@/lib/schema/vendor";
import { internalServerError } from "@/server/api/errors";
import { buildOrIlikeFilter } from "@/server/api/postgrest";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { getCategoryWithDescendantIds } from "@/server/category/helpers";
import { mapVendorListItem } from "@/server/vendor/mapper";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
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

    // 지역 필터: region_primary는 TEXT[] 배열 → overlaps로 매칭
    // 업체가 "전국" 선택한 경우도 모든 지역 필터에 매칭되도록 포함
    if (query.regionPrimary) {
        const regionFilterValues = getRegionFilterValues(query.regionPrimary);
        const overlapsValues = Array.from(new Set([...regionFilterValues, "전국"]));
        result = result.overlaps("region_primary", overlapsValues);
    }
    if (query.regionSecondary) {
        result = result.ilike("region_secondary", `%${query.regionSecondary}%`);
    }

    // 평점 필터
    if (typeof query.ratingMin !== "undefined") {
        result = result.gte("rating_avg", query.ratingMin);
    }

    // 리뷰 유무 필터
    if (query.hasReviews === "true") {
        result = result.gt("review_count", 0);
    } else if (query.hasReviews === "false") {
        result = result.eq("review_count", 0);
    }

    // 배지 필터
    if (query.badgeTypes?.length) {
        for (const bt of query.badgeTypes) {
            result = result.contains("badges", JSON.stringify([{ type: bt }]));
        }
    }

    // 정렬
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
            result = result.order("popularity_score", { ascending: false });
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
    const query = VendorListQuerySchema.parse({
        q: searchParams.get("q") ?? undefined,
        categoryId: searchParams.get("categoryId") ?? undefined,
        regionPrimary: searchParams.get("regionPrimary") ?? undefined,
        regionSecondary: searchParams.get("regionSecondary") ?? undefined,
        ratingMin: searchParams.get("ratingMin") ?? undefined,
        hasReviews: searchParams.get("hasReviews") ?? undefined,
        badgeTypes: searchParams.get("badgeTypes") ?? undefined,
        sort: searchParams.get("sort") ?? undefined,
        page: searchParams.get("page") ?? undefined,
        pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const supabase = await createSupabaseServerClient();

    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;

    // 상위 카테고리 선택 시 하위 카테고리까지 포함
    let categoryIds: string[] | null = null;
    if (query.categoryId) {
        categoryIds = await getCategoryWithDescendantIds(supabase, query.categoryId);
    }

    // categoryId가 있으면 vendor_categories와 inner join
    const baseQuery = categoryIds
        ? supabase
              .from("vendors")
              .select("*, vendor_categories!inner(category_id)", { count: "exact" })
              .in("vendor_categories.category_id", categoryIds)
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

    const items = (data ?? []).map((row: VendorRow) => mapVendorListItem(row));

    // S등급 카테고리로 조회 시: 활성 멤버십 업체 상단, 미납 업체 하단 재정렬
    if (query.categoryId && items.length > 0) {
        const adminClient = createSupabaseAdminClient();
        const { data: catRow, error: catError } = await adminClient
            .from("categories")
            .select("tier")
            .eq("id", query.categoryId)
            .maybeSingle();

        if (catError) {
            throw internalServerError("카테고리 정보를 조회할 수 없습니다.", {
                message: catError.message,
                code: catError.code,
            });
        }

        if (catRow?.tier === "s_grade") {
            const vendorIds = items.map((item: VendorListItem) => item.id);
            const { data: membershipRows, error: membershipError } = await adminClient
                .from("vendor_memberships")
                .select("vendor_id")
                .in("vendor_id", vendorIds)
                .eq("status", "active")
                .gt("expires_at", new Date().toISOString());

            if (membershipError) {
                throw internalServerError("멤버십 정보를 조회할 수 없습니다.", {
                    message: membershipError.message,
                    code: membershipError.code,
                });
            }

            const activeVendorIds = new Set((membershipRows ?? []).map((r) => r.vendor_id));

            items.sort((a: VendorListItem, b: VendorListItem) => {
                const aActive = activeVendorIds.has(a.id) ? 1 : 0;
                const bActive = activeVendorIds.has(b.id) ? 1 : 0;
                return bActive - aActive;
            });
        }
    }

    return ok({
        items,
        page: query.page,
        pageSize: query.pageSize,
        total: count ?? 0,
    });
});
