"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { useIsAuthenticated, useUser, useUserRole } from "@/stores/auth";
import { RequireApproval } from "@/components/widgets/RequireApproval";
import { RichContent } from "@/components/ui/RichEditor/RichContent";
import type { ProductDetail } from "@/lib/schema/product";
import { ProductImageGallery } from "./components/ProductImageGallery";
import { ProductFaqSection } from "./components/ProductFaqSection";
import { ProductReviewSection } from "./components/ProductReviewSection";
import { ProductHero } from "./components/ProductHero";
import { ProductVendorCard } from "./components/ProductVendorCard";
import { RelatedProducts } from "./components/RelatedProducts";

interface ProductDetailPageProps {
    productId: string;
}

export default function ProductDetailPage({ productId }: ProductDetailPageProps) {
    const isAuthenticated = useIsAuthenticated();
    const currentUser = useUser();
    const role = useUserRole();
    const recentViewSent = useRef(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["product", productId],
        queryFn: async () => {
            const response = await api.get<{ data: { product: ProductDetail } }>(
                `/api/products/${productId}`
            );
            return response.data.data;
        },
    });

    // Fetch product favorites to check isFavorited
    const canFetchFavorites = isAuthenticated && role === "doctor";
    const { data: productFavorites = [] } = useQuery({
        queryKey: ["product-favorites", "ids"],
        queryFn: async (): Promise<string[]> => {
            const response = await api.get<{
                data: { items: { productId?: string; product?: { id: string } }[] };
            }>("/api/product-favorites");
            return (response.data.data.items ?? [])
                .map((item) => item.productId ?? item.product?.id ?? "")
                .filter(Boolean);
        },
        staleTime: 60 * 1000,
        enabled: canFetchFavorites,
    });

    // D4-b: recent view tracking (fire-and-forget)
    useEffect(() => {
        if (!isAuthenticated || recentViewSent.current) return;
        recentViewSent.current = true;
        api.post("/api/product-recent-views", { productId }).catch(() => {
            /* ignore */
        });
    }, [isAuthenticated, productId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isError || !data?.product) {
        return (
            <div className="py-20">
                <Empty
                    title="상품을 찾을 수 없습니다"
                    description="요청하신 상품 정보가 존재하지 않습니다"
                />
            </div>
        );
    }

    const product = data.product;
    const isFavorited = productFavorites.includes(product.id);

    const previewBanner = (() => {
        switch (product.status) {
            case "draft":
                return { label: "임시저장", desc: "아직 등록 요청 전입니다. 외부에는 공개되지 않습니다.", tone: "bg-gray-100 border-gray-300 text-gray-700" };
            case "pending_review":
                return { label: "심사중", desc: "관리자 검토를 기다리는 중입니다. 외부에는 공개되지 않습니다.", tone: "bg-yellow-50 border-yellow-300 text-yellow-800" };
            case "rejected":
                return { label: "반려", desc: "관리자 반려로 공개되지 않습니다. 상품 수정 후 재요청할 수 있습니다.", tone: "bg-red-50 border-red-300 text-red-800" };
            case "inactive":
                return { label: "비활성", desc: "현재 외부에 공개되지 않는 상태입니다.", tone: "bg-gray-100 border-gray-300 text-gray-700" };
            default:
                return null;
        }
    })();

    return (
        <div className="space-y-6">
            {/* 비공개 상품 미리보기 배너 */}
            {previewBanner && (
                <div className={`border rounded-lg px-4 py-3 text-sm ${previewBanner.tone}`}>
                    <span className="font-semibold">미리보기 ({previewBanner.label})</span>
                    <span className="ml-2">{previewBanner.desc}</span>
                </div>
            )}

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/categories" className="hover:text-content-primary">
                    전체 카테고리
                </Link>
                {product.categorySlug && (
                    <>
                        <ChevronRight className="w-4 h-4" />
                        <Link
                            href={`/categories/${product.categorySlug}`}
                            className="hover:text-content-primary"
                        >
                            {product.categoryName ?? product.categorySlug}
                        </Link>
                    </>
                )}
                <ChevronRight className="w-4 h-4" />
                <span className="text-content-primary font-medium line-clamp-1">{product.title}</span>
            </nav>

            {/* Hero */}
            <ProductHero product={product} isFavorited={isFavorited} />

            {/* Main content: 2/3 + 1/3 grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-8">
                    {/* Image gallery */}
                    {product.images.length > 0 && (
                        <ProductImageGallery images={product.images} />
                    )}

                    {/* Description */}
                    {product.description && (
                        <section>
                            <h2 className="text-lg font-bold text-content-primary mb-4">상세 설명</h2>
                            <RichContent html={product.description} className="text-gray-700" />
                        </section>
                    )}

                    {/* FAQ */}
                    {product.faqs.length > 0 && (
                        <ProductFaqSection faqs={product.faqs} />
                    )}

                    {/* Reviews */}
                    <ProductReviewSection
                        productId={productId}
                        ratingAvg={product.ratingAvg}
                        reviewCount={product.reviewCount}
                        currentUserId={currentUser?.id}
                    />
                </div>

                {/* Sidebar */}
                <aside>
                    <div className="sticky top-24 space-y-4">
                        {/* Gradient CTA */}
                        <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-xl p-6 space-y-3">
                            <h3 className="text-white font-bold text-lg">이 상품이 필요하신가요?</h3>
                            <p className="text-primary-200 text-sm">
                                지금 바로 문의하시면 빠르게 안내해 드립니다
                            </p>
                            <RequireApproval message="면허 인증 완료 후 문의할 수 있습니다.">
                                <Link
                                    href={`/products/${product.id}/inquiry`}
                                    className="block w-full text-center py-3 px-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    문의하기
                                </Link>
                            </RequireApproval>
                        </div>

                        {/* Enhanced vendor card */}
                        <ProductVendorCard
                            vendorId={product.vendorId}
                            vendorName={product.vendor.name}
                            vendorRatingAvg={product.vendor.ratingAvg}
                            vendorReviewCount={product.vendor.reviewCount}
                            vendorBadges={product.vendor.badges}
                        />
                    </div>
                </aside>
            </div>

            {/* Related products */}
            <RelatedProducts
                categoryId={product.categoryId}
                currentProductId={product.id}
                categorySlug={product.categorySlug}
            />
        </div>
    );
}
