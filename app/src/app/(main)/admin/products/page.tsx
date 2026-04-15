"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Package, Star, ExternalLink, Check, X, Filter } from "lucide-react";
import dayjs from "dayjs";
import Link from "next/link";
import api from "@/api-client/client";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Badge } from "@/components/ui/Badge/Badge";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";
import { toast } from "sonner";

const PAGE_SIZE = 20;

type ProductStatus = "draft" | "pending_review" | "active" | "inactive" | "rejected";

interface AdminProductItem {
    id: string;
    vendorId: string;
    vendorName: string;
    categoryId: string;
    categoryName: string;
    categorySlug: string;
    title: string;
    summary: string | null;
    status: ProductStatus;
    priceType: string;
    priceMin: number | null;
    priceMax: number | null;
    ratingAvg: number | null;
    reviewCount: number;
    thumbnail: string | null;
    createdAt: string;
    updatedAt: string;
}

const STATUS_OPTIONS: { value: ProductStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "draft", label: "초안" },
    { value: "pending_review", label: "심사중" },
    { value: "active", label: "활성" },
    { value: "inactive", label: "비활성" },
    { value: "rejected", label: "반려" },
];

function canApproveProduct(status: ProductStatus) {
    return status === "draft" || status === "pending_review" || status === "rejected";
}

function canRejectProduct(status: ProductStatus) {
    return status === "draft" || status === "pending_review" || status === "active";
}

function getStatusBadge(status: ProductStatus) {
    switch (status) {
        case "active":
            return <Badge color="success" size="sm">활성</Badge>;
        case "draft":
            return <Badge color="neutral" size="sm">초안</Badge>;
        case "pending_review":
            return <Badge color="warning" size="sm">심사중</Badge>;
        case "inactive":
            return <Badge color="neutral" size="sm">비활성</Badge>;
        case "rejected":
            return <Badge color="error" size="sm">반려</Badge>;
    }
}

