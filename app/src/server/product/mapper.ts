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

export function mapProductDetail(input: {
    product: ProductRow;
    vendor: ProductVendorSummary;
    categorySlug: string | null;
    categoryName?: string | null;
    images: ProductImage[];
    faqs: ProductFaq[];
}): ProductDetail {
    const row = input.product;
    return {
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
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        images: input.images,
        faqs: input.faqs,
    };
}
