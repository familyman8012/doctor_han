"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import NextImage from "next/image";
import { Package, Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { cn } from "@/components/utils";
import type { ProductListItem } from "@/lib/schema/product";
import { formatProductPrice } from "@/lib/utils/product-price";

const STATUS_LABELS: Record<string, string> = {
    draft: "임시저장",
    pending_review: "검토중",
    active: "판매중",
    inactive: "비활성",
    rejected: "반려",
};

const STATUS_STYLES: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    pending_review: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
    rejected: "bg-red-100 text-red-700",
};

export default function PartnerProductsPage() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["vendor", "me", "products"],
        queryFn: async () => {
            const res = await api.get<{
                data: { items: (ProductListItem & { status: string; createdAt: string })[]; total: number };
            }>("/api/vendors/me/products");
            return res.data.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/vendors/me/products/${id}`);
        },
        onSuccess: () => {
            toast.success("상품이 삭제되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["vendor", "me", "products"] });
        },
    });

    const handleDelete = (id: string) => {
        if (confirm("상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            deleteMutation.mutate(id);
        }
    };

    const products = data?.items ?? [];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <Package className="w-6 h-6 text-primary" />
                        상품 관리
                    </h1>
                    <p className="text-gray-500 mt-1">총 {products.length}개의 상품</p>
                </div>
                <Link href="/partner/products/new">
                    <Button variant="primary" LeadingIcon={<Plus />}>
                        새 상품 등록
                    </Button>
                </Link>
            </div>

            {/* Product List */}
            {products.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-16">
                    <Empty
                        Icon={<Package className="w-8 h-8" />}
                        title="등록된 상품이 없습니다"
                        description="새 상품을 등록하여 고객에게 서비스를 소개하세요."
                    />
                    <div className="flex justify-center mt-6">
                        <Link href="/partner/products/new">
                            <Button variant="primary" LeadingIcon={<Plus />}>
                                새 상품 등록
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden sm:grid grid-cols-[64px_1fr_120px_140px_80px_80px_100px_80px] gap-3 px-5 py-3 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
                        <div />
                        <div>상품명</div>
                        <div>카테고리</div>
                        <div>가격</div>
                        <div className="text-center">상태</div>
                        <div className="text-center">리뷰</div>
                        <div>등록일</div>
                        <div />
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-100">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="grid grid-cols-1 sm:grid-cols-[64px_1fr_120px_140px_80px_80px_100px_80px] gap-3 px-5 py-4 items-center hover:bg-gray-50 transition-colors"
                            >
                                {/* Thumbnail */}
                                <div className="hidden sm:block w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                    {product.thumbnail ? (
                                        <NextImage
                                            src={product.thumbnail}
                                            alt={product.title}
                                            width={56}
                                            height={56}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-5 h-5 text-gray-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Title */}
                                <div className="min-w-0">
                                    <Link
                                        href={`/partner/products/${product.id}`}
                                        className="font-medium text-content-primary hover:text-primary truncate block transition-colors"
                                    >
                                        {product.title}
                                    </Link>
                                    {product.summary && (
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {product.summary}
                                        </p>
                                    )}
                                </div>

                                {/* Category */}
                                <div className="text-sm text-gray-600 truncate">
                                    {product.categorySlug ?? "-"}
                                </div>

                                {/* Price */}
                                <div className="text-sm text-gray-700">
                                    {formatProductPrice(product)}
                                </div>

                                {/* Status */}
                                <div className="flex justify-center">
                                    <span
                                        className={cn(
                                            "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                                            STATUS_STYLES[(product as { status: string }).status] ?? STATUS_STYLES.draft,
                                        )}
                                    >
                                        {STATUS_LABELS[(product as { status: string }).status] ?? (product as { status: string }).status}
                                    </span>
                                </div>

                                {/* Review Count */}
                                <div className="text-sm text-gray-600 text-center">
                                    {product.reviewCount}
                                </div>

                                {/* Created Date */}
                                <div className="text-sm text-gray-500">
                                    {(product as { createdAt: string }).createdAt
                                        ? new Date((product as { createdAt: string }).createdAt).toLocaleDateString("ko-KR")
                                        : "-"}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 justify-end">
                                    <Link href={`/partner/products/${product.id}`}>
                                        <button
                                            type="button"
                                            className="p-2 text-gray-400 hover:text-content-primary transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </Link>
                                    <button
                                        type="button"
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        onClick={() => handleDelete(product.id)}
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
