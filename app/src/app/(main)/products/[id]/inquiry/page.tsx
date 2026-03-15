"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { useAuthStore, useIsAuthenticated, useUserRole } from "@/stores/auth";
import type { ProductDetail } from "@/lib/schema/product";
import { ProductInquiryForm } from "./ProductInquiryForm";

export default function ProductInquiryPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const { isInitialized } = useAuthStore();
    const canAccess = isInitialized && isAuthenticated && role === "doctor";

    useEffect(() => {
        if (!isInitialized) return;
        if (!isAuthenticated) {
            router.replace("/login");
            return;
        }
        if (role !== "doctor") {
            router.replace(`/products/${productId}`);
        }
    }, [isInitialized, isAuthenticated, role, router, productId]);

    const { data: productData, isLoading, isError } = useQuery({
        queryKey: ["product", productId],
        queryFn: async () => {
            const response = await api.get<{ data: { product: ProductDetail } }>(
                `/api/products/${productId}`
            );
            return response.data.data;
        },
        enabled: canAccess,
    });

    if (!isInitialized || !isAuthenticated || role !== "doctor") {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isError || !productData?.product) {
        return (
            <div className="py-20">
                <Empty
                    title="상품을 찾을 수 없습니다"
                    description="요청하신 상품 정보가 존재하지 않습니다"
                />
            </div>
        );
    }

    const product = productData.product;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <Link
                    href={`/products/${product.id}`}
                    className="hover:text-content-primary flex items-center gap-1"
                >
                    <ArrowLeft className="w-4 h-4" />
                    상품 상세
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-content-primary font-medium">문의하기</span>
            </nav>

            {/* 헤더 */}
            <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-xl p-6">
                <h1 className="text-xl font-bold text-white mb-1">{product.title}</h1>
                <p className="text-gray-300 text-sm">
                    {product.vendor.name}에 문의합니다
                </p>
            </div>

            {/* 문의 폼 */}
            <ProductInquiryForm product={product} />
        </div>
    );
}
