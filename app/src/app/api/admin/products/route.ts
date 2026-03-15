import { z } from "zod";
import { zPaginationQuery, zUuid } from "@/lib/schema/common";
import { ProductStatusSchema } from "@/lib/schema/product";
import { internalServerError } from "@/server/api/errors";
import { buildOrIlikeFilter } from "@/server/api/postgrest";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { fetchProductThumbnailsByProductIds } from "@/server/product/repository";

// ============================================
// Query Schema
// ============================================

const AdminProductListQuerySchema = z
    .object({
        status: ProductStatusSchema.optional(),
        categoryId: zUuid.optional(),
        q: z.string().trim().min(1).optional(),
    })
    .merge(zPaginationQuery);

// ============================================
// GET /api/admin/products
// ============================================

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = AdminProductListQuerySchema.parse({
            status: searchParams.get("status") ?? undefined,
            categoryId: searchParams.get("categoryId") ?? undefined,
            q: searchParams.get("q") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });

        const from = (query.page - 1) * query.pageSize;
        const to = from + query.pageSize - 1;

        // Admin RLS policies allow full access to all products
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let qb = (ctx.supabase as any)
            .from("products")
            .select("*, vendors!inner(id, name), categories!inner(id, name, slug)", { count: "exact" });

        if (query.status) {
            qb = qb.eq("status", query.status);
        }

        if (query.categoryId) {
            qb = qb.eq("category_id", query.categoryId);
        }

        if (query.q) {
            const orFilter = buildOrIlikeFilter(["title", "summary"], query.q);
            if (orFilter) {
                qb = qb.or(orFilter);
            }
        }

        qb = qb.order("created_at", { ascending: false });

        const { data, error, count } = await qb.range(from, to);

        if (error) {
            throw internalServerError("상품 목록을 조회할 수 없습니다.", {
                message: (error as { message: string }).message,
                code: (error as { code: string }).code,
            });
        }

        const rows = ((data as unknown[]) ?? []) as Record<string, unknown>[];
        const productIds = rows.map((r) => r.id as string);

        // Enrich with thumbnails
        const thumbnailMap =
            productIds.length > 0
                ? await fetchProductThumbnailsByProductIds(ctx.supabase, productIds)
                : new Map<string, string | null>();

        const items = rows.map((row) => {
            const vendor = row.vendors as { id: string; name: string };
            const category = row.categories as { id: string; name: string; slug: string };
            const thumbnail = thumbnailMap.get(row.id as string) ?? null;

            return {
                id: row.id as string,
                vendorId: row.vendor_id as string,
                vendorName: vendor.name,
                categoryId: row.category_id as string,
                categoryName: category.name,
                categorySlug: category.slug,
                title: row.title as string,
                summary: (row.summary as string) ?? null,
                status: row.status as string,
                priceType: row.price_type as string,
                priceMin: (row.price_min as number) ?? null,
                priceMax: (row.price_max as number) ?? null,
                ratingAvg: (row.rating_avg as number) ?? null,
                reviewCount: (row.review_count as number) ?? 0,
                thumbnail,
                createdAt: row.created_at as string,
                updatedAt: row.updated_at as string,
            };
        });

        return ok({
            items,
            page: query.page,
            pageSize: query.pageSize,
            total: (count as number) ?? 0,
        });
    }),
);
