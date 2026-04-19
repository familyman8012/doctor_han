import { ReviewListQuerySchema } from "@/lib/schema/review";
import { zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { mapReviewRow, mapReviewReplyRow } from "@/server/review/mapper";
import { getRepliesByReviewIds, getVendorRatingDistribution, getVendorSubRatingSummary } from "@/server/review/repository";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

export const GET = withApi(async (req: NextRequest, routeCtx: { params: Promise<{ id: string }> }) => {
    const vendorId = zUuid.parse((await routeCtx.params).id);

    const { searchParams } = new URL(req.url);
    const query = ReviewListQuerySchema.parse({
        sort: searchParams.get("sort") ?? undefined,
        page: searchParams.get("page") ?? undefined,
        pageSize: searchParams.get("pageSize") ?? undefined,
        photoOnly: searchParams.get("photoOnly") ?? undefined,
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

    if (!vendor) throw notFound("업체를 찾을 수 없습니다.");

    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;

    // 정렬 방향 설정
    const ratingAsc = query.sort === "rating_low";
    const useRatingSort = query.sort === "rating_high" || query.sort === "rating_low";

    // 쿼리 빌드
    const baseQuery = supabase
        .from("reviews")
        .select("*, product:products(id, title), lead:leads(id, service_name, category_ids)", { count: "exact" })
        .eq("vendor_id", vendorId)
        .eq("status", "published");

    const filteredBaseQuery = query.photoOnly
        ? baseQuery.not("photo_file_ids", "eq", "{}")
        : baseQuery;

    const photoReviewCountQuery = supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("vendor_id", vendorId)
        .eq("status", "published")
        .not("photo_file_ids", "eq", "{}");

    // 정렬 적용 (tie-breaker로 id 추가)
    const sortedQuery = useRatingSort
        ? filteredBaseQuery
              .order("rating", { ascending: ratingAsc })
              .order("created_at", { ascending: false })
              .order("id", { ascending: false })
        : filteredBaseQuery
              .order("created_at", { ascending: false })
              .order("id", { ascending: false });

    const [
        { data: rows, error, count },
        subRatingSummary,
        ratingDistribution,
        { count: photoReviewCount, error: photoReviewCountError },
    ] = await Promise.all([
        sortedQuery.range(from, to),
        getVendorSubRatingSummary(supabase, vendorId),
        getVendorRatingDistribution(supabase, vendorId).catch(() => []),
        photoReviewCountQuery,
    ]);

    if (error) {
        throw internalServerError("리뷰를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (photoReviewCountError) {
        throw internalServerError("사진 리뷰 수를 조회할 수 없습니다.", {
            message: photoReviewCountError.message,
            code: photoReviewCountError.code,
        });
    }

    const reviewRows = rows ?? [];
    const reviewIds = reviewRows.map((r) => r.id);
    const repliesMap = await getRepliesByReviewIds(supabase, reviewIds);

    // 리뷰들의 lead.category_ids에 등장하는 카테고리 id → name 맵 생성
    type ReviewRowWithJoins = (typeof reviewRows)[number] & {
        product?: { id: string; title: string } | null;
        lead?: { id: string; service_name: string | null; category_ids: string[] | null } | null;
    };
    const categoryIdSet = new Set<string>();
    for (const row of reviewRows as ReviewRowWithJoins[]) {
        const ids = row.lead?.category_ids ?? [];
        for (const cid of ids) {
            if (cid) categoryIdSet.add(cid);
        }
    }
    const categoryNameMap = new Map<string, string>();
    if (categoryIdSet.size > 0) {
        const { data: categoryRows } = await supabase
            .from("categories")
            .select("id, name")
            .in("id", Array.from(categoryIdSet));
        for (const c of categoryRows ?? []) {
            categoryNameMap.set(c.id, c.name);
        }
    }

    const items = (reviewRows as ReviewRowWithJoins[]).map((row) => {
        const replyRow = repliesMap.get(row.id);
        const firstCategoryId = row.lead?.category_ids?.[0] ?? null;
        const categoryName = firstCategoryId ? (categoryNameMap.get(firstCategoryId) ?? null) : null;
        return {
            ...mapReviewRow(row),
            reply: replyRow ? mapReviewReplyRow(replyRow) : null,
            productName: row.product?.title ?? null,
            leadServiceName: row.lead?.service_name ?? null,
            categoryName,
        };
    });

    // Resolve review photo URLs
    const allPhotoFileIds = reviewRows.flatMap((r) => (r.photo_file_ids as string[]) ?? []);
    const photoUrlMap = new Map<string, string>();

    if (allPhotoFileIds.length > 0) {
        const admin = createSupabaseAdminClient();
        const { data: fileRows } = await admin
            .from("files")
            .select("id, bucket, path")
            .in("id", allPhotoFileIds);

        if (fileRows) {
            const signPromises = fileRows.map(async (file) => {
                const { data: signed } = await admin.storage
                    .from(file.bucket)
                    .createSignedUrl(file.path, 600); // 10 min
                if (signed?.signedUrl) {
                    photoUrlMap.set(file.id, signed.signedUrl);
                }
            });
            await Promise.all(signPromises);
        }
    }

    const itemsWithPhotos = items.map((item) => ({
        ...item,
        photoUrls: (item.photoFileIds ?? [])
            .map((id: string) => photoUrlMap.get(id))
            .filter((url): url is string => Boolean(url)),
    }));

    return ok({
        items: itemsWithPhotos,
        page: query.page,
        pageSize: query.pageSize,
        total: count ?? 0,
        photoReviewCount: photoReviewCount ?? 0,
        subRatingSummary,
        ratingDistribution,
    });
});
