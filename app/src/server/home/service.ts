import type { Database, Tables } from "@/lib/database.types";
import type { ProductListItem } from "@/lib/schema/product";
import type { HomeCategoryItem, HomeScreen, HomeSection, HomeStats, HomeVendorCard } from "@/lib/schema/home";
import {
    fetchAllActiveVendors,
    fetchOverallAvgResponseHours,
    fetchVerificationStatuses,
} from "@/server/badge/repository";
import { internalServerError } from "@/server/api/errors";
import { mapCategoryRow } from "@/server/category/mapper";
import { mapProductListItem } from "@/server/product/mapper";
import { fetchProductThumbnailsByProductIds } from "@/server/product/repository";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { mapVendorListItem } from "@/server/vendor/mapper";
import {
    fetchVendorCategoriesByVendorIds,
    fetchVendorThumbnailsByVendorIds,
    type VendorThumbnail,
} from "@/server/vendor/repository";
import type { SupabaseClient } from "@supabase/supabase-js";

type VendorRow = Tables<"vendors">;

const HOME_VERSION = 1;
const HOME_VENDOR_SECTION_SIZE = 8;
const HOME_VENDOR_CANDIDATE_SIZE = 60;
const HOME_CATEGORY_GRID_SIZE = 10;
const HOME_CATEGORY_SECTION_COUNT = 4;
const HOME_VENDOR_MAX_SECTION_APPEARANCES = 2;
const HOME_PRODUCT_SECTION_SIZE = 8;

type VendorSort = "recommended" | "popular" | "reviewed" | "newest";

