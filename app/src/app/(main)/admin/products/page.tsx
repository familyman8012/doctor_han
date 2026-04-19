"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Package, Star, ExternalLink, Check, X, Filter, AlertCircle, FileDiff } from "lucide-react";
import { RichContent } from "@/components/ui/RichEditor/RichContent";
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

interface ResubmitChangedField {
    field: string;
    before: unknown;
    after: unknown;
}

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
    firstPublishedAt: string | null;
    isResubmit: boolean;
    resubmitReason: string | null;
    resubmitChangedFields: ResubmitChangedField[];
    createdAt: string;
    updatedAt: string;
}

const FIELD_LABELS: Record<string, string> = {
    title: "상품명",
    summary: "요약",
    description: "상세 설명",
    category: "카테고리",
    price_type: "가격 유형",
    price_min: "가격 하한",
    price_max: "가격 상한",
    price_unit: "가격 단위",
};

const PRICE_TYPE_LABELS: Record<string, string> = {
    fixed: "고정가",
    range: "범위형",
    negotiable: "협의",
    contact: "문의",
};

function formatValue(field: string, v: unknown): string {
    if (v === null || v === undefined || v === "") return "(없음)";
    // 가격 숫자
    if ((field === "price_min" || field === "price_max") && typeof v === "number") {
        return `${v.toLocaleString("ko-KR")}원`;
    }
    if (field === "price_type" && typeof v === "string") {
        return PRICE_TYPE_LABELS[v] ?? v;
    }
    if (typeof v === "string") {
        // description은 HTML일 수 있으므로 태그 제거 후 미리보기
        const plain = field === "description"
            ? v.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
            : v;
        return plain.length > 60 ? plain.slice(0, 60) + "…" : plain;
    }
    return String(v);
}

type StatusFilter = ProductStatus | "all" | "resubmit";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "draft", label: "초안" },
    { value: "pending_review", label: "심사중(최초)" },
    { value: "resubmit", label: "재수정" },
    { value: "active", label: "활성" },
    { value: "inactive", label: "비활성" },
    { value: "rejected", label: "반려" },
];

function canApproveProduct(status: ProductStatus) {
    return status === "draft" || status === "pending_review" || status === "rejected";
}

function canRejectProduct(status: ProductStatus) {
    return status === "draft" || status === "pending_review";
}

function canSuspendProduct(status: ProductStatus) {
    return status === "active";
}

