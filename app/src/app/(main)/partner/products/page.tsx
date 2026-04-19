"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Package, Plus, Pencil, Trash2, ImageIcon, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { cn } from "@/components/utils";
import type { ProductListItem, ProductStatus } from "@/lib/schema/product";
import { formatProductPrice } from "@/lib/utils/product-price";
import { RequireApproval } from "@/components/widgets/RequireApproval";

type StatusFilter = ProductStatus | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "draft", label: "임시저장" },
    { value: "pending_review", label: "검토중" },
    { value: "active", label: "판매중" },
    { value: "inactive", label: "비활성" },
    { value: "rejected", label: "반려" },
];

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
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["vendor", "me", "products", statusFilter, search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (search) params.set("q", search);
            const qs = params.toString();
            const res = await api.get<{
                data: { items: (ProductListItem & { status: string; createdAt: string })[]; total: number };
            }>(`/api/vendors/me/products${qs ? `?${qs}` : ""}`);
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
    const isFiltered = statusFilter !== "all" || search.length > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <Package className="w-6 h-6 text-primary" />
                        상품 관리
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isFiltered ? `조건 일치 ${data?.total ?? 0}개` : `총 ${data?.total ?? 0}개의 상품`}
                    </p>
                </div>
                <RequireApproval message="사업자 인증 완료 후 상품을 등록할 수 있습니다.">
                    <Link href="/partner/products/new">
                        <Button variant="primary" LeadingIcon={<Plus />}>
                            새 상품 등록
                        </Button>
                    </Link>
                </RequireApproval>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex gap-2 flex-wrap">
                    {STATUS_FILTERS.map((opt) => (
                        <Button
                            key={opt.value}
                            variant={statusFilter === opt.value ? "listActive" : "list"}
                            size="sm"
                            onClick={() => setStatusFilter(opt.value)}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="상품명으로 검색 (Enter)"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") setSearch(searchInput.trim());
                        }}
                        className="pl-9"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchInput("");
                                setSearch("");
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                        >
                            초기화
                        </button>
                    )}
                </div>
            </div>

            {/* Product List */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Spinner size="lg" />
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-16">
                    <Empty
                        Icon={<Package className="w-8 h-8" />}
                        title={isFiltered ? "조건에 맞는 상품이 없습니다" : "등록된 상품이 없습니다"}
                        description={
                            isFiltered
                                ? "다른 필터 또는 검색어로 다시 시도해보세요."
                                : "새 상품을 등록하여 고객에게 서비스를 소개하세요."
                        }
                    />
                    {!isFiltered && (
                        <div className="flex justify-center mt-6">
                            <Link href="/partner/products/new">
                                <Button variant="primary" LeadingIcon={<Plus />}>
                                    새 상품 등록
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden lg:grid grid-cols-[56px_minmax(180px,2fr)_minmax(100px,1fr)_minmax(120px,1fr)_90px_90px_110px] gap-3 px-5 py-3 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
                        <div />
                        <div>상품명</div>
                        <div>카테고리</div>
                        <div>가격</div>
                        <div className="text-center">상태</div>
                        <div>등록일</div>
                        <div className="text-right">액션</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-100">
                        {products.map((product) => {
                            const status = (product as { status: string }).status;
                            const createdAt = (product as { createdAt: string }).createdAt;
                            const statusBadge = (
                                <span
                                    className={cn(
                                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                                        STATUS_STYLES[status] ?? STATUS_STYLES.draft,
                                    )}
                                >
                                    {STATUS_LABELS[status] ?? status}
                                </span>
                            );
                            const actions = (
                                <div className="flex items-center gap-1 justify-end">
                                    <Link
                                        href={`/products/${product.id}`}
                                        target="_blank"
                                        title={
                                            status === "active"
                                                ? "상품 공개 페이지 보기"
                                                : "상품 미리보기 (본인만 볼 수 있습니다)"
                                        }
                                    >
                                        <button
                                            type="button"
                                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </Link>
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
                            );
                            return (
                                <div
                                    key={product.id}
                                    className="px-5 py-4 hover:bg-gray-50 transition-colors"
                                >
                                    {/* 모바일 카드 */}
                                    <div className="lg:hidden space-y-2">
                                        <div className="flex items-start gap-3">
                                            <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                {product.thumbnail ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={product.thumbnail}
                                                        alt={product.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon className="w-5 h-5 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <Link
                                                        href={`/partner/products/${product.id}`}
                                                        className="font-medium text-content-primary hover:text-primary line-clamp-2 transition-colors"
                                                    >
                                                        {product.title}
                                                    </Link>
                                                    {statusBadge}
                                                </div>
                                                {product.summary && (
                                                    <p className="text-xs text-gray-500 line-clamp-1">
                                                        {product.summary}
                                                    </p>
                                                )}
                                                <div className="text-sm text-gray-700">
                                                    {formatProductPrice(product)}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <span>{product.categorySlug ?? "-"}</span>
                                                    <span>·</span>
                                                    <span>
                                                        {createdAt
                                                            ? new Date(createdAt).toLocaleDateString("ko-KR", {
                                                                  year: "2-digit",
                                                                  month: "2-digit",
                                                                  day: "2-digit",
                                                              })
                                                            : "-"}
                                                    </span>
                                                    {product.reviewCount > 0 && (
                                                        <>
                                                            <span>·</span>
                                                            <span>리뷰 {product.reviewCount}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">{actions}</div>
                                    </div>

                                    {/* 데스크탑 그리드 */}
                                    <div className="hidden lg:grid grid-cols-[56px_minmax(180px,2fr)_minmax(100px,1fr)_minmax(120px,1fr)_90px_90px_110px] gap-3 items-center">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                            {product.thumbnail ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={product.thumbnail}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
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
                                            {product.reviewCount > 0 && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    리뷰 {product.reviewCount}개
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600 truncate">
                                            {product.categorySlug ?? "-"}
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            {formatProductPrice(product)}
                                        </div>
                                        <div className="flex justify-center">{statusBadge}</div>
                                        <div className="text-xs text-gray-500">
                                            {createdAt
                                                ? new Date(createdAt).toLocaleDateString("ko-KR", {
                                                      year: "2-digit",
                                                      month: "2-digit",
                                                      day: "2-digit",
                                                  })
                                                : "-"}
                                        </div>
                                        {actions}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
