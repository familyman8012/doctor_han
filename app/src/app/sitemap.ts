import type { MetadataRoute } from "next";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://medihub.kr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createSupabaseAdminClient();

    // 정적 페이지
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/categories`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
        },
    ];

    // 카테고리 페이지 (depth 1: 대분류)
    const { data: parentCategories } = await supabase
        .from("categories")
        .select("slug, updated_at")
        .eq("depth", 1)
        .order("sort_order");

    const categoryPages: MetadataRoute.Sitemap = (parentCategories ?? []).map((cat) => ({
        url: `${BASE_URL}/categories/${cat.slug}`,
        lastModified: new Date(cat.updated_at),
        changeFrequency: "weekly",
        priority: 0.8,
    }));

    // 소분류 카테고리
    const { data: allCategories } = await supabase
        .from("categories")
        .select("id, slug, parent_id, depth, updated_at")
        .order("sort_order");

    const parentMap = new Map(
        (allCategories ?? [])
            .filter((c) => c.depth === 1)
            .map((c) => [c.id, c.slug])
    );

    const subCategoryPages: MetadataRoute.Sitemap = (allCategories ?? [])
        .filter((c) => c.depth === 2 && c.parent_id)
        .map((cat) => ({
            url: `${BASE_URL}/categories/${parentMap.get(cat.parent_id!)}/${cat.slug}`,
            lastModified: new Date(cat.updated_at),
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));

    // 활성 업체 페이지
    const { data: vendors } = await supabase
        .from("vendors")
        .select("id, updated_at")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1000);

    const vendorPages: MetadataRoute.Sitemap = (vendors ?? []).map((vendor) => ({
        url: `${BASE_URL}/vendors/${vendor.id}`,
        lastModified: new Date(vendor.updated_at),
        changeFrequency: "weekly",
        priority: 0.6,
    }));

    return [...staticPages, ...categoryPages, ...subCategoryPages, ...vendorPages];
}
