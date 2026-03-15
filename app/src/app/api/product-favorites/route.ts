import { internalServerError } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapProductListItem, resolveProductImageUrl } from "@/server/product/mapper";

export const GET = withApi(
    withRole(["doctor"], async (ctx) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (ctx.supabase as any)
            .from("product_favorites")
            .select("created_at, products(*, vendors!inner(id, name), categories!inner(slug))")
            .eq("user_id", ctx.user.id)
            .order("created_at", { ascending: false });

        if (error) {
            throw internalServerError("상품 찜 목록을 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = ((data as any[]) ?? []) as Record<string, unknown>[];

        const items = rows
            .map((row) => {
                const product = row.products as Record<string, unknown> | null;
                if (!product) return null;

                const vendor = product.vendors as { id: string; name: string } | null;
                const category = product.categories as { slug: string } | null;

                // Get primary image thumbnail
                return {
                    createdAt: row.created_at as string,
                    product: mapProductListItem(
                        product,
                        { id: vendor?.id ?? "", name: vendor?.name ?? "" },
                        category?.slug ?? null,
                        null,
                    ),
                };
            })
            .filter(Boolean);

        // Enrich thumbnails
        const productIds = items
            .map((item) => (item as { product: { id: string } }).product.id)
            .filter(Boolean);

        if (productIds.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: imageRows } = await (ctx.supabase as any)
                .from("product_images")
                .select("product_id, file_id, url, is_primary, sort_order")
                .in("product_id", productIds)
                .order("is_primary", { ascending: false })
                .order("sort_order", { ascending: true });

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
                    if (item) {
                        const typedItem = item as { product: { id: string; thumbnail: string | null } };
                        typedItem.product.thumbnail = thumbnailMap.get(typedItem.product.id) ?? null;
                    }
                }
            }
        }

        return ok({ items });
    }),
);
