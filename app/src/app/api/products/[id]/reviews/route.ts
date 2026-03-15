import { zUuid } from "@/lib/schema/common";
import { ReviewListQuerySchema } from "@/lib/schema/review";
import { internalServerError } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { mapReviewReplyRow, mapReviewRow } from "@/server/review/mapper";
import { getRepliesByReviewIds } from "@/server/review/repository";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

/** Product review list uses a smaller default page size (5). */
const ProductReviewListQuerySchema = ReviewListQuerySchema.extend({
    pageSize: z.coerce.number().int().min(1).max(100).default(5),
});

export const GET = withApi(async (req: NextRequest, routeCtx: { params: Promise<{ id: string }> }) => {
    const productId = zUuid.parse((await routeCtx.params).id);

    const { searchParams } = new URL(req.url);
    const query = ProductReviewListQuerySchema.parse({
        sort: searchParams.get("sort") ?? undefined,
        page: searchParams.get("page") ?? undefined,
        pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const supabase = await createSupabaseServerClient();

    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;

    // Sort direction
    const ratingAsc = query.sort === "rating_low";
    const useRatingSort = query.sort === "rating_high" || query.sort === "rating_low";

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseQuery = (supabase as any)
        .from("reviews")
        .select("*", { count: "exact" })
        .eq("product_id", productId)
        .eq("status", "published");

    // Apply sort with tie-breaker
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
        throw internalServerError("상품 리뷰를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const reviewRows = (rows ?? []) as Record<string, unknown>[];
    const reviewIds = reviewRows.map((r) => r.id as string);
    const repliesMap = await getRepliesByReviewIds(supabase, reviewIds);

    const items = reviewRows.map((row) => {
        const replyRow = repliesMap.get(row.id as string);
        return {
            ...mapReviewRow(row as Parameters<typeof mapReviewRow>[0]),
            reply: replyRow ? mapReviewReplyRow(replyRow) : null,
        };
    });

    return ok({
        items,
        page: query.page,
        pageSize: query.pageSize,
        total: count ?? 0,
    });
});
