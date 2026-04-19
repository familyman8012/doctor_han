import type {
    ProductDetail,
    ProductFaq,
    ProductImage,
    ProductListItem,
    ProductVendorSummary,
} from "@/lib/schema/product";

// DB types not yet regenerated -- use explicit row shapes
type ProductRow = Record<string, unknown>;
type ProductImageRow = Record<string, unknown>;
type ProductFaqRow = Record<string, unknown>;

export function resolveProductImageUrl(input: {
    fileId?: string | null;
    url?: string | null;
}): string | null {
    if (input.url) return input.url;
    if (input.fileId) return `/api/files/open?fileId=${input.fileId}`;
    return null;
}

export function mapProductListItem(
    row: ProductRow,
    vendor: ProductVendorSummary,
    categorySlug: string | null,
    thumbnail: string | null,
    categoryName?: string | null,
): ProductListItem {
    return {
        id: row.id as string,
        vendorId: row.vendor_id as string,
        categoryId: row.category_id as string,
        title: row.title as string,
        summary: (row.summary as string) ?? null,
        priceType: row.price_type as ProductListItem["priceType"],
        priceMin: (row.price_min as number) ?? null,
        priceMax: (row.price_max as number) ?? null,
        priceUnit: (row.price_unit as string) ?? null,
        ratingAvg: (row.rating_avg as number) ?? null,
        reviewCount: (row.review_count as number) ?? 0,
        viewCount: (row.view_count as number) ?? 0,
        thumbnail,
        vendor,
        categorySlug,
        categoryName: categoryName ?? null,
    };
}

export function mapProductImage(row: ProductImageRow): ProductImage {
    const fileId = (row.file_id as string) ?? null;
    return {
        id: row.id as string,
        productId: row.product_id as string,
        fileId,
        url: resolveProductImageUrl({
            fileId,
            url: (row.url as string) ?? null,
        }),
        altText: (row.alt_text as string) ?? null,
        isPrimary: (row.is_primary as boolean) ?? false,
        sortOrder: (row.sort_order as number) ?? 0,
        createdAt: row.created_at as string,
    };
}

export function mapProductFaq(row: ProductFaqRow): ProductFaq {
    return {
        id: row.id as string,
        productId: row.product_id as string,
        question: row.question as string,
        answer: row.answer as string,
        sortOrder: (row.sort_order as number) ?? 0,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

/** 직전 active 시점의 스냅샷 ↔ 현재 product 값의 diff 계산.
 * 카테고리는 별도 조회한 이름을 inject해 UUID 대신 이름으로 비교.
 */
export function computeResubmitChangedFields(
    current: ProductRow,
    snapshot: Record<string, unknown> | null | undefined,
    currentCategoryName?: string | null,
): Array<{ field: string; before: unknown; after: unknown }> {
    if (!snapshot || typeof snapshot !== "object") return [];
    const changes: Array<{ field: string; before: unknown; after: unknown }> = [];

    const SIMPLE = [
        "title",
        "summary",
        "description",
        "price_type",
        "price_min",
        "price_max",
        "price_unit",
    ];
    for (const f of SIMPLE) {
        const before = snapshot[f] ?? null;
        const after = current[f] ?? null;
        if (JSON.stringify(before) !== JSON.stringify(after)) {
            changes.push({ field: f, before, after });
        }
    }

    // 카테고리: id 변경 여부로 판단하되 표시는 이름으로
    const beforeCatId = snapshot.category_id ?? null;
    const afterCatId = current.category_id ?? null;
    if (JSON.stringify(beforeCatId) !== JSON.stringify(afterCatId)) {
        changes.push({
            field: "category",
            before: (snapshot.category_name as string | null) ?? beforeCatId,
            after: currentCategoryName ?? afterCatId,
        });
    }

    return changes;
}

export function mapProductDetail(input: {
    product: ProductRow;
    vendor: ProductVendorSummary;
    categorySlug: string | null;
    categoryName?: string | null;
    images: ProductImage[];
    faqs: ProductFaq[];
    includeResubmitDiff?: boolean;
}): ProductDetail {
    const row = input.product;
    const detail: ProductDetail = {
        ...mapProductListItem(row, input.vendor, input.categorySlug, null, input.categoryName),
        // Override thumbnail with primary image URL if present
        thumbnail:
            input.images.find((img) => img.isPrimary)?.url ??
            input.images[0]?.url ??
            null,
        description: (row.description as string) ?? null,
        status: row.status as ProductDetail["status"],
        inquiryCount: (row.inquiry_count as number) ?? 0,
        sortOrder: (row.sort_order as number) ?? 0,
        publishedAt: (row.published_at as string) ?? null,
        firstPublishedAt: (row.first_published_at as string) ?? null,
        resubmitReason: (row.resubmit_reason as string) ?? null,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        images: input.images,
        faqs: input.faqs,
    };
    if (input.includeResubmitDiff) {
        const snapshot = row.last_active_snapshot as Record<string, unknown> | null | undefined;
        detail.resubmitChangedFields = computeResubmitChangedFields(
            row,
            snapshot ?? null,
            input.categoryName ?? null,
        );
    }
    return detail;
}
