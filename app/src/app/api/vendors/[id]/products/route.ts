import { zPaginationQuery, zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { mapProductListItem, resolveProductImageUrl } from "@/server/product/mapper";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

export const GET = withApi(async (req: NextRequest, routeCtx: { params: Promise<{ id: string }> }) => {
    const vendorId = zUuid.parse((await routeCtx.params).id);
    const { searchParams } = new URL(req.url);

    const pagination = zPaginationQuery.parse({
        page: searchParams.get("page") ?? undefined,
        pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const supabase = await createSupabaseServerClient();

    // Verify vendor exists
    const { data: vendorRow, error: vendorError } = await supabase
        .from("vendors")
        .select("id, name")
        .eq("id", vendorId)
        .maybeSingle();

    if (vendorError) {
        throw internalServerError("업체 정보를 조회할 수 없습니다.", {
            message: vendorError.message,
            code: vendorError.code,
        });
    }

    if (!vendorRow) {
        throw notFound("업체를 찾을 수 없습니다.");
    }

    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;

    // RLS ensures only 'active' products are visible to non-owners
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error, count } = await (supabase as any)
        .from("products")
        .select("*, categories(slug)", { count: "exact" })
        .eq("vendor_id", vendorId)
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        throw internalServerError("업체 상품 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = ((data as any[]) ?? []) as Record<string, unknown>[];

    // Fetch thumbnails for all products in the list
    const productIds = rows.map((r) => r.id as string);
    let thumbnailMap = new Map<string, string>();

    if (productIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: imageRows } = await (supabase as any)
            .from("product_images")
            .select("product_id, file_id, url, is_primary, sort_order")
            .in("product_id", productIds)
            .order("is_primary", { ascending: false })
            .order("sort_order", { ascending: true });

        if (imageRows) {
            thumbnailMap = new Map<string, string>();
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
        }
    }

    const items = rows.map((row) => {
        const category = row.categories as { slug: string } | null;
        return mapProductListItem(
            row,
            { id: vendorRow.id, name: vendorRow.name },
            category?.slug ?? null,
            thumbnailMap.get(row.id as string) ?? null,
        );
    });

    return ok({
        items,
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: count ?? 0,
    });
});
