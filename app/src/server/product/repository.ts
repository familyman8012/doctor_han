import type { Database } from "@/lib/database.types";
import type { ProductDetail, ProductImage, ProductFaq, ProductListItem } from "@/lib/schema/product";
import { internalServerError } from "@/server/api/errors";
import {
    mapProductDetail,
    mapProductFaq,
    mapProductImage,
    mapProductListItem,
    resolveProductImageUrl,
} from "@/server/product/mapper";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================
// List Query
// ============================================

interface FetchProductsQuery {
    categoryId?: string;
    vendorId?: string;
    q?: string;
    priceMin?: number;
    priceMax?: number;
    ratingMin?: number;
    sort: string;
    page: number;
    pageSize: number;
}

export async function fetchProducts(
    supabase: SupabaseClient<Database>,
    query: FetchProductsQuery,
): Promise<{ items: ProductListItem[]; total: number }> {
    const { categoryId, vendorId, q, priceMin, priceMax, ratingMin, sort, page, pageSize } = query;

    // Build base query - select products with vendor name join
    // Since DB types are not regenerated, we use `any` for Supabase chaining
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let builder = (supabase as any)
        .from("products")
        .select("*, vendors!inner(id, name)", { count: "exact" })
        .eq("status", "active");

    // Apply filters
    if (categoryId) {
        builder = builder.eq("category_id", categoryId);
    }
    if (vendorId) {
        builder = builder.eq("vendor_id", vendorId);
    }
    if (q) {
        builder = builder.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
    }
    if (priceMin !== undefined) {
        builder = builder.or(
            `and(price_type.eq.fixed,price_min.gte.${priceMin}),and(price_type.eq.range,price_max.gte.${priceMin})`,
        );
    }
    if (priceMax !== undefined) {
        builder = builder.or(
            `and(price_type.eq.fixed,price_min.lte.${priceMax}),and(price_type.eq.range,price_min.lte.${priceMax})`,
        );
    }
    if (ratingMin !== undefined) {
        builder = builder.gte("rating_avg", ratingMin);
    }

    // Apply sorting
    switch (sort) {
        case "rating":
            builder = builder.order("rating_avg", { ascending: false }).order("created_at", { ascending: false });
            break;
        case "reviewCount":
            builder = builder.order("review_count", { ascending: false }).order("created_at", { ascending: false });
            break;
        case "popular":
            builder = builder.order("view_count", { ascending: false }).order("created_at", { ascending: false });
            break;
        case "priceAsc":
            builder = builder.order("price_min", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
            break;
        case "priceDesc":
            builder = builder.order("price_max", { ascending: false, nullsFirst: true }).order("created_at", { ascending: false });
            break;
        case "newest":
        default:
            builder = builder.order("created_at", { ascending: false });
            break;
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    builder = builder.range(from, to);

    const { data, error, count } = await builder;

    if (error) {
        throw internalServerError("상품 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const rows = (data ?? []) as Record<string, unknown>[];
    const productIds = rows.map((r) => r.id as string);

    // Fetch thumbnails (primary images) for the listed products
    const thumbnailMap = productIds.length > 0
        ? await fetchProductThumbnailsByProductIds(supabase, productIds)
        : new Map<string, string | null>();

    // Fetch category slugs
    const categoryIds = [...new Set(rows.map((r) => r.category_id as string))];
    const categorySlugMap = categoryIds.length > 0
        ? await fetchCategorySlugsByIds(supabase, categoryIds)
        : new Map<string, string | null>();

    const items: ProductListItem[] = rows.map((row) => {
        const vendorData = row.vendors as Record<string, unknown>;
        const vendor = {
            id: vendorData.id as string,
            name: vendorData.name as string,
        };
        const categorySlug = categorySlugMap.get(row.category_id as string) ?? null;
        const thumbnail = thumbnailMap.get(row.id as string) ?? null;
        return mapProductListItem(row, vendor, categorySlug, thumbnail);
    });

    return { items, total: (count as number) ?? 0 };
}

// ============================================
// Detail Query
// ============================================

export async function fetchProductById(
    supabase: SupabaseClient<Database>,
    productId: string,
): Promise<ProductDetail | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from("products")
        .select("*, vendors!inner(id, name)")
        .eq("id", productId)
        .maybeSingle();

    if (error) {
        throw internalServerError("상품을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (!data) return null;

    const row = data as Record<string, unknown>;
    const vendorData = row.vendors as Record<string, unknown>;
    const vendor = {
        id: vendorData.id as string,
        name: vendorData.name as string,
    };

    // Fetch category slug
    const categorySlug = await fetchCategorySlugById(supabase, row.category_id as string);

    // Fetch images & FAQs in parallel
    const [images, faqs] = await Promise.all([
        fetchProductImages(supabase, productId),
        fetchProductFaqs(supabase, productId),
    ]);

    return mapProductDetail({
        product: row,
        vendor,
        categorySlug,
        images,
        faqs,
    });
}

// ============================================
// Vendor-scoped List
// ============================================

export async function fetchProductsByVendorId(
    supabase: SupabaseClient<Database>,
    vendorId: string,
    pagination: { page: number; pageSize: number },
): Promise<{ items: ProductListItem[]; total: number }> {
    return fetchProducts(supabase, {
        vendorId,
        sort: "newest",
        page: pagination.page,
        pageSize: pagination.pageSize,
    });
}

// ============================================
// Images
// ============================================

export async function fetchProductImages(
    supabase: SupabaseClient<Database>,
    productId: string,
): Promise<ProductImage[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("상품 이미지를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapProductImage);
}

// ============================================
// FAQs
// ============================================

export async function fetchProductFaqs(
    supabase: SupabaseClient<Database>,
    productId: string,
): Promise<ProductFaq[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from("product_faqs")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("상품 FAQ를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapProductFaq);
}

// ============================================
// Thumbnails (primary image per product)
// ============================================

export async function fetchProductThumbnailsByProductIds(
    supabase: SupabaseClient<Database>,
    productIds: string[],
): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();
    if (productIds.length === 0) return result;

    // Fetch primary images for the given products
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
        .from("product_images")
        .select("product_id, file_id, url, is_primary, sort_order")
        .in("product_id", productIds)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    if (error) {
        throw internalServerError("상품 썸네일을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    // Pick the first image per product (primary images sorted first)
    for (const row of (data ?? []) as Record<string, unknown>[]) {
        const productId = row.product_id as string;
        if (result.has(productId)) continue;
        result.set(
            productId,
            resolveProductImageUrl({
                fileId: (row.file_id as string) ?? null,
                url: (row.url as string) ?? null,
            }),
        );
    }

    return result;
}

// ============================================
// Internal helpers: category slugs
// ============================================

async function fetchCategorySlugsByIds(
    supabase: SupabaseClient<Database>,
    categoryIds: string[],
): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();
    if (categoryIds.length === 0) return result;

    const { data, error } = await supabase
        .from("categories")
        .select("id, slug")
        .in("id", categoryIds);

    if (error) {
        throw internalServerError("카테고리를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    for (const row of data ?? []) {
        result.set(row.id, row.slug);
    }

    return result;
}

async function fetchCategorySlugById(
    supabase: SupabaseClient<Database>,
    categoryId: string,
): Promise<string | null> {
    const { data, error } = await supabase
        .from("categories")
        .select("slug")
        .eq("id", categoryId)
        .maybeSingle();

    if (error) {
        throw internalServerError("카테고리를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data?.slug ?? null;
}
