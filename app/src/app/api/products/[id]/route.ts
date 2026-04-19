import { zUuid } from "@/lib/schema/common";
import { forbidden, internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { parseBadgesFromJson } from "@/server/badge/mapper";
import { mapProductDetail, mapProductFaq, mapProductImage } from "@/server/product/mapper";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

export const GET = withApi(async (_req: NextRequest, routeCtx: { params: Promise<{ id: string }> }) => {
    const productId = zUuid.parse((await routeCtx.params).id);
    const supabase = await createSupabaseServerClient();

    // Fetch product with vendor info and category slug
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: productRow, error: productError } = await (supabase as any)
        .from("products")
        .select("*, vendors!inner(id, name, owner_user_id, rating_avg, review_count, badges), categories!inner(slug, name)")
        .eq("id", productId)
        .maybeSingle();

    if (productError) {
        throw internalServerError("상품을 조회할 수 없습니다.", {
            message: productError.message,
            code: productError.code,
        });
    }

    if (!productRow) {
        throw notFound("상품을 찾을 수 없습니다.");
    }

    // 비공개 상품(active가 아님)은 소유자 또는 admin만 접근 가능
    const productStatus = (productRow as Record<string, unknown>).status as string;
    if (productStatus !== "active") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw notFound("상품을 찾을 수 없습니다.");
        }

        const ownerUserId = (productRow.vendors as { owner_user_id: string } | null)?.owner_user_id ?? null;
        const isOwner = ownerUserId === user.id;

        if (!isOwner) {
            const { data: profileRow } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();
            const isAdmin = profileRow?.role === "admin";
            if (!isAdmin) {
                throw forbidden("이 상품은 현재 공개되지 않았습니다.");
            }
        }
    }

    const vendor = productRow.vendors as { id: string; name: string; rating_avg: number | null; review_count: number; badges: unknown } | null;
    const category = productRow.categories as { slug: string; name: string } | null;

    // Fetch images and FAQs in parallel
    const [imagesResult, faqsResult] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
            .from("product_images")
            .select("*")
            .eq("product_id", productId)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
            .from("product_faqs")
            .select("*")
            .eq("product_id", productId)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),
    ]);

    if (imagesResult.error) {
        throw internalServerError("상품 이미지를 조회할 수 없습니다.", {
            message: imagesResult.error.message,
            code: imagesResult.error.code,
        });
    }

    if (faqsResult.error) {
        throw internalServerError("상품 FAQ를 조회할 수 없습니다.", {
            message: faqsResult.error.message,
            code: faqsResult.error.code,
        });
    }

    const images = ((imagesResult.data as Record<string, unknown>[]) ?? []).map(mapProductImage);
    const faqs = ((faqsResult.data as Record<string, unknown>[]) ?? []).map(mapProductFaq);

    const product = mapProductDetail({
        product: productRow as Record<string, unknown>,
        vendor: {
            id: vendor?.id ?? "",
            name: vendor?.name ?? "",
            ratingAvg: vendor?.rating_avg ?? null,
            reviewCount: vendor?.review_count ?? 0,
            badges: parseBadgesFromJson(vendor?.badges),
        },
        categorySlug: category?.slug ?? null,
        categoryName: category?.name ?? null,
        images,
        faqs,
    });

    // Fire-and-forget: increment view_count using admin client (bypasses RLS)
    const adminClient = createSupabaseAdminClient();
    const currentViewCount = ((productRow as Record<string, unknown>).view_count as number) ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (adminClient as any)
        .from("products")
        .update({ view_count: currentViewCount + 1 })
        .eq("id", productId)
        .then(() => {})
        .catch(() => {});

    return ok({ product });
});
