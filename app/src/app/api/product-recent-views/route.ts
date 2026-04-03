import { z } from "zod";
import { zUuid } from "@/lib/schema/common";
import { badRequest, internalServerError } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapProductListItem } from "@/server/product/mapper";
import { fetchProductThumbnailsByProductIds } from "@/server/product/repository";

// ============================================
// POST — upsert recent view
// ============================================

const RecentViewBodySchema = z
    .object({
        productId: zUuid,
    })
    .strict();

export const POST = withApi(
    withRole(["doctor"], async (ctx) => {
        const body = RecentViewBodySchema.parse(await ctx.req.json());
        const userId = ctx.user.id;
        const { productId } = body;

        // Validate product exists (prevent FK violation)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: productRow, error: productCheckError } = await (ctx.supabase as any)
            .from("products")
            .select("id")
            .eq("id", productId)
            .eq("status", "active")
            .maybeSingle();

        if (productCheckError) {
            throw internalServerError("상품 조회에 실패했습니다.", {
                message: productCheckError.message,
                code: productCheckError.code,
            });
        }

        if (!productRow) {
            throw badRequest("존재하지 않거나 비활성화된 상품입니다.");
        }

        // Check if a record already exists
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing, error: selectError } = await (ctx.supabase as any)
            .from("product_recent_views")
            .select("view_count")
            .eq("user_id", userId)
            .eq("product_id", productId)
            .maybeSingle();

        if (selectError) {
            throw internalServerError("최근 본 상품 조회에 실패했습니다.", {
                message: selectError.message,
                code: selectError.code,
            });
        }

        if (existing) {
            // Update: increment view_count and refresh last_viewed_at
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: updateError } = await (ctx.supabase as any)
                .from("product_recent_views")
                .update({
                    view_count: (existing.view_count as number) + 1,
                    last_viewed_at: new Date().toISOString(),
                })
                .eq("user_id", userId)
                .eq("product_id", productId);

            if (updateError) {
                throw internalServerError("최근 본 상품 업데이트에 실패했습니다.", {
                    message: updateError.message,
                    code: updateError.code,
                });
            }
        } else {
            // Insert new record
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: insertError } = await (ctx.supabase as any)
                .from("product_recent_views")
                .insert({
                    user_id: userId,
                    product_id: productId,
                    view_count: 1,
                    last_viewed_at: new Date().toISOString(),
                });

            if (insertError) {
                throw internalServerError("최근 본 상품 기록에 실패했습니다.", {
                    message: insertError.message,
                    code: insertError.code,
                });
            }
        }

        return ok({ productId });
    }),
);

// ============================================
// GET — list recent views
// ============================================

const RecentViewQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const GET = withApi(
    withRole(["doctor"], async (ctx) => {
        const url = new URL(ctx.req.url);
        const query = RecentViewQuerySchema.parse({
            limit: url.searchParams.get("limit") ?? undefined,
        });

        const userId = ctx.user.id;

        // Fetch recent views ordered by last_viewed_at DESC
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: viewRows, error: viewError } = await (ctx.supabase as any)
            .from("product_recent_views")
            .select("product_id, view_count, last_viewed_at")
            .eq("user_id", userId)
            .order("last_viewed_at", { ascending: false })
            .limit(query.limit);

        if (viewError) {
            throw internalServerError("최근 본 상품 목록을 조회할 수 없습니다.", {
                message: viewError.message,
                code: viewError.code,
            });
        }

        const rows = ((viewRows as unknown[]) ?? []) as Record<string, unknown>[];

        if (rows.length === 0) {
            return ok({ items: [] });
        }

        const productIds = rows.map((r) => r.product_id as string);

        // Fetch product details with vendor join
        // Use left join for categories (no !inner) so products with inactive/missing
        // categories are still returned — the code already handles null category.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: productData, error: productError } = await (ctx.supabase as any)
            .from("products")
            .select("*, vendors(id, name), categories(slug)")
            .in("id", productIds)
            .eq("status", "active");

        if (productError) {
            throw internalServerError("상품 정보를 조회할 수 없습니다.", {
                message: productError.message,
                code: productError.code,
            });
        }

        const productRows = ((productData as unknown[]) ?? []) as Record<string, unknown>[];

        // Build a map of product_id -> product row for ordering
        const productMap = new Map<string, Record<string, unknown>>();
        for (const p of productRows) {
            productMap.set(p.id as string, p);
        }

        // Fetch thumbnails
        const activeProductIds = productRows.map((p) => p.id as string);
        const thumbnailMap =
            activeProductIds.length > 0
                ? await fetchProductThumbnailsByProductIds(ctx.supabase, activeProductIds)
                : new Map<string, string | null>();

        // Map results in the order of recent views (last_viewed_at DESC)
        const items = rows
            .map((viewRow) => {
                const product = productMap.get(viewRow.product_id as string);
                if (!product) return null; // product was deleted or inactive

                const vendor = product.vendors as { id: string; name: string } | null;
                const category = product.categories as { slug: string } | null;
                const thumbnail = thumbnailMap.get(product.id as string) ?? null;

                return {
                    lastViewedAt: viewRow.last_viewed_at as string,
                    viewCount: viewRow.view_count as number,
                    product: mapProductListItem(
                        product,
                        { id: vendor?.id ?? "", name: vendor?.name ?? "" },
                        category?.slug ?? null,
                        thumbnail,
                    ),
                };
            })
            .filter(Boolean);

        return ok({ items });
    }),
);
