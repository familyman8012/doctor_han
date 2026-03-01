"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Wallet } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import api from "@/api-client/client";
import { adsApi } from "@/api-client/ads";
import { creditsApi } from "@/api-client/credits";
import type { CategoryView } from "@/lib/schema/category";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { cn } from "@/components/utils";

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
    const router = useRouter();
    const queryClient = useQueryClient();
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

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

    const { data: creditData } = useQuery({
        queryKey: ["credits", "balance"],
        queryFn: () => creditsApi.getBalance(),
        staleTime: 30_000,
    });
    const creditBalance = creditData?.data?.account?.balance ?? 0;

    const selectedSlot = slots.find((s) => s.slot.id === selectedSlotId);

    const purchaseMutation = useMutation({
        mutationFn: () => adsApi.purchasePrioritySlot({ prioritySlotId: selectedSlotId! }),
        onSuccess: () => {
            toast.success("광고 구매가 완료되었습니다!");
            queryClient.invalidateQueries({ queryKey: ["credits"] });
            queryClient.invalidateQueries({ queryKey: ["vendor", "ads"] });
            router.push("/partner/ads");
        },
        onError: () => {
            toast.error("광고 구매에 실패했습니다. 크레딧 잔액을 확인해주세요.");
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/partner/ads" className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-[#0a3b41]">우선순위 광고 구매</h1>
            </div>

            {/* Credit balance */}
            <div className="bg-[#0a3b41] rounded-xl p-4 text-white flex items-center gap-3">
                <Wallet className="w-5 h-5 text-[#62e3d5]" />
                <span className="text-sm">보유 크레딧</span>
                <span className="font-bold text-[#62e3d5]">{creditBalance.toLocaleString()}C</span>
            </div>

            {/* Step 1: Category selection */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#0a3b41]">1. 카테고리 선택</h2>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => { setSelectedCategoryId(cat.id); setSelectedSlotId(null); }}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                                selectedCategoryId === cat.id
                                    ? "bg-[#0a3b41] text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-[#62e3d5]/20",
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
                    <h2 className="text-lg font-semibold text-[#0a3b41]">2. 등급 선택</h2>
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
                                            isSelected && "ring-2 ring-[#62e3d5]",
                                            isFull && "opacity-50 cursor-not-allowed",
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-3 right-3">
                                                <Check className="w-5 h-5 text-[#62e3d5]" />
                                            </div>
                                        )}
                                        <span className={cn("inline-block px-2 py-0.5 text-xs font-bold rounded-full mb-2", info.badgeColor)}>
                                            {info.label}
                                        </span>
                                        <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                                        <p className="text-xl font-bold text-[#0a3b41]">
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
                    <h2 className="text-lg font-semibold text-[#0a3b41]">3. 구매 확인</h2>
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
                        <hr className="my-2" />
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">차감 후 잔액</span>
                            <span className={cn("font-medium", creditBalance < selectedSlot.slot.priceWeekly && "text-red-500")}>
                                {(creditBalance - selectedSlot.slot.priceWeekly).toLocaleString()}C
                            </span>
                        </div>
                    </div>

                    {creditBalance < selectedSlot.slot.priceWeekly ? (
                        <div className="text-sm text-red-500">
                            크레딧이 부족합니다. <Link href="/partner/credits" className="underline">충전하기</Link>
                        </div>
                    ) : showConfirm ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => purchaseMutation.mutate()}
                                disabled={purchaseMutation.isPending}
                                className="flex-1 py-3 text-sm font-medium text-white bg-[#0a3b41] hover:bg-[#0a3b41]/90 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {purchaseMutation.isPending ? "처리 중..." : "결제 확인"}
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="w-full py-3 text-sm font-medium text-white bg-[#0a3b41] hover:bg-[#0a3b41]/90 rounded-lg transition-colors"
                        >
                            구매하기
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
