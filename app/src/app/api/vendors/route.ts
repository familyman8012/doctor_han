import { VendorListQuerySchema } from "@/lib/schema/vendor";
import { internalServerError } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { mapVendorListItem } from "@/server/vendor/mapper";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

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

    const select = query.categoryId ? "*, vendor_categories!inner(category_id)" : "*";
    let qb = supabase.from("vendors").select(select, { count: "exact" });

    if (query.categoryId) {
        qb = qb.eq("vendor_categories.category_id", query.categoryId);
    }

    if (query.q) {
        const escaped = query.q.replaceAll("%", "\\%").replaceAll("_", "\\_");
        qb = qb.or(`name.ilike.%${escaped}%,summary.ilike.%${escaped}%,description.ilike.%${escaped}%`);
    }

    if (typeof query.priceMin !== "undefined") {
        qb = qb.gte("price_max", query.priceMin);
    }

    if (typeof query.priceMax !== "undefined") {
        qb = qb.lte("price_min", query.priceMax);
    }

    if (query.sort === "rating") {
        qb = qb.order("rating_avg", { ascending: false });
        qb = qb.order("review_count", { ascending: false });
    } else {
        qb = qb.order("created_at", { ascending: false });
    }

    const { data, error, count } = await qb.range(from, to);

    if (error) {
        throw internalServerError("업체 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return ok({
        items: (data ?? []).map((row: any) => mapVendorListItem(row)),
        page: query.page,
        pageSize: query.pageSize,
        total: count ?? 0,
    });
});

