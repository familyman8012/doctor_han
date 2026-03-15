import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import ProductDetailPage from "./ProductDetailPage";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    // NOTE: DB 타입 재생성 전까지 타입 캐스팅 필요
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product } = await (supabase as any)
        .from("products")
        .select("title, summary, description")
        .eq("id", id)
        .eq("status", "active")
        .single() as { data: { title: string; summary: string | null; description: string | null } | null };

    if (!product) {
        return { title: "상품을 찾을 수 없습니다" };
    }

    const description = product.summary
        || (product.description ? product.description.slice(0, 150) + "..." : null)
        || `${product.title} - 메디허브에서 만나보세요.`;

    return {
        title: product.title,
        description,
        openGraph: {
            title: `${product.title} | 메디허브`,
            description,
        },
    };
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return <ProductDetailPage productId={id} />;
}
