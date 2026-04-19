"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import api from "@/api-client/client";
import { adsApi } from "@/api-client/ads";
import type { CategoryView } from "@/lib/schema/category";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { cn } from "@/components/utils";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

const TIER_INFO: Record<string, { label: string; description: string; color: string; badgeColor: string }> = {
    premium: {
        label: "프리미엄",
        description: "최상위 노출, 금색 테두리",
        color: "border-amber-400 bg-amber-50 hover:border-amber-500",
        badgeColor: "bg-amber-400 text-white",
    },
    plus_up: {
        label: "플러스업",
        description: "상위 노출, 은색 테두리",
        color: "border-gray-400 bg-gray-50 hover:border-gray-500",
        badgeColor: "bg-gray-400 text-white",
    },
    plus: {
        label: "플러스",
        description: "중위 노출, 청색 테두리",
        color: "border-blue-400 bg-blue-50 hover:border-blue-500",
        badgeColor: "bg-blue-400 text-white",
    },
    rookie: {
        label: "루키",
        description: "기본 노출 + 점프업 3회 (30분간 최상위)",
        color: "border-gray-300 bg-white hover:border-gray-400",
        badgeColor: "bg-gray-300 text-gray-700",
    },
};

export default function PurchaseAdPage() {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const widgetsRef = useRef<Awaited<
        ReturnType<Awaited<ReturnType<typeof loadTossPayments>>["widgets"]>
    > | null>(null);

    const { data: categoriesData } = useQuery({
        queryKey: ["categories"],
        queryFn: async (): Promise<CategoryView[]> => {
            const response = await api.get<{ data: { items: CategoryView[] } }>("/api/categories");
            return response.data.data.items;
        },
        staleTime: 5 * 60 * 1000,
    });

    const categories = (categoriesData ?? []).filter((c) => c.depth === 1 && c.isActive);

    const { data: slotsData, isLoading: isLoadingSlots } = useQuery({
        queryKey: ["ads", "priority", "slots", selectedCategoryId],
        queryFn: () => adsApi.getPrioritySlots({ categoryId: selectedCategoryId! }),
        enabled: !!selectedCategoryId,
    });

    const slots = slotsData?.data?.slots ?? [];

    const selectedSlot = slots.find((s) => s.slot.id === selectedSlotId);

    const prepareMutation = useMutation({
        mutationFn: () => adsApi.preparePrioritySlot({ prioritySlotId: selectedSlotId! }),
    });

    useEffect(() => {
        if (!showConfirm || !selectedSlotId) return;
        setPaymentError(null);
        widgetsRef.current = null;

        prepareMutation.mutate(undefined, {
            onSuccess: async (res) => {
                try {
                    const { clientKey, orderId, amount } = res.data;
                    const tossPayments = await loadTossPayments(clientKey);
                    const widgets = tossPayments.widgets({ customerKey: orderId });
                    await widgets.setAmount({ currency: "KRW", value: amount });
                    await widgets.renderPaymentMethods({
                        selector: "#ad-payment-widget",
                        variantKey: "DEFAULT",
                    });
                    widgetsRef.current = widgets;
                } catch (err) {
                    setPaymentError(err instanceof Error ? err.message : "결제 위젯 초기화 실패");
                }
            },
            onError: (err) => {
                const msg =
                    (err as { response?: { data?: { message?: string } }; message?: string })
                        .response?.data?.message ?? (err as Error).message ?? "결제 준비 실패";
                setPaymentError(msg);
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showConfirm, selectedSlotId]);

    const handlePay = async () => {
        if (!widgetsRef.current || !prepareMutation.data) return;
        const { orderId, orderName, customerName } = prepareMutation.data.data;
        try {
            await widgetsRef.current.requestPayment({
                orderId,
                orderName,
                customerName,
                successUrl: `${window.location.origin}/partner/payments/success`,
                failUrl: `${window.location.origin}/partner/payments/fail`,
            });
        } catch (err) {
            if ((err as { code?: string }).code === "USER_CANCEL") return;
            setPaymentError(err instanceof Error ? err.message : "결제 요청 실패");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/partner/ads" className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-content-primary">우선순위 광고 구매</h1>
            </div>

            {/* Step 1: Category selection */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-content-primary">1. 카테고리 선택</h2>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => { setSelectedCategoryId(cat.id); setSelectedSlotId(null); }}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                                selectedCategoryId === cat.id
                                    ? "bg-primary-900 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-primary-100",
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Tier selection */}
            {selectedCategoryId && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-content-primary">2. 등급 선택</h2>
                    {isLoadingSlots ? (
                        <div className="flex justify-center py-10">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {slots.map(({ slot, activePurchases }) => {
                                const info = TIER_INFO[slot.tier];
                                const available = slot.maxSlots - activePurchases;
                                const isFull = available <= 0;
                                const isSelected = selectedSlotId === slot.id;

                                return (
                                    <button
                                        key={slot.id}
                                        onClick={() => !isFull && setSelectedSlotId(slot.id)}
                                        disabled={isFull}
                                        className={cn(
                                            "relative text-left rounded-xl border-2 p-5 transition-all",
                                            info.color,
                                            isSelected && "ring-2 ring-primary",
                                            isFull && "opacity-50 cursor-not-allowed",
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-3 right-3">
                                                <Check className="w-5 h-5 text-primary" />
                                            </div>
                                        )}
                                        <span className={cn("inline-block px-2 py-0.5 text-xs font-bold rounded-full mb-2", info.badgeColor)}>
                                            {info.label}
                                        </span>
                                        <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                                        <p className="text-xl font-bold text-content-primary">
                                            {slot.priceWeekly.toLocaleString()}원<span className="text-sm font-normal text-gray-500">/주</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            잔여 슬롯: {available}/{slot.maxSlots}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Purchase confirmation */}
            {selectedSlot && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-content-primary">3. 구매 확인</h2>
                    <div className="bg-gray-50 rounded-xl p-5 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">등급</span>
                            <span className="font-medium">{TIER_INFO[selectedSlot.slot.tier].label}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">기간</span>
                            <span className="font-medium">7일</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">금액</span>
                            <span className="font-medium">{selectedSlot.slot.priceWeekly.toLocaleString()}원</span>
                        </div>
                    </div>

                    {!showConfirm ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="w-full py-3 text-sm font-medium text-white bg-primary-900 hover:bg-primary-900/90 rounded-lg transition-colors"
                        >
                            결제 진행
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-white border border-gray-200 rounded-xl p-5">
                                <p className="text-sm font-medium mb-3">결제 수단 선택</p>
                                {prepareMutation.isPending && (
                                    <div className="flex justify-center py-6">
                                        <Spinner />
                                    </div>
                                )}
                                <div id="ad-payment-widget" />
                            </div>
                            {paymentError && (
                                <p className="text-sm text-red-500">{paymentError}</p>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={handlePay}
                                    disabled={prepareMutation.isPending || !prepareMutation.data}
                                    className={cn(
                                        "flex-1 py-3 text-sm font-medium text-white bg-primary-900 hover:bg-primary-900/90 rounded-lg transition-colors",
                                        (prepareMutation.isPending || !prepareMutation.data) && "opacity-50",
                                    )}
                                >
                                    {selectedSlot.slot.priceWeekly.toLocaleString()}원 결제하기
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
