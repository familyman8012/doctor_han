import { zPaginationQuery } from "@/lib/schema/common";
import { ProductCreateBodySchema, ProductStatusSchema } from "@/lib/schema/product";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { buildOrIlikeFilter } from "@/server/api/postgrest";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import {
    mapProductDetail,
    mapProductFaq,
    mapProductImage,
    mapProductListItem,
    resolveProductImageUrl,
} from "@/server/product/mapper";

export const GET = withApi(
    withRole(["vendor"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const pagination = zPaginationQuery.parse({
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });
        const statusParam = searchParams.get("status") ?? undefined;
        const status = statusParam ? ProductStatusSchema.parse(statusParam) : undefined;
        const q = searchParams.get("q")?.trim() || undefined;

        // Find vendor by current user
        const { data: vendor, error: vendorError } = await ctx.supabase
            .from("vendors")
            .select("id, name")
            .eq("owner_user_id", ctx.user.id)
            .maybeSingle();

        if (vendorError) {
            throw internalServerError("업체 프로필을 확인할 수 없습니다.", {
                message: vendorError.message,
                code: vendorError.code,
            });
        }

        if (!vendor) {
            throw notFound("업체 프로필이 없습니다.");
        }

        const from = (pagination.page - 1) * pagination.pageSize;
        const to = from + pagination.pageSize - 1;

        // Owner can see all statuses (RLS policy: products_select_owner)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let qb = (ctx.supabase as any)
            .from("products")
            .select("*, categories!inner(slug)", { count: "exact" })
            .eq("vendor_id", vendor.id);

        if (status) {
            qb = qb.eq("status", status);
        }

        if (q) {
            const orFilter = buildOrIlikeFilter(["title", "summary"], q);
            if (orFilter) qb = qb.or(orFilter);
        }

        qb = qb
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

        const { data, error, count } = await qb.range(from, to);

        if (error) {
            throw internalServerError("상품 목록을 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = ((data as any[]) ?? []) as Record<string, unknown>[];

        // Fetch thumbnails
        const productIds = rows.map((r) => r.id as string);
        const thumbnailMap = new Map<string, string>();

        if (productIds.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: imageRows } = await (ctx.supabase as any)
                .from("product_images")
                .select("product_id, file_id, url, is_primary, sort_order")
                .in("product_id", productIds)
                .order("is_primary", { ascending: false })
                .order("sort_order", { ascending: true });

            if (imageRows) {
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
            const base = mapProductListItem(
                row,
                { id: vendor.id, name: vendor.name },
                category?.slug ?? null,
                thumbnailMap.get(row.id as string) ?? null,
            );
            return {
                ...base,
                status: (row.status as string) ?? "draft",
                createdAt: (row.created_at as string) ?? "",
            };
        });

        return ok({
            items,
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: count ?? 0,
        });
    }),
);

export const POST = withApi(
    withRole(["vendor"], async (ctx) => {
        const body = ProductCreateBodySchema.parse(await ctx.req.json());

        // Find vendor by current user
        const { data: vendor, error: vendorError } = await ctx.supabase
            .from("vendors")
            .select("id, name")
            .eq("owner_user_id", ctx.user.id)
            .maybeSingle();

        if (vendorError) {
            throw internalServerError("업체 프로필을 확인할 수 없습니다.", {
                message: vendorError.message,
                code: vendorError.code,
            });
        }

        if (!vendor) {
            throw notFound("업체 프로필이 없습니다.");
        }

        const { data: vendorCategory, error: vendorCategoryError } = await ctx.supabase
            .from("vendor_categories")
            .select("category_id, categories!inner(listing_type)")
            .eq("vendor_id", vendor.id)
            .eq("category_id", body.categoryId)
            .maybeSingle();

        if (vendorCategoryError) {
            throw internalServerError("업체 카테고리를 확인할 수 없습니다.", {
                message: vendorCategoryError.message,
                code: vendorCategoryError.code,
            });
        }

        const categoryMeta = (vendorCategory as Record<string, unknown> | null)?.categories as
            | { listing_type: string }
            | null;

        if (!vendorCategory) {
            throw badRequest("등록된 카테고리에서만 상품을 생성할 수 있습니다.");
        }

        if (categoryMeta?.listing_type !== "product") {
            throw badRequest("상품형 카테고리에서만 상품을 생성할 수 있습니다.");
        }

        // 새 상품 등록은 곧바로 관리자 검토 대상으로 보낸다.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: productRow, error: productError } = await (ctx.supabase as any)
            .from("products")
            .insert({
                vendor_id: vendor.id,
                category_id: body.categoryId,
                title: body.title,
                summary: body.summary ?? null,
                description: body.description ?? null,
                price_type: body.priceType,
                price_min: body.priceMin ?? null,
                price_max: body.priceMax ?? null,
                price_unit: body.priceUnit ?? null,
                sort_order: body.sortOrder ?? 0,
                status: body.status,
            })
            .select("*, categories!inner(slug)")
            .single();

        if (productError) {
            if (productError.code === "23503") {
                throw badRequest("존재하지 않는 카테고리가 포함되어 있습니다.", {
                    message: productError.message,
                    code: productError.code,
                });
            }

            throw internalServerError("상품 생성에 실패했습니다.", {
                message: productError.message,
                code: productError.code,
            });
        }

        const category = (productRow as Record<string, unknown>).categories as { slug: string } | null;

        // Insert images if provided
        let images: ReturnType<typeof mapProductImage>[] = [];
        if (body.images && body.images.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: imageRows, error: imageError } = await (ctx.supabase as any)
                .from("product_images")
                .insert(
                    body.images.map((img, index) => ({
                        product_id: (productRow as Record<string, unknown>).id,
                        file_id: img.fileId ?? null,
                        url: img.url ?? null,
                        alt_text: img.altText ?? null,
                        is_primary: img.isPrimary ?? index === 0,
                        sort_order: img.sortOrder ?? index,
                    })),
                )
                .select("*");

            if (imageError) {
                if (imageError.code === "23503") {
                    throw badRequest("파일 정보가 올바르지 않습니다.", {
                        message: imageError.message,
                        code: imageError.code,
                    });
                }

                throw internalServerError("상품 이미지 생성에 실패했습니다.", {
                    message: imageError.message,
                    code: imageError.code,
                });
            }

            images = ((imageRows as Record<string, unknown>[]) ?? []).map(mapProductImage);
        }

        // Insert FAQs if provided
        let faqs: ReturnType<typeof mapProductFaq>[] = [];
        if (body.faqs && body.faqs.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: faqRows, error: faqError } = await (ctx.supabase as any)
                .from("product_faqs")
                .insert(
                    body.faqs.map((faq, index) => ({
                        product_id: (productRow as Record<string, unknown>).id,
                        question: faq.question,
                        answer: faq.answer,
                        sort_order: faq.sortOrder ?? index,
                    })),
                )
                .select("*");

            if (faqError) {
                throw internalServerError("상품 FAQ 생성에 실패했습니다.", {
                    message: faqError.message,
                    code: faqError.code,
                });
            }

            faqs = ((faqRows as Record<string, unknown>[]) ?? []).map(mapProductFaq);
        }

        const product = mapProductDetail({
            product: productRow as Record<string, unknown>,
            vendor: { id: vendor.id, name: vendor.name },
            categorySlug: category?.slug ?? null,
            images,
            faqs,
        });

        return created({ product });
    }),
);