export default function AdminProductsPage() {
    const queryClient = useQueryClient();
    const [status, setStatus] = useState<ProductStatus | "all">("all");
    const [categoryId, setCategoryId] = useState<string>("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const { data: categoriesData } = useQuery({
        queryKey: ["admin", "categories"],
        queryFn: () => adminApi.getCategories(),
    });
    const categories = categoriesData?.data?.items ?? [];

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "products", status, categoryId, search, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (status !== "all") params.set("status", status);
            if (categoryId) params.set("categoryId", categoryId);
            if (search) params.set("q", search);
            params.set("page", String(page));
            params.set("pageSize", String(PAGE_SIZE));

            const response = await api.get<{
                data: { items: AdminProductItem[]; page: number; pageSize: number; total: number };
            }>(`/api/admin/products?${params.toString()}`);
            return response.data.data;
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (productId: string) => {
            await api.patch(`/api/admin/products/${productId}`, { status: "active" });
        },
        onSuccess: () => {
            toast.success("상품이 승인되었습니다");
            queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
        },
        onError: () => toast.error("승인에 실패했습니다"),
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ productId, reason }: { productId: string; reason: string }) => {
            await api.patch(`/api/admin/products/${productId}`, {
                status: "rejected",
                rejectionReason: reason,
            });
        },
        onSuccess: () => {
            toast.success("상품이 반려되었습니다");
            setRejectingId(null);
            setRejectionReason("");
            queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
        },
        onError: () => toast.error("반려에 실패했습니다"),
    });

    const items = data?.items ?? [];
    const total = data?.total ?? 0;

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-xl font-bold text-content-primary">상품 관리</h1>
                <p className="text-sm text-gray-500 mt-1">등록된 상품을 조회하고 승인/반려합니다.</p>
            </div>

            {/* 필터 영역 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((opt) => (
                            <Button
                                key={opt.value}
                                variant={status === opt.value ? "listActive" : "list"}
                                size="sm"
                                onClick={() => {
                                    setStatus(opt.value);
                                    setPage(1);
                                }}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={categoryId}
                            onChange={(e) => {
                                setCategoryId(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                        >
                            <option value="">전체 카테고리</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 max-w-xs">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="상품명으로 검색"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 목록 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : items.length === 0 ? (
                    <Empty title="상품이 없습니다" description="조건에 맞는 상품이 없습니다." />
                ) : (
                    <>
                        {/* 테이블 헤더 - 데스크탑 */}
                        <div className="hidden lg:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_120px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
                            <div>상품</div>
                            <div>업체</div>
                            <div>카테고리</div>
                            <div>상태</div>
                            <div>평점</div>
                            <div>등록일</div>
                            <div>액션</div>
                        </div>

                        {/* 목록 */}
                        <div className="divide-y divide-gray-100">
                            {items.map((product) => (
                                <div
                                    key={product.id}
                                    className="p-4 hover:bg-gray-50 transition-colors"
                                >
                                    {/* 모바일 레이아웃 */}
                                    <div className="lg:hidden space-y-2">
                                        <div className="flex items-center justify-between">
                                            {getStatusBadge(product.status)}
                                            <span className="text-xs text-gray-400">
                                                {dayjs(product.createdAt).format("YYYY.MM.DD")}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {product.thumbnail ? (
                                                <img
                                                    src={product.thumbnail}
                                                    alt={product.title}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <Link href={`/products/${product.id}`} target="_blank" className="font-medium text-content-primary truncate hover:text-primary hover:underline block">{product.title}</Link>
                                                <Link href={`/vendors/${product.vendorId}`} target="_blank" className="text-xs text-gray-500 hover:text-primary hover:underline">{product.vendorName}</Link>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <Badge color="neutral" size="xs">{product.categoryName}</Badge>
                                            {product.ratingAvg && (
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                    {product.ratingAvg.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                        {(canApproveProduct(product.status) || canRejectProduct(product.status)) && (
                                            <div className="flex gap-2 pt-1 justify-end">
                                                {canApproveProduct(product.status) && (
                                                    <Button
                                                        variant="primary"
                                                        size="xs"
                                                        onClick={() => approveMutation.mutate(product.id)}
                                                        disabled={approveMutation.isPending}
                                                    >
                                                        승인
                                                    </Button>
                                                )}
                                                {canRejectProduct(product.status) && (
                                                    <Button
                                                        variant="danger"
                                                        size="xs"
                                                        onClick={() => setRejectingId(product.id)}
                                                    >
                                                        반려
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* 데스크탑 레이아웃 */}
                                    <div className="hidden lg:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_120px] gap-4 items-center">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3">
                                                {product.thumbnail ? (
                                                    <img
                                                        src={product.thumbnail}
                                                        alt={product.title}
                                                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                        <Package className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <Link href={`/products/${product.id}`} target="_blank" className="font-medium text-content-primary truncate hover:text-primary hover:underline block">
                                                        {product.title}
                                                    </Link>
                                                    {product.summary && (
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {product.summary}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm truncate">
                                            <Link href={`/vendors/${product.vendorId}`} target="_blank" className="text-gray-700 hover:text-primary hover:underline">
                                                {product.vendorName}
                                            </Link>
                                        </div>
                                        <div>
                                            <Badge color="neutral" size="xs">{product.categoryName}</Badge>
                                        </div>
                                        <div>{getStatusBadge(product.status)}</div>
                                        <div className="text-sm">
                                            {product.ratingAvg ? (
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                    {product.ratingAvg.toFixed(1)}
                                                    <span className="text-gray-400">({product.reviewCount})</span>
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {dayjs(product.createdAt).format("YYYY.MM.DD")}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {canApproveProduct(product.status) && (
                                                <button
                                                    type="button"
                                                    onClick={() => approveMutation.mutate(product.id)}
                                                    disabled={approveMutation.isPending}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    title="승인"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            {canRejectProduct(product.status) && (
                                                <button
                                                    type="button"
                                                    onClick={() => setRejectingId(product.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="반려"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            <Link href={`/products/${product.id}`} target="_blank">
                                                <Button
                                                    variant="secondary"
                                                    size="xs"
                                                    IconOnly={<ExternalLink />}
                                                />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {total > PAGE_SIZE && (
                    <div className="border-t border-gray-100 py-4">
                        <Pagination
                            pageInfo={[page, PAGE_SIZE]}
                            totalCount={total}
                            handlePageChange={setPage}
                        />
                    </div>
                )}
            </div>

            {/* 통계 */}
            <div className="text-sm text-gray-500 text-center">
                총 <span className="font-medium text-content-primary">{total}</span>개의 상품
            </div>

            {/* 반려 사유 모달 */}
            {rejectingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
                        <h3 className="text-lg font-bold text-content-primary">상품 반려</h3>
                        <p className="text-sm text-gray-500">반려 사유를 입력해 주세요.</p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="반려 사유를 입력하세요"
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setRejectingId(null);
                                    setRejectionReason("");
                                }}
                            >
                                취소
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    if (!rejectionReason.trim()) {
                                        toast.error("반려 사유를 입력해 주세요");
                                        return;
                                    }
                                    rejectMutation.mutate({
                                        productId: rejectingId,
                                        reason: rejectionReason,
                                    });
                                }}
                                disabled={rejectMutation.isPending}
                            >
                                반려하기
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
