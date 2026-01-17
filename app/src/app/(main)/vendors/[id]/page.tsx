import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/server/supabase/server";
import VendorDetailPage from "./VendorDetailPage";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: vendor } = await supabase
        .from("vendors")
        .select("name, summary, description")
        .eq("id", id)
        .eq("status", "active")
        .single();

    if (!vendor) {
        return { title: "업체를 찾을 수 없습니다" };
    }

    const description = vendor.summary || (vendor.description?.slice(0, 150) + "...") || `${vendor.name} - 메디허브에서 만나보세요.`;

    return {
        title: vendor.name,
        description,
        openGraph: {
            title: `${vendor.name} | 메디허브`,
            description,
        },
    };
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return <VendorDetailPage vendorId={id} />;
}
