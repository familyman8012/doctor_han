import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/server/supabase/server";
import CategoryPage from "./CategoryPage";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: category } = await supabase
        .from("categories")
        .select("name")
        .eq("slug", slug)
        .eq("depth", 1)
        .single();

    if (!category) {
        return {
            title: "카테고리를 찾을 수 없습니다",
        };
    }

    return {
        title: `${category.name} 업체`,
        description: `메디허브에서 ${category.name} 분야 전문 업체를 찾아보세요.`,
        openGraph: {
            title: `${category.name} 업체 | 메디허브`,
            description: `메디허브에서 ${category.name} 분야 전문 업체를 찾아보세요.`,
        },
    };
}

export default async function Page({ params }: PageProps) {
    const { slug } = await params;
    return <CategoryPage slug={slug} />;
}
