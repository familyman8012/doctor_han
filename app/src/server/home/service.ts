import type { Database, Tables } from "@/lib/database.types";
import type { HomeScreen, HomeSection, HomeVendorCard } from "@/lib/schema/home";
import { internalServerError } from "@/server/api/errors";
import { mapCategoryRow } from "@/server/category/mapper";
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
    const sectionCategories = mainCategories.slice(0, HOME_CATEGORY_SECTION_COUNT);

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
            items: gridCategories,
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

    return {
        version: HOME_VERSION,
        generatedAt: new Date().toISOString(),
        sections,
    };
}

