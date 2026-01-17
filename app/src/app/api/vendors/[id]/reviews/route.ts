import { ReviewListQuerySchema } from "@/lib/schema/review";
import { zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { mapReviewRow } from "@/server/review/mapper";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

export const GET = withApi(async (req: NextRequest, routeCtx: { params: Promise<{ id: string }> }) => {
    const vendorId = zUuid.parse((await routeCtx.params).id);

    const { searchParams } = new URL(req.url);
    const query = ReviewListQuerySchema.parse({
        sort: searchParams.get("sort") ?? undefined,
        page: searchParams.get("page") ?? undefined,
        pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const supabase = await createSupabaseServerClient();

    const { data: vendor, error: vendorError } = await supabase
        .from("vendors")
        .select("id")
        .eq("id", vendorId)
        .eq("status", "active")
        .maybeSingle();

    if (vendorError) {
        throw internalServerError("업체를 확인할 수 없습니다.", {
            message: vendorError.message,
            code: vendorError.code,
        });
    }

    if (!vendor) {
        throw notFound("업체를 찾을 수 없습니다.");
    }

    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;

    // 정렬 방향 설정
    const ratingAsc = query.sort === "rating_low";
    const useRatingSort = query.sort === "rating_high" || query.sort === "rating_low";

    // 쿼리 빌드
    const baseQuery = supabase
        .from("reviews")
        .select("*", { count: "exact" })
        .eq("vendor_id", vendorId)
        .eq("status", "published");

    // 정렬 적용 (tie-breaker로 id 추가)
    const sortedQuery = useRatingSort
        ? baseQuery
              .order("rating", { ascending: ratingAsc })
              .order("created_at", { ascending: false })
              .order("id", { ascending: false })
        : baseQuery
              .order("created_at", { ascending: false })
              .order("id", { ascending: false });

    const { data: rows, error, count } = await sortedQuery.range(from, to);

    if (error) {
        throw internalServerError("리뷰를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return ok({
        items: (rows ?? []).map(mapReviewRow),
        page: query.page,
        pageSize: query.pageSize,
        total: count ?? 0,
    });
});
