import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/server/supabase/server";
import SubCategoryPage from "./SubCategoryPage";

interface PageProps {
    params: Promise<{ slug: string; subSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug, subSlug } = await params;
    const supabase = await createSupabaseServerClient();

    // 부모 카테고리 조회
    const { data: parentCategory } = await supabase
        .from("categories")
        .select("id, name")
        .eq("slug", slug)
        .eq("depth", 1)
        .single();

    if (!parentCategory) {
        return { title: "카테고리를 찾을 수 없습니다" };
    }

    // 자식 카테고리 조회
    const { data: category } = await supabase
        .from("categories")
        .select("name")
        .eq("slug", subSlug)
        .eq("parent_id", parentCategory.id)
        .single();

    if (!category) {
        return { title: "카테고리를 찾을 수 없습니다" };
    }

    const title = `${category.name} 업체`;
    const description = `메디허브에서 ${parentCategory.name} > ${category.name} 분야 전문 업체를 찾아보세요.`;

    return {
        title,
        description,
        openGraph: {
            title: `${title} | 메디허브`,
            description,
        },
    };
}

export default async function Page({ params }: PageProps) {
    const { slug, subSlug } = await params;
    return <SubCategoryPage slug={slug} subSlug={subSlug} />;
}