function canResumeProduct(status: ProductStatus) {
    return status === "inactive";
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
    const [status, setStatus] = useState<StatusFilter>("all");
    const [categoryId, setCategoryId] = useState<string>("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [statusActionTarget, setStatusActionTarget] = useState<{
        productId: string;
        title: string;
        action: "reject" | "suspend";
    } | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [resubmitDetailTarget, setResubmitDetailTarget] = useState<AdminProductItem | null>(null);

    const { data: categoriesData } = useQuery({
        queryKey: ["admin", "categories"],
        queryFn: () => adminApi.getCategories(),
    });
    const categories = categoriesData?.data?.items ?? [];

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "products", status, categoryId, search, page],
        queryFn: async () => {
            const params = new URLSearchParams();
            // "resubmit"은 서버 status 필터가 아니라 클라이언트 필터
            if (status !== "all" && status !== "resubmit") params.set("status", status);
            if (status === "resubmit") params.set("status", "pending_review");
            if (categoryId) params.set("categoryId", categoryId);
            if (search) params.set("q", search);
            params.set("page", String(page));
            params.set("pageSize", String(PAGE_SIZE));

            const response = await api.get<{
                data: { items: AdminProductItem[]; page: number; pageSize: number; total: number };
            }>(`/api/admin/products?${params.toString()}`);
            const raw = response.data.data;
            if (status === "resubmit") {
                const filtered = raw.items.filter((i) => i.isResubmit);
                return { ...raw, items: filtered, total: filtered.length };
            }
            return raw;
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

    const statusChangeMutation = useMutation({
        mutationFn: async (params: {
            productId: string;
            status: "rejected" | "inactive";
            reason: string;
        }) => {
            await api.patch(`/api/admin/products/${params.productId}`, {
                status: params.status,
                rejectionReason: params.reason,
            });
        },
        onSuccess: (_d, vars) => {
            toast.success(vars.status === "rejected" ? "상품이 반려되었습니다" : "상품 판매가 중단되었습니다");
            setStatusActionTarget(null);
            setRejectionReason("");
            queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
        },
        onError: (_e, vars) =>
            toast.error(vars.status === "rejected" ? "반려에 실패했습니다" : "판매 중단에 실패했습니다"),
    });

    const resumeMutation = useMutation({
        mutationFn: async (productId: string) => {
            await api.patch(`/api/admin/products/${productId}`, { status: "active" });
        },
        onSuccess: () => {
            toast.success("판매가 재개되었습니다");
            queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
        },
        onError: () => toast.error("판매 재개에 실패했습니다"),
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
                                placeholder="상품명 또는 업체명으로 검색"
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
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {getStatusBadge(product.status)}
                                                {product.isResubmit && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setResubmitDetailTarget(product)}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium hover:bg-amber-200"
                                                    >
                                                        <AlertCircle className="w-3 h-3" />
                                                        재수정 {product.resubmitChangedFields.length > 0 ? `(${product.resubmitChangedFields.length})` : ""}
                                                    </button>
                                                )}
                                            </div>
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
                                        <div className="flex gap-2 pt-1 justify-end flex-wrap">
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
                                                    onClick={() =>
                                                        setStatusActionTarget({
                                                            productId: product.id,
                                                            title: product.title,
                                                            action: "reject",
                                                        })
                                                    }
                                                >
                                                    반려
                                                </Button>
                                            )}
                                            {canSuspendProduct(product.status) && (
                                                <Button
                                                    variant="danger"
                                                    size="xs"
                                                    onClick={() =>
                                                        setStatusActionTarget({
                                                            productId: product.id,
                                                            title: product.title,
                                                            action: "suspend",
                                                        })
                                                    }
                                                >
                                                    판매 중단
                                                </Button>
                                            )}
                                            {canResumeProduct(product.status) && (
                                                <Button
                                                    variant="primary"
                                                    size="xs"
                                                    onClick={() => resumeMutation.mutate(product.id)}
                                                    disabled={resumeMutation.isPending}
                                                >
                                                    판매 재개
                                                </Button>
                                            )}
                                        </div>
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
                                        <div className="flex flex-col gap-1 items-start">
                                            {getStatusBadge(product.status)}
                                            {product.isResubmit && (
                                                <button
                                                    type="button"
                                                    onClick={() => setResubmitDetailTarget(product)}
                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium hover:bg-amber-200"
                                                    title="변경 내역 보기"
                                                >
                                                    <AlertCircle className="w-3 h-3" />
                                                    재수정 {product.resubmitChangedFields.length > 0 ? `(${product.resubmitChangedFields.length})` : ""}
                                                </button>
                                            )}
                                        </div>
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
                                        <div className="flex items-center gap-1 flex-wrap">
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
                                                    onClick={() =>
                                                        setStatusActionTarget({
                                                            productId: product.id,
                                                            title: product.title,
                                                            action: "reject",
                                                        })
                                                    }
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="반려"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            {canSuspendProduct(product.status) && (
                                                <Button
                                                    variant="danger"
                                                    size="xs"
                                                    onClick={() =>
                                                        setStatusActionTarget({
                                                            productId: product.id,
                                                            title: product.title,
                                                            action: "suspend",
                                                        })
                                                    }
                                                >
                                                    판매 중단
                                                </Button>
                                            )}
                                            {canResumeProduct(product.status) && (
                                                <Button
                                                    variant="primary"
                                                    size="xs"
                                                    onClick={() => resumeMutation.mutate(product.id)}
                                                    disabled={resumeMutation.isPending}
                                                >
                                                    판매 재개
                                                </Button>
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

            {/* 재수정 변경 내역 모달 */}
            {resubmitDetailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                            <div className="flex items-start gap-2 min-w-0">
                                <FileDiff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-content-primary truncate">
                                        {resubmitDetailTarget.title}
                                    </h3>
                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                        <span>{resubmitDetailTarget.vendorName}</span>
                                        {resubmitDetailTarget.firstPublishedAt && (
                                            <>
                                                <span className="text-gray-300">·</span>
                                                <span>
                                                    최초 승인{" "}
                                                    {dayjs(resubmitDetailTarget.firstPublishedAt).format("YYYY.MM.DD")}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setResubmitDetailTarget(null)}
                                className="p-1 rounded hover:bg-gray-100 shrink-0"
                                aria-label="닫기"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-5">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                    <h4 className="font-medium text-content-primary text-sm">업체 작성 사유</h4>
                                </div>
                                {resubmitDetailTarget.resubmitReason ? (
                                    <p className="text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3 whitespace-pre-wrap">
                                        {resubmitDetailTarget.resubmitReason}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">사유 미입력</p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FileDiff className="w-4 h-4 text-blue-600" />
                                    <h4 className="font-medium text-content-primary text-sm">
                                        변경된 필드 ({resubmitDetailTarget.resubmitChangedFields.length})
                                    </h4>
                                </div>
                                {resubmitDetailTarget.resubmitChangedFields.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">
                                        비교 가능한 필드에 변경이 감지되지 않았습니다 (이미지/FAQ 변경은 추적 대상 외).
                                    </p>
                                ) : (
                                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                                        {resubmitDetailTarget.resubmitChangedFields.map((c) =>
                                            c.field === "description" ? (
                                                <DescriptionDiffRow
                                                    key={c.field}
                                                    before={c.before}
                                                    after={c.after}
                                                />
                                            ) : (
                                                <div
                                                    key={c.field}
                                                    className="grid grid-cols-[100px_1fr] gap-3 px-4 py-3 text-sm"
                                                >
                                                    <div className="text-gray-500 shrink-0">
                                                        {FIELD_LABELS[c.field] ?? c.field}
                                                    </div>
                                                    <div className="text-content-primary leading-relaxed break-words">
                                                        <span className="text-gray-400 line-through">
                                                            {formatValue(c.field, c.before)}
                                                        </span>
                                                        <span className="mx-2 text-primary font-bold">→</span>
                                                        <span className="font-medium text-content-primary">
                                                            {formatValue(c.field, c.after)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                            <Button variant="secondary" size="sm" onClick={() => setResubmitDetailTarget(null)}>
                                닫기
                            </Button>
                            {canApproveProduct(resubmitDetailTarget.status) && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        approveMutation.mutate(resubmitDetailTarget.id);
                                        setResubmitDetailTarget(null);
                                    }}
                                    disabled={approveMutation.isPending}
                                >
                                    승인
                                </Button>
                            )}
                            {canRejectProduct(resubmitDetailTarget.status) && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => {
                                        setStatusActionTarget({
                                            productId: resubmitDetailTarget.id,
                                            title: resubmitDetailTarget.title,
                                            action: "reject",
                                        });
                                        setResubmitDetailTarget(null);
                                    }}
                                >
                                    반려
                                </Button>
                            )}
                            {canSuspendProduct(resubmitDetailTarget.status) && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => {
                                        setStatusActionTarget({
                                            productId: resubmitDetailTarget.id,
                                            title: resubmitDetailTarget.title,
                                            action: "suspend",
                                        });
                                        setResubmitDetailTarget(null);
                                    }}
                                >
                                    판매 중단
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* (컴포넌트 정의는 파일 하단) */}

            {/* 상태 변경 사유 모달 (반려 / 판매 중단 공용) */}
            {statusActionTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 space-y-4">
                        <div>
                            <h3 className="text-lg font-bold text-content-primary">
                                {statusActionTarget.action === "reject" ? "상품 반려" : "판매 중단"}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {statusActionTarget.action === "reject"
                                    ? "반려 사유를 입력해 주세요. 업체가 수정 후 재제출할 수 있습니다."
                                    : "판매 중단 사유를 입력해 주세요. 업체는 이 상품을 수정할 수 없으며, 관리자가 별도로 재개해야 합니다."}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 truncate">대상: {statusActionTarget.title}</p>
                        </div>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={
                                statusActionTarget.action === "reject"
                                    ? "예: 상세 설명 부족, 이미지 해상도 부적절"
                                    : "예: 정책 위반 신고 접수, 민원 조사 중"
                            }
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setStatusActionTarget(null);
                                    setRejectionReason("");
                                }}
                            >
                                취소
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                    if (!rejectionReason.trim()) {
                                        toast.error("사유를 입력해 주세요");
                                        return;
                                    }
                                    statusChangeMutation.mutate({
                                        productId: statusActionTarget.productId,
                                        status: statusActionTarget.action === "reject" ? "rejected" : "inactive",
                                        reason: rejectionReason,
                                    });
                                }}
                                disabled={statusChangeMutation.isPending}
                            >
                                {statusActionTarget.action === "reject" ? "반려하기" : "중단하기"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** 본문(description) 변경 — 왼쪽/오른쪽 두 컬럼 스크롤 박스로 sanitize HTML 렌더 */
function DescriptionDiffRow({ before, after }: { before: unknown; after: unknown }) {
    const toHtml = (v: unknown): string => {
        if (v === null || v === undefined || v === "") return "";
        return typeof v === "string" ? v : String(v);
    };
    const beforeHtml = toHtml(before);
    const afterHtml = toHtml(after);
    const EmptyFallback = () => <div className="text-xs text-gray-400 italic">(없음)</div>;
    return (
        <div className="px-4 py-3 space-y-2">
            <div className="text-sm text-gray-500">본문</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-md bg-gray-50 flex flex-col">
                    <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-200">
                        이전
                    </div>
                    <div className="px-3 py-3 max-h-96 overflow-y-auto text-sm">
                        {beforeHtml ? (
                            <RichContent html={beforeHtml} className="prose-sm" />
                        ) : (
                            <EmptyFallback />
                        )}
                    </div>
                </div>
                <div className="border border-primary/30 rounded-md bg-primary/5 flex flex-col">
                    <div className="px-3 py-1.5 text-xs text-primary font-medium border-b border-primary/20">
                        현재
                    </div>
                    <div className="px-3 py-3 max-h-96 overflow-y-auto text-sm">
                        {afterHtml ? (
                            <RichContent html={afterHtml} className="prose-sm" />
                        ) : (
                            <EmptyFallback />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
