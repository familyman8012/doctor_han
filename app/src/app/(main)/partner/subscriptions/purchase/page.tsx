"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { subscriptionsApi } from "@/api-client/subscriptions";
import { creditsApi } from "@/api-client/credits";
import { vendorPricingApi } from "@/api-client/vendor-pricing";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Button } from "@/components/ui/Button/button";
import type { SubscriptionPlan } from "@/lib/schema/subscription";
import type { CategoryView } from "@/lib/schema/category";
import { useState } from "react";

function formatKRW(amount: number): string {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

function formatDiscountRate(rate: number): string {
    return Math.round(rate * 100) + "%";
}

function getRemainingDays(expiresAt: string): number {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

type Step = "category" | "plan" | "confirm";

export default function SubscriptionPurchasePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [step, setStep] = useState<Step>("category");
    const [selectedCategory, setSelectedCategory] = useState<CategoryView | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

    // 업체 카테고리 목록 (pricing에서 가져옴 — vendor_categories 기반)
    const { data: pricingData, isLoading: pricingLoading } = useQuery({
        queryKey: ["vendor-pricing", "list"],
        queryFn: () => vendorPricingApi.list(),
    });

    // 현재 구독 목록 (이미 active인 카테고리 필터링용)
    const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
        queryKey: ["subscriptions", "list"],
        queryFn: () => subscriptionsApi.list(),
    });

    // 구독 플랜 목록
    const { data: planData, isLoading: planLoading } = useQuery({
        queryKey: ["subscriptions", "plans"],
        queryFn: () => subscriptionsApi.listPlans(),
    });

    // 크레딧 잔액
    const { data: creditData } = useQuery({
        queryKey: ["credits", "balance"],
        queryFn: () => creditsApi.getBalance(),
    });

    const purchaseMutation = useMutation({
        mutationFn: () =>
            subscriptionsApi.purchase({
                categoryId: selectedCategory!.id,
                planId: selectedPlan!.id,
                autoRenew: false,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["credits", "balance"] });
            router.push("/partner/subscriptions");
        },
    });

    const isLoading = pricingLoading || subscriptionLoading || planLoading;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    const prices = pricingData?.data?.items ?? [];
    const activeSubscriptions = (subscriptionData?.data?.items ?? []).filter(
        (s) => s.status === "active",
    );
    const activeCategoryIds = new Set(activeSubscriptions.map((s) => s.categoryId));
    const extendableCategoryIds = new Set(
        activeSubscriptions
            .filter((s) => {
                const remainingDays = getRemainingDays(s.expiresAt);
                return remainingDays > 0 && remainingDays <= 7;
            })
            .map((s) => s.categoryId),
    );
    const activeRemainingDaysByCategoryId = new Map(
        activeSubscriptions.map((s) => [s.categoryId, getRemainingDays(s.expiresAt)]),
    );

    // 업체 카테고리 중 신규 구매 가능 or 만료 7일 전 연장 가능 카테고리만 표시
    const availableCategories = prices
        .filter(
            (p) =>
                p.category &&
                (!activeCategoryIds.has(p.categoryId) || extendableCategoryIds.has(p.categoryId)),
        )
        .map((p) => p.category!)
        .filter((cat, idx, arr) => arr.findIndex((c) => c.id === cat.id) === idx);

    const plans = planData?.data?.items ?? [];
    const creditBalance = creditData?.data?.account?.balance ?? 0;
    const selectedCategoryRemainingDays = selectedCategory
        ? activeRemainingDaysByCategoryId.get(selectedCategory.id)
        : undefined;
    const isExtensionPurchase = selectedCategoryRemainingDays !== undefined;

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => {
                        if (step === "category") {
                            router.push("/partner/subscriptions");
                        } else if (step === "plan") {
                            setStep("category");
                            setSelectedPlan(null);
                        } else {
                            setStep("plan");
                        }
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[#0a3b41]">구독 구매</h1>
                    <p className="text-sm text-gray-500">
                        {step === "category" && "카테고리를 선택하세요"}
                        {step === "plan" && "플랜을 선택하세요"}
                        {step === "confirm" && "구매 내용을 확인하세요"}
                    </p>
                </div>
            </div>

            {/* 스텝 인디케이터 */}
            <div className="flex items-center gap-2">
                {(["category", "plan", "confirm"] as const).map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                        <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                step === s
                                    ? "bg-[#62e3d5]/20 text-[#0a3b41]"
                                    : "bg-gray-100 text-gray-400"
                            }`}
                        >
                            {i + 1}. {s === "category" ? "카테고리" : s === "plan" ? "플랜" : "확인"}
                        </div>
                    </div>
                ))}
            </div>

            {/* Step 1: 카테고리 선택 */}
            {step === "category" && (
                <div className="space-y-3">
                    {availableCategories.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                            {prices.length === 0
                                ? "먼저 서비스 단가를 설정해주세요."
                                : "신규 구매 가능 카테고리 또는 연장 가능(만료 7일 전) 카테고리가 없습니다."}
                        </div>
                    ) : (
                        availableCategories.map((cat) => {
                            const remainingDays = activeRemainingDaysByCategoryId.get(cat.id);
                            const isExtension = remainingDays !== undefined;

                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-[#62e3d5] hover:shadow-sm transition-all flex items-center justify-between"
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setStep("plan");
                                    }}
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className="font-medium text-[#0a3b41]">{cat.name}</span>
                                        {isExtension && (
                                            <span className="text-xs text-amber-600">
                                                연장 가능 (만료까지 D-{remainingDays})
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>
                            );
                        })
                    )}
                </div>
            )}

            {/* Step 2: 플랜 선택 */}
            {step === "plan" && (
                <div className="space-y-3">
                    {plans.map((plan) => (
                        <button
                            key={plan.id}
                            type="button"
                            className={`w-full bg-white rounded-xl border p-5 text-left transition-all ${
                                selectedPlan?.id === plan.id
                                    ? "border-[#62e3d5] shadow-sm ring-1 ring-[#62e3d5]"
                                    : "border-gray-200 hover:border-[#62e3d5] hover:shadow-sm"
                            }`}
                            onClick={() => {
                                setSelectedPlan(plan);
                                setStep("confirm");
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-[#0a3b41]">
                                            {plan.name}
                                        </span>
                                        {plan.discountRate > 0 && (
                                            <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs font-medium rounded-full">
                                                {formatDiscountRate(plan.discountRate)} 할인
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        일 {formatKRW(plan.dailyRate)} · {plan.durationDays}일
                                    </p>
                                </div>
                                <p className="text-xl font-bold text-[#0a3b41]">
                                    {formatKRW(plan.price)}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Step 3: 확인/결제 */}
            {step === "confirm" && selectedCategory && selectedPlan && (
                <div className="space-y-4">
                    {/* 구매 요약 */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                        <h3 className="font-semibold text-[#0a3b41]">구매 요약</h3>
                        <div className="space-y-3 text-sm">
                            {isExtensionPurchase && (
                                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                    기존 활성 구독을 연장 구매합니다. (만료까지 D-{selectedCategoryRemainingDays})
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500">카테고리</span>
                                <span className="font-medium text-[#0a3b41]">
                                    {selectedCategory.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">플랜</span>
                                <span className="font-medium text-[#0a3b41]">
                                    {selectedPlan.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">기간</span>
                                <span className="font-medium text-[#0a3b41]">
                                    {selectedPlan.durationDays}일
                                </span>
                            </div>
                            <div className="border-t border-gray-100 pt-3 flex justify-between">
                                <span className="text-gray-700 font-medium">결제 금액</span>
                                <span className="text-lg font-bold text-[#0a3b41]">
                                    {formatKRW(selectedPlan.price)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 크레딧 잔액 */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">보유 크레딧</span>
                            <span
                                className={`text-lg font-bold ${
                                    creditBalance >= selectedPlan.price
                                        ? "text-[#0a3b41]"
                                        : "text-red-500"
                                }`}
                            >
                                {formatKRW(creditBalance)}
                            </span>
                        </div>
                        {creditBalance < selectedPlan.price && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">
                                    크레딧이 {formatKRW(selectedPlan.price - creditBalance)} 부족합니다.
                                </p>
                                <button
                                    type="button"
                                    className="text-sm text-red-600 font-medium underline mt-1"
                                    onClick={() => router.push("/partner/credits")}
                                >
                                    크레딧 충전하기
                                </button>
                            </div>
                        )}
                        {creditBalance >= selectedPlan.price && (
                            <div className="mt-2 flex items-center gap-1 text-sm text-gray-400">
                                <CheckCircle2 className="w-4 h-4 text-[#62e3d5]" />
                                결제 후 잔액: {formatKRW(creditBalance - selectedPlan.price)}
                            </div>
                        )}
                    </div>

                    {/* 에러 메시지 */}
                    {purchaseMutation.isError && (
                        <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">
                            {(purchaseMutation.error as { message?: string })?.message ??
                                "구독 구매에 실패했습니다."}
                        </div>
                    )}

                    {/* 구매 버튼 */}
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={() => purchaseMutation.mutate()}
                        disabled={
                            creditBalance < selectedPlan.price || purchaseMutation.isPending
                        }
                    >
                        {purchaseMutation.isPending ? (
                            <Spinner size="sm" />
                        ) : (
                            `${formatKRW(selectedPlan.price)} ${isExtensionPurchase ? "구독 연장" : "구독 시작"}`
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
