"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Building2, MapPin, Tag, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import type { VendorDetail } from "@/lib/schema/vendor";
import type { MeData } from "@/lib/schema/profile";

interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    depth: number;
}

interface VendorFormData {
    name: string;
    summary: string;
    description: string;
    regionPrimary: string;
    regionSecondary: string;
    priceMin: string;
    priceMax: string;
}

export default function PartnerProfilePage() {
    const queryClient = useQueryClient();
    const vendorVerification = useAuthStore((state) => state.vendorVerification);
    const setAuth = useAuthStore((state) => state.setAuth);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

    // 내 업체 정보 조회
    const { data: vendorData, isLoading: vendorLoading } = useQuery({
        queryKey: ["vendor", "me"],
        queryFn: async () => {
            const res = await api.get<{ data: { vendor: VendorDetail | null } }>("/api/vendors/me");
            return res.data.data.vendor;
        },
    });

    // 카테고리 목록 조회
    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await api.get<{ data: { items: Category[] } }>("/api/categories");
            return res.data.data.items;
        },
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm<VendorFormData>({
        defaultValues: {
            name: "",
            summary: "",
            description: "",
            regionPrimary: "",
            regionSecondary: "",
            priceMin: "",
            priceMax: "",
        },
    });

    // 폼 초기값 설정
    useEffect(() => {
        if (vendorData) {
            reset({
                name: vendorData.name ?? "",
                summary: vendorData.summary ?? "",
                description: vendorData.description ?? "",
                regionPrimary: vendorData.regionPrimary ?? "",
                regionSecondary: vendorData.regionSecondary ?? "",
                priceMin: vendorData.priceMin?.toString() ?? "",
                priceMax: vendorData.priceMax?.toString() ?? "",
            });
            setSelectedCategoryIds(vendorData.categories?.map((c) => c.id) ?? []);
        }
    }, [vendorData, reset]);

    // 업체 프로필 생성/수정
    const saveMutation = useMutation({
        mutationFn: async (data: VendorFormData) => {
            const payload = {
                name: data.name,
                summary: data.summary || null,
                description: data.description || null,
                regionPrimary: data.regionPrimary || null,
                regionSecondary: data.regionSecondary || null,
                priceMin: data.priceMin ? parseInt(data.priceMin, 10) : null,
                priceMax: data.priceMax ? parseInt(data.priceMax, 10) : null,
                categoryIds: selectedCategoryIds,
            };

            if (vendorData) {
                return api.patch("/api/vendors/me", payload);
            }
            return api.post("/api/vendors/me", payload);
        },
        onSuccess: async () => {
            toast.success(vendorData ? "업체 프로필이 수정되었습니다" : "업체 프로필이 생성되었습니다");
            // me 데이터 새로고침
            const res = await api.get<{ data: MeData }>("/api/me");
            const data = res.data.data;
            setAuth({
                user: data.user,
                profile: data.profile,
                doctorVerification: data.doctorVerification,
                vendorVerification: data.vendorVerification,
                onboardingRequired: data.onboardingRequired,
            });
            queryClient.invalidateQueries({ queryKey: ["vendor", "me"] });
            queryClient.setQueryData(["auth", "me"], data);
        },
    });

    const toggleCategory = (categoryId: string) => {
        setSelectedCategoryIds((prev) =>
            prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
        );
    };

    const onSubmit = (data: VendorFormData) => {
        saveMutation.mutate(data);
    };

    const verification = vendorVerification;
    const verificationStatus = verification?.status;

    // 최상위 카테고리만 필터링
    const topCategories = categories?.filter((c) => c.depth === 1) ?? [];

    if (vendorLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-2xl font-bold text-[#0a3b41]">업체 프로필</h1>
                <p className="text-gray-500 mt-1">업체 정보를 관리하고 고객에게 노출되는 정보를 수정할 수 있습니다</p>
            </div>

            {/* 인증 상태 배너 */}
            {verification && (
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                    verificationStatus === "approved"
                        ? "bg-green-50 text-green-700"
                        : verificationStatus === "pending"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-red-50 text-red-700"
                }`}>
                    {verificationStatus === "approved" ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : verificationStatus === "pending" ? (
                        <Clock className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <div>
                        <p className="font-medium">
                            {verificationStatus === "approved"
                                ? "사업자 인증 완료"
                                : verificationStatus === "pending"
                                ? "인증 심사 중"
                                : "인증 반려"}
                        </p>
                        {verificationStatus === "rejected" && verification.rejectReason && (
                            <p className="text-sm mt-0.5">{verification.rejectReason}</p>
                        )}
                    </div>
                </div>
            )}

            {/* 프로필이 없는 경우 안내 */}
            {!vendorData && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 text-blue-700">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">업체 프로필을 등록해주세요</p>
                        <p className="text-sm mt-0.5">
                            업체 프로필을 등록하면 고객에게 노출되어 문의를 받을 수 있습니다
                        </p>
                    </div>
                </div>
            )}

            {/* 폼 */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 기본 정보 */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-[#0a3b41] mb-5 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#62e3d5]" />
                        기본 정보
                    </h2>

                    <div className="space-y-5">
                        {/* 업체명 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                업체명 <span className="text-red-500">*</span>
                            </label>
                            <Input
                                {...register("name", { required: "업체명을 입력해주세요" })}
                                placeholder="업체명을 입력하세요"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        {/* 한 줄 소개 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                한 줄 소개
                            </label>
                            <Input
                                {...register("summary")}
                                placeholder="업체를 한 줄로 소개해주세요"
                            />
                        </div>

                        {/* 상세 설명 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                상세 설명
                            </label>
                            <textarea
                                {...register("description")}
                                rows={5}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62e3d5] focus:border-transparent resize-none"
                                placeholder="업체에 대해 자세히 설명해주세요"
                            />
                        </div>
                    </div>
                </div>

                {/* 지역 정보 */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-[#0a3b41] mb-5 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#62e3d5]" />
                        서비스 지역
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                주요 지역
                            </label>
                            <Input
                                {...register("regionPrimary")}
                                placeholder="예: 서울"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                세부 지역
                            </label>
                            <Input
                                {...register("regionSecondary")}
                                placeholder="예: 강남구, 서초구"
                            />
                        </div>
                    </div>
                </div>

                {/* 가격 정보 */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-[#0a3b41] mb-5">가격 범위</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                최소 가격
                            </label>
                            <Input
                                {...register("priceMin")}
                                type="number"
                                placeholder="최소 가격 (원)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                최대 가격
                            </label>
                            <Input
                                {...register("priceMax")}
                                type="number"
                                placeholder="최대 가격 (원)"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        가격 범위를 설정하면 고객이 필터링하여 검색할 수 있습니다
                    </p>
                </div>

                {/* 카테고리 */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-[#0a3b41] mb-5 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-[#62e3d5]" />
                        서비스 카테고리
                    </h2>

                    <div className="flex flex-wrap gap-2">
                        {topCategories.map((category) => {
                            const isSelected = selectedCategoryIds.includes(category.id);
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => toggleCategory(category.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isSelected
                                            ? "bg-[#62e3d5] text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    {category.name}
                                </button>
                            );
                        })}
                    </div>
                    {topCategories.length === 0 && (
                        <p className="text-sm text-gray-500">카테고리가 없습니다</p>
                    )}
                </div>

                {/* 제출 버튼 */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={saveMutation.isPending}
                        isLoading={saveMutation.isPending}
                    >
                        {vendorData ? "저장하기" : "업체 프로필 등록"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
