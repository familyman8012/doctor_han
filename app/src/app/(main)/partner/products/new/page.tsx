"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { AlertCircle, ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { ProductImageManager, type ProductImageItem } from "@/components/widgets/ProductImageManager";
import { ProductFaqEditor, type ProductFaqItem } from "@/components/widgets/ProductFaqEditor";
import type { ProductPriceType } from "@/lib/schema/product";
import type { VendorMeResponse } from "@/lib/schema/vendor";

interface CategoryOption {
    id: string;
    name: string;
    slug: string;
    listingType?: string;
}

interface ProductFormData {
    categoryId: string;
    title: string;
    summary: string;
    description: string;
    priceType: ProductPriceType;
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

export default function PartnerProductNewPage() {
    const router = useRouter();
    const [priceType, setPriceType] = useState<ProductPriceType>("contact");
    const [images, setImages] = useState<ProductImageItem[]>([]);
    const [faqs, setFaqs] = useState<ProductFaqItem[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProductFormData>({
        defaultValues: {
            categoryId: "",
            title: "",
            summary: "",
            description: "",
            priceType: "contact",
            priceMin: "",
            priceMax: "",
            priceUnit: "",
        },
    });

    const { data: vendor, isLoading: vendorLoading } = useQuery({
        queryKey: ["vendor", "me", "product-setup"],
        queryFn: async () => {
            const res = await api.get<VendorMeResponse>("/api/vendors/me");
            return res.data.data.vendor ?? null;
        },
    });

    const vendorCategories = (vendor?.categories ?? []) as CategoryOption[];
    const productCategories = vendorCategories.filter((category) => category.listingType === "product");
    const hasVendorProfile = Boolean(vendor);
    const hasVendorCategories = vendorCategories.length > 0;
    const hasProductCategories = productCategories.length > 0;

    let categoryGuide = "";
    if (!hasVendorProfile) {
        categoryGuide = "업체 프로필이 아직 없습니다. 먼저 업체 프로필과 카테고리를 저장해주세요.";
    } else if (!hasVendorCategories) {
        categoryGuide = "업체 프로필에 연결된 카테고리가 없습니다. 업체 프로필에서 카테고리를 먼저 선택해주세요.";
    } else if (!hasProductCategories) {
        categoryGuide = "현재 선택한 카테고리에는 상품형 카테고리가 없습니다. 상품 등록이 가능한 카테고리를 업체 프로필에서 추가해주세요.";
    }

    const createMutation = useMutation({
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
                categoryId: data.categoryId,
                title: data.title.trim(),
                summary: data.summary.trim() || null,
                description: data.description.trim() || null,
                priceType: priceType,
                priceUnit: data.priceUnit.trim() || null,
            };

            if (priceType === "fixed" && data.priceMin) {
                body.priceMin = Number(data.priceMin);
            }
            if (priceType === "range") {
                if (data.priceMin) body.priceMin = Number(data.priceMin);
                if (data.priceMax) body.priceMax = Number(data.priceMax);
            }

            // Attach images
            const doneImages = images.filter((img) => img.status === "done" && img.fileId);
            if (doneImages.length > 0) {
                body.images = doneImages.map((img, i) => ({
                    fileId: img.fileId,
                    altText: img.altText || null,
                    isPrimary: img.isPrimary,
                    sortOrder: i,
                }));
            }

            // Attach FAQs
            const validFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());
            if (validFaqs.length > 0) {
                body.faqs = validFaqs.map((f, i) => ({
                    question: f.question.trim(),
                    answer: f.answer.trim(),
                    sortOrder: i,
                }));
            }

            const res = await api.post("/api/vendors/me/products", body);
            return res.data;
        },
        onSuccess: () => {
            toast.success("상품이 등록되어 관리자 검토를 요청했습니다.");
            router.push("/partner/products");
        },
        onError: (err: Error) => {
            toast.error(err.message || "상품 등록에 실패했습니다.");
        },
    });

    const onSubmit = (data: ProductFormData) => {
        if (!hasVendorProfile) {
            toast.error("업체 프로필을 먼저 등록해주세요.");
            return;
        }
        if (!hasVendorCategories) {
            toast.error("업체 프로필에서 카테고리를 먼저 선택해주세요.");
            return;
        }
        if (!hasProductCategories) {
            toast.error("상품형 카테고리를 업체 프로필에서 먼저 추가해주세요.");
            return;
        }
        if (!data.categoryId) {
            toast.error("카테고리를 선택해주세요.");
            return;
        }
        createMutation.mutate(data);
    };

    if (vendorLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-content-primary flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        새 상품 등록
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        상품 정보를 입력하면 등록과 함께 관리자 검토가 요청됩니다.
                    </p>
                </div>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
            >
                {/* Category */}
                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-content-primary mb-1.5">
                        카테고리 <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="categoryId"
                        {...register("categoryId", { required: "카테고리를 선택해주세요." })}
                        disabled={!hasProductCategories}
                        className="w-full h-[38px] px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        <option value="">카테고리 선택</option>
                        {productCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    {errors.categoryId && (
                        <p className="mt-1.5 text-sm text-red-500">{errors.categoryId.message}</p>
                    )}
                    {!hasProductCategories && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                                <div className="space-y-3 text-sm text-amber-900">
                                    <p>{categoryGuide}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button asChild variant="secondary" size="sm">
                                            <Link href="/partner">업체 프로필로 이동</Link>
                                        </Button>
                                        {hasVendorProfile && hasVendorCategories && (
                                            <Button asChild variant="ghostSecondary" size="sm">
                                                <Link href="/partner/pricing">서비스 단가도 확인</Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
                    <div className="space-y-4">
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

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => router.back()}
                    >
                        취소
                    </Button>
                    <Button
                        type="submit"
                        isLoading={createMutation.isPending}
                        disabled={createMutation.isPending || !hasProductCategories}
                    >
                        등록 후 검토 요청
                    </Button>
                </div>
            </form>
        </div>
    );
}
