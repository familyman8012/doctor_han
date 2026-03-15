"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ArrowLeft, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { ProductImageManager, type ProductImageItem } from "@/components/widgets/ProductImageManager";
import { ProductFaqEditor, type ProductFaqItem } from "@/components/widgets/ProductFaqEditor";
import { cn } from "@/components/utils";
import type { ProductDetail, ProductPriceType } from "@/lib/schema/product";

interface CategoryOption {
    id: string;
    name: string;
    slug: string;
    listingType?: string;
}

interface ProductFormData {
    title: string;
    summary: string;
    description: string;
    priceMin: string;
    priceMax: string;
    priceUnit: string;
}

const PRICE_TYPE_OPTIONS: { value: ProductPriceType; label: string }[] = [
    { value: "fixed", label: "고정가" },
    { value: "range", label: "범위" },
    { value: "negotiable", label: "협의" },
    { value: "contact", label: "문의" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: "draft", label: "임시저장" },
    { value: "pending_review", label: "검토 요청" },
    { value: "inactive", label: "비활성" },
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

export default function PartnerProductEditPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const queryClient = useQueryClient();

    // Fetch product detail
    const { data: product, isLoading } = useQuery({
        queryKey: ["vendor", "me", "products", id],
        queryFn: async () => {
            const res = await api.get<{ data: { product: ProductDetail } }>(
                `/api/vendors/me/products/${id}`,
            );
            return res.data.data.product;
        },
        enabled: !!id,
    });

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await api.get<{ data: { items: CategoryOption[] } }>("/api/categories");
            return res.data.data.items;
        },
    });

    // Delete mutation (can be defined before conditional returns)
    const deleteMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/api/vendors/me/products/${id}`);
        },
        onSuccess: () => {
            toast.success("상품이 삭제되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["vendor", "me", "products"] });
            router.push("/partner/products");
        },
    });

    if (!id) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-content-primary">상품을 찾을 수 없습니다</h1>
                </div>
            </div>
        );
    }

    return (
        <ProductEditForm
            product={product}
            categories={categoriesData ?? []}
            productId={id}
            onDelete={() => {
                if (confirm("상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                    deleteMutation.mutate();
                }
            }}
            isDeleting={deleteMutation.isPending}
        />
    );
}

function ProductEditForm({
    product,
    categories,
    productId,
    onDelete,
    isDeleting,
}: {
    product: ProductDetail;
    categories: CategoryOption[];
    productId: string;
    onDelete: () => void;
    isDeleting: boolean;
}) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [priceType, setPriceType] = useState<ProductPriceType>(product.priceType);
    const [status, setStatus] = useState<string>(product.status);

    // Initialize images from product data
    const [images, setImages] = useState<ProductImageItem[]>(() =>
        (product.images ?? []).map((img) => ({
            localId: img.id,
            fileId: img.fileId ?? undefined,
            previewUrl: img.fileId ? `/api/files/open?fileId=${img.fileId}` : img.url ?? "",
            altText: img.altText ?? undefined,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
            status: "done" as const,
        })),
    );

    // Initialize FAQs from product data
    const [faqs, setFaqs] = useState<ProductFaqItem[]>(() =>
        (product.faqs ?? []).map((faq) => ({
            localId: faq.id,
            question: faq.question,
            answer: faq.answer,
        })),
    );

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProductFormData>({
        defaultValues: {
            title: product.title,
            summary: product.summary ?? "",
            description: product.description ?? "",
            priceMin: product.priceMin != null ? String(product.priceMin) : "",
            priceMax: product.priceMax != null ? String(product.priceMax) : "",
            priceUnit: product.priceUnit ?? "",
        },
    });

    const categoryName =
        categories.find((c) => c.id === product.categoryId)?.name ?? "-";

    const updateMutation = useMutation({
        mutationFn: async (data: ProductFormData) => {
            // Check all images are uploaded
            const uploading = images.some((img) => img.status === "uploading");
            if (uploading) {
                throw new Error("이미지 업로드가 진행 중입니다. 잠시 후 다시 시도해주세요.");
            }
            const errorImages = images.filter((img) => img.status === "error");
            if (errorImages.length > 0) {
                throw new Error("업로드 실패한 이미지가 있습니다. 제거하거나 재시도해주세요.");
            }

            const body: Record<string, unknown> = {
                title: data.title.trim(),
                summary: data.summary.trim() || null,
                description: data.description.trim() || null,
                priceType: priceType,
                priceUnit: data.priceUnit.trim() || null,
            };

            if (status !== product.status) {
                body.status = status;
            }

            if (priceType === "fixed" && data.priceMin) {
                body.priceMin = Number(data.priceMin);
                body.priceMax = null;
            } else if (priceType === "range") {
                body.priceMin = data.priceMin ? Number(data.priceMin) : null;
                body.priceMax = data.priceMax ? Number(data.priceMax) : null;
            } else {
                body.priceMin = null;
                body.priceMax = null;
            }

            // Attach images (fileId-based uploads + URL-only seed images)
            const doneImages = images.filter(
                (img) => img.status === "done" && (img.fileId || img.previewUrl),
            );
            body.images = doneImages.map((img, i) => ({
                fileId: img.fileId ?? null,
                url: !img.fileId && img.previewUrl ? img.previewUrl : null,
                altText: img.altText || null,
                isPrimary: img.isPrimary,
                sortOrder: i,
            }));

            // Attach FAQs
            const validFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());
            body.faqs = validFaqs.map((f, i) => ({
                question: f.question.trim(),
                answer: f.answer.trim(),
                sortOrder: i,
            }));

            const res = await api.patch(`/api/vendors/me/products/${productId}`, body);
            return res.data;
        },
        onSuccess: () => {
            toast.success("상품이 수정되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["vendor", "me", "products"] });
            queryClient.invalidateQueries({ queryKey: ["vendor", "me", "products", productId] });
        },
        onError: (err: Error) => {
            toast.error(err.message || "상품 수정에 실패했습니다.");
        },
    });

    const onSubmit = (data: ProductFormData) => {
        updateMutation.mutate(data);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => router.push("/partner/products")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            상품 수정
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className={cn(
                                    "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                                    STATUS_STYLES[product.status] ?? STATUS_STYLES.draft,
                                )}
                            >
                                {STATUS_LABELS[product.status] ?? product.status}
                            </span>
                            <span className="text-sm text-gray-500">
                                등록일: {new Date(product.createdAt).toLocaleDateString("ko-KR")}
                            </span>
                        </div>
                    </div>
                </div>
                <Button
                    variant="danger"
                    size="sm"
                    LeadingIcon={<Trash2 />}
                    onClick={onDelete}
                    disabled={isDeleting}
                >
                    삭제
                </Button>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
            >
                {/* Category (read-only) */}
                <div>
                    <label className="block text-sm font-medium text-content-primary mb-1.5">
                        카테고리
                    </label>
                    <div className="h-[38px] px-3 flex items-center text-sm text-gray-600 border border-gray-200 rounded-lg bg-gray-50">
                        {categoryName}
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">
                        카테고리는 변경할 수 없습니다.
                    </p>
                </div>

                {/* Title */}
                <Input
                    label="상품명"
                    required
                    placeholder="상품명을 입력하세요"
                    maxLength={200}
                    error={errors.title?.message}
                    {...register("title", {
                        required: "상품명을 입력해주세요.",
                        maxLength: { value: 200, message: "200자 이내로 입력해주세요." },
                    })}
                />

                {/* Summary */}
                <Input
                    label="요약"
                    placeholder="상품을 간단히 설명하세요 (선택)"
                    maxLength={500}
                    {...register("summary")}
                />

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-content-primary mb-1.5">
                        상세 설명
                    </label>
                    <textarea
                        id="description"
                        rows={6}
                        placeholder="상품의 상세 내용을 작성하세요 (선택)"
                        className="w-full px-3 py-2 text-sm text-content-primary border border-gray-200 rounded-lg bg-white transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:cursor-not-allowed resize-y"
                        {...register("description")}
                    />
                </div>

                {/* Images */}
                <ProductImageManager value={images} onChange={setImages} />

                {/* FAQs */}
                <ProductFaqEditor value={faqs} onChange={setFaqs} />

                {/* Price Type */}
                <div>
                    <label className="block text-sm font-medium text-content-primary mb-1.5">
                        가격 유형
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PRICE_TYPE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setPriceType(opt.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                    priceType === opt.value
                                        ? "border-primary bg-primary-25 text-primary"
                                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conditional Price Fields */}
                {priceType === "fixed" && (
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <Input
                                label="가격"
                                type="number"
                                placeholder="가격을 입력하세요"
                                {...register("priceMin")}
                            />
                        </div>
                        <div className="w-32">
                            <Input
                                label="단위"
                                placeholder="월, 건, 회"
                                {...register("priceUnit")}
                            />
                        </div>
                    </div>
                )}

                {priceType === "range" && (
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <Input
                                label="최소 가격"
                                type="number"
                                placeholder="최소 가격"
                                {...register("priceMin")}
                            />
                        </div>
                        <span className="pb-2 text-gray-400">~</span>
                        <div className="flex-1">
                            <Input
                                label="최대 가격"
                                type="number"
                                placeholder="최대 가격"
                                {...register("priceMax")}
                            />
                        </div>
                        <div className="w-32">
                            <Input
                                label="단위"
                                placeholder="월, 건, 회"
                                {...register("priceUnit")}
                            />
                        </div>
                    </div>
                )}

                {(priceType === "negotiable" || priceType === "contact") && (
                    <div className="w-32">
                        <Input
                            label="단위"
                            placeholder="월, 건, 회"
                            helperText="선택사항"
                            {...register("priceUnit")}
                        />
                    </div>
                )}

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-content-primary mb-1.5">
                        상태 변경
                    </label>
                    {product.status === "rejected" ? (
                        <div>
                            <div className="h-[38px] px-3 flex items-center text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
                                반려됨 - 상태를 변경하려면 수정 후 검토를 다시 요청하세요.
                            </div>
                            <div className="mt-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setStatus("pending_review")}
                                >
                                    검토 재요청
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatus(opt.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                        status === opt.value
                                            ? "border-primary bg-primary-25 text-primary"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.push("/partner/products")}
                    >
                        취소
                    </Button>
                    <Button
                        type="submit"
                        isLoading={updateMutation.isPending}
                        disabled={updateMutation.isPending}
                    >
                        저장
                    </Button>
                </div>
            </form>
        </div>
    );
}