async function fetchVendors(
    supabase: SupabaseClient<Database>,
    input: { categoryId?: string; sort: VendorSort; limit: number; minReviews?: number },
): Promise<VendorRow[]> {
    const select = input.categoryId ? "*, vendor_categories!inner(category_id)" : "*";
    let qb = supabase.from("vendors").select(select);

    if (input.categoryId) {
        qb = qb.eq("vendor_categories.category_id", input.categoryId);
    }

    if (typeof input.minReviews === "number") {
        qb = qb.gte("review_count", input.minReviews);
    }

    if (input.sort === "popular") {
        qb = qb.order("review_count", { ascending: false });
        qb = qb.order("rating_avg", { ascending: false });
        qb = qb.order("updated_at", { ascending: false });
    } else if (input.sort === "reviewed") {
        qb = qb.order("rating_avg", { ascending: false });
        qb = qb.order("review_count", { ascending: false });
        qb = qb.order("updated_at", { ascending: false });
    } else if (input.sort === "recommended") {
        qb = qb.order("rating_avg", { ascending: false });
        qb = qb.order("review_count", { ascending: false });
        qb = qb.order("updated_at", { ascending: false });
    } else {
        qb = qb.order("created_at", { ascending: false });
    }

    const { data, error } = await qb.limit(input.limit);

    if (error) {
        throw internalServerError("업체를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []) as unknown as VendorRow[];
}

async function fetchHomeProducts(
    supabase: SupabaseClient<Database>,
    input: { categoryId?: string; sort: string; limit: number },
): Promise<{ rows: Record<string, unknown>[]; categorySlugMap: Map<string, string | null>; thumbnailMap: Map<string, string | null> }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let builder = (supabase as any)
        .from("products")
        .select("*, vendors!inner(id, name)")
        .eq("status", "active");

    if (input.categoryId) {
        builder = builder.eq("category_id", input.categoryId);
    }

    if (input.sort === "popular") {
        builder = builder.order("view_count", { ascending: false }).order("created_at", { ascending: false });
    } else if (input.sort === "rating") {
        builder = builder.order("rating_avg", { ascending: false }).order("review_count", { ascending: false });
    } else {
        builder = builder.order("created_at", { ascending: false });
    }

    builder = builder.limit(input.limit);

    const { data, error } = await builder;
    if (error) {
        // If products table doesn't exist yet (migration not applied), return empty
        if (error.code === "42P01" || error.message?.includes("products")) {
            return { rows: [], categorySlugMap: new Map(), thumbnailMap: new Map() };
        }
        throw internalServerError("홈 상품을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const rows = (data ?? []) as Record<string, unknown>[];
    const productIds = rows.map((r) => r.id as string);
    const categoryIds = [...new Set(rows.map((r) => r.category_id as string))];

    const [thumbnailMap, categorySlugMap] = await Promise.all([
        productIds.length > 0 ? fetchProductThumbnailsByProductIds(supabase, productIds) : new Map<string, string | null>(),
        categoryIds.length > 0 ? fetchCategorySlugsByIdsForHome(supabase, categoryIds) : new Map<string, string | null>(),
    ]);

    return { rows, categorySlugMap, thumbnailMap };
}

async function fetchCategorySlugsByIdsForHome(
    supabase: SupabaseClient<Database>,
    categoryIds: string[],
): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();
    if (categoryIds.length === 0) return result;

    const { data, error } = await supabase
        .from("categories")
        .select("id, slug")
        .in("id", categoryIds);

    if (error) return result;

    for (const row of data ?? []) {
        result.set(row.id, row.slug);
    }
    return result;
}

async function fetchVendorCountsByCategory(supabase: SupabaseClient<Database>): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    const { data } = await supabase
        .from("vendor_categories")
        .select("category_id");
    if (data) {
        for (const row of data) {
            result.set(row.category_id, (result.get(row.category_id) ?? 0) + 1);
        }
    }
    return result;
}

async function fetchPublicAvgResponseHours(): Promise<number> {
    const admin = createSupabaseAdminClient();
    const activeVendors = await fetchAllActiveVendors(admin);

    if (activeVendors.length === 0) {
        return 0;
    }

    const ownerUserIds = [...new Set(activeVendors.map((vendor) => vendor.owner_user_id))];
    const verificationMap = await fetchVerificationStatuses(admin, ownerUserIds);
    const publicVendors = activeVendors.filter(
        (vendor) => verificationMap.get(vendor.owner_user_id) === "approved",
    );

    if (publicVendors.length === 0) {
        return 0;
    }

    const vendorOwnerMap = new Map(publicVendors.map((vendor) => [vendor.id, vendor.owner_user_id]));
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    return fetchOverallAvgResponseHours(
        admin,
        publicVendors.map((vendor) => vendor.id),
        ninetyDaysAgo,
        vendorOwnerMap,
    );
}

export async function getHomeStats(supabase: SupabaseClient<Database>): Promise<HomeStats> {
    const [vendorResult, reviewResult, avgResponseHours] = await Promise.all([
        supabase.from("vendors").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        fetchPublicAvgResponseHours(),
    ]);

    return {
        vendorCount: vendorResult.count ?? 0,
        reviewCount: reviewResult.count ?? 0,
        avgResponseHours,
    };
}

export async function buildHomeScreen(supabase: SupabaseClient<Database>): Promise<HomeScreen> {
    const { data: categoryRows, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .order("depth", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    if (categoryError) {
        throw internalServerError("카테고리를 조회할 수 없습니다.", {
            message: categoryError.message,
            code: categoryError.code,
        });
    }

    const categories = (categoryRows ?? []).map(mapCategoryRow);
    const mainCategories = categories.filter((c) => c.depth === 1);
    const gridCategories = mainCategories.slice(0, HOME_CATEGORY_GRID_SIZE);

    // Fetch vendor counts per category for grid display
    const vendorCountMap = await fetchVendorCountsByCategory(supabase);
    const gridCategoryItems: HomeCategoryItem[] = gridCategories.map((c) => ({
        ...c,
        vendorCount: vendorCountMap.get(c.id) ?? 0,
    }));

    // Split categories by listing type for section generation
    const vendorSectionCategories = mainCategories.filter((c) => c.listingType !== "product").slice(0, HOME_CATEGORY_SECTION_COUNT);
    const productSectionCategories = mainCategories.filter((c) => c.listingType === "product").slice(0, HOME_CATEGORY_SECTION_COUNT);
    const sectionCategories = vendorSectionCategories;

    const [recommendedCandidates, popularCandidates, reviewedCandidates, newCandidates, ...categoryCandidateResults] =
        await Promise.all([
            fetchVendors(supabase, {
                sort: "recommended",
                limit: HOME_VENDOR_CANDIDATE_SIZE,
            }),
            fetchVendors(supabase, {
                sort: "popular",
                limit: HOME_VENDOR_CANDIDATE_SIZE,
            }),
            fetchVendors(supabase, {
                sort: "reviewed",
                minReviews: 3,
                limit: HOME_VENDOR_CANDIDATE_SIZE,
            }),
            fetchVendors(supabase, {
                sort: "newest",
                limit: HOME_VENDOR_CANDIDATE_SIZE,
            }),
            ...sectionCategories.map((category) =>
                fetchVendors(supabase, {
                    categoryId: category.id,
                    sort: "recommended",
                    limit: HOME_VENDOR_CANDIDATE_SIZE,
                }),
            ),
        ]);

    const categoryCandidatesByCategoryId = new Map<string, VendorRow[]>();
    for (let index = 0; index < sectionCategories.length; index += 1) {
        categoryCandidatesByCategoryId.set(sectionCategories[index].id, categoryCandidateResults[index] ?? []);
    }

    const candidateVendorIds = new Set<string>();
    for (const list of [
        recommendedCandidates,
        popularCandidates,
        reviewedCandidates,
        newCandidates,
        ...categoryCandidatesByCategoryId.values(),
    ]) {
        for (const row of list) candidateVendorIds.add(row.id);
    }

    const vendorIdList = [...candidateVendorIds];
    const [vendorCategoriesByVendorId, vendorThumbnailsByVendorId] = await Promise.all([
        fetchVendorCategoriesByVendorIds(supabase, vendorIdList),
        fetchVendorThumbnailsByVendorIds(supabase, vendorIdList),
    ]);

    const exposureCountByVendorId = new Map<string, number>();

    function toCard(row: VendorRow): HomeVendorCard {
        return {
            ...mapVendorListItem(row),
            categories: vendorCategoriesByVendorId.get(row.id) ?? [],
            thumbnail: vendorThumbnailsByVendorId.get(row.id) ?? null,
        };
    }

    function pickVendors(input: {
        candidates: VendorRow[];
        limit: number;
        requireThumbnail?: boolean;
        requireSummary?: boolean;
        requireCategory?: boolean;
    }): VendorRow[] {
        const requireThumbnail = input.requireThumbnail ?? true;
        const requireSummary = input.requireSummary ?? false;
        const requireCategory = input.requireCategory ?? false;

        const picked: VendorRow[] = [];
        const pickedIds = new Set<string>();

        const passes = [
            {
                maxAppearances: HOME_VENDOR_MAX_SECTION_APPEARANCES,
                requireThumbnail,
                requireSummary,
                requireCategory,
            },
            {
                maxAppearances: HOME_VENDOR_MAX_SECTION_APPEARANCES,
                requireThumbnail,
                requireSummary: false,
                requireCategory,
            },
            {
                maxAppearances: HOME_VENDOR_MAX_SECTION_APPEARANCES,
                requireThumbnail,
                requireSummary: false,
                requireCategory: false,
            },
            {
                maxAppearances: HOME_VENDOR_MAX_SECTION_APPEARANCES,
                requireThumbnail: false,
                requireSummary: false,
                requireCategory: false,
            },
            {
                maxAppearances: Number.POSITIVE_INFINITY,
                requireThumbnail: false,
                requireSummary: false,
                requireCategory: false,
            },
        ] as const;

        const getThumbnail = (vendorId: string): VendorThumbnail => vendorThumbnailsByVendorId.get(vendorId) ?? null;

        for (const pass of passes) {
            for (const row of input.candidates) {
                if (picked.length >= input.limit) break;
                if (pickedIds.has(row.id)) continue;

                const current = exposureCountByVendorId.get(row.id) ?? 0;
                if (current >= pass.maxAppearances) continue;
                if (pass.requireThumbnail && !getThumbnail(row.id)) continue;
                if (pass.requireSummary && !row.summary) continue;
                if (pass.requireCategory && (vendorCategoriesByVendorId.get(row.id)?.length ?? 0) === 0) continue;

                picked.push(row);
                pickedIds.add(row.id);
                exposureCountByVendorId.set(row.id, current + 1);
            }
        }

        return picked.slice(0, input.limit);
    }

    const sections: HomeSection[] = [
        {
            id: "categories",
            type: "category_grid",
            title: "카테고리",
            items: gridCategoryItems,
        },
    ];

    const recommended = pickVendors({
        candidates: recommendedCandidates,
        limit: HOME_VENDOR_SECTION_SIZE,
        requireThumbnail: true,
        requireSummary: true,
        requireCategory: true,
    }).map(toCard);

    if (recommended.length > 0) {
        sections.push({
            id: "recommended",
            type: "vendor_carousel",
            title: "추천 파트너",
            items: recommended,
        });
    }

    const popular = pickVendors({
        candidates: popularCandidates,
        limit: HOME_VENDOR_SECTION_SIZE,
        requireThumbnail: true,
    }).map(toCard);

    if (popular.length > 0) {
        sections.push({
            id: "popular",
            type: "vendor_carousel",
            title: "이번 달 인기",
            items: popular,
        });
    }

    const reviewed = pickVendors({
        candidates: reviewedCandidates,
        limit: HOME_VENDOR_SECTION_SIZE,
        requireThumbnail: true,
    }).map(toCard);

    if (reviewed.length > 0) {
        sections.push({
            id: "reviewed",
            type: "vendor_carousel",
            title: "리뷰로 검증",
            items: reviewed,
        });
    }

    const newest = pickVendors({
        candidates: newCandidates,
        limit: HOME_VENDOR_SECTION_SIZE,
        requireThumbnail: true,
    }).map(toCard);

    if (newest.length > 0) {
        sections.push({
            id: "newest",
            type: "vendor_carousel",
            title: "신규 입점",
            items: newest,
        });
    }

    for (const category of sectionCategories) {
        const candidates = categoryCandidatesByCategoryId.get(category.id) ?? [];
        const picked = pickVendors({
            candidates,
            limit: HOME_VENDOR_SECTION_SIZE,
            requireThumbnail: true,
        }).map(toCard);

        if (picked.length === 0) continue;

        sections.push({
            id: `category:${category.slug}`,
            type: "vendor_carousel",
            title: `${category.name} 추천`,
            category,
            items: picked,
        });
    }

    // Product-type category sections
    if (productSectionCategories.length > 0) {
        const productResults = await Promise.all(
            productSectionCategories.map((category) =>
                fetchHomeProducts(supabase, {
                    categoryId: category.id,
                    sort: "popular",
                    limit: HOME_PRODUCT_SECTION_SIZE,
                }),
            ),
        );

        for (let i = 0; i < productSectionCategories.length; i++) {
            const category = productSectionCategories[i];
            const { rows, categorySlugMap, thumbnailMap } = productResults[i];

            const items: ProductListItem[] = rows.map((row) => {
                const vendorData = row.vendors as Record<string, unknown>;
                const vendor = { id: vendorData.id as string, name: vendorData.name as string };
                const categorySlug = categorySlugMap.get(row.category_id as string) ?? null;
                const thumbnail = thumbnailMap.get(row.id as string) ?? null;
                return mapProductListItem(row, vendor, categorySlug, thumbnail);
            });

            if (items.length === 0) continue;

            sections.push({
                id: `product-category:${category.slug}`,
                type: "product_carousel",
                title: `${category.name} 인기 상품`,
                category,
                items,
            });
        }
    }

    return {
        version: HOME_VERSION,
        generatedAt: new Date().toISOString(),
        sections,
    };
}
