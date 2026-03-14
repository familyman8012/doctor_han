"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Zap, Plus } from "lucide-react";
import { toast } from "sonner";
import { adsApi } from "@/api-client/ads";
import type { AdPriorityPurchase } from "@/lib/schema/ad";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { cn } from "@/components/utils";

const TIER_LABELS: Record<string, string> = {
    premium: "프리미엄",
    plus_up: "플러스업",
    plus: "플러스",
    rookie: "루키",
};

const TIER_COLORS: Record<string, string> = {
    premium: "bg-amber-100 text-amber-800",
    plus_up: "bg-gray-100 text-gray-800",
    plus: "bg-blue-100 text-blue-800",
    rookie: "bg-gray-50 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
    active: "활성",
    expired: "만료",
    canceled: "취소",
    refunded: "환불",
};

const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    expired: "bg-gray-100 text-gray-600",
    canceled: "bg-red-100 text-red-800",
    refunded: "bg-yellow-100 text-yellow-800",
};

function PurchaseCard({ purchase }: { purchase: AdPriorityPurchase }) {
    const queryClient = useQueryClient();
    const endsAt = new Date(purchase.endsAt);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const canJumpup =
        purchase.tier === "rookie" &&
        purchase.status === "active" &&
        purchase.jumpupRemaining > 0 &&
        (!purchase.jumpupLastUsedAt ||
            now.getTime() - new Date(purchase.jumpupLastUsedAt).getTime() >= 24 * 60 * 60 * 1000);

    const jumpupMutation = useMutation({
        mutationFn: () => adsApi.activateJumpup(purchase.id),
        onSuccess: () => {
            toast.success("점프업이 활성화되었습니다! 30분간 최상위 노출됩니다.");
            queryClient.invalidateQueries({ queryKey: ["vendor", "ads"] });
        },
        onError: () => {
            toast.error("점프업 활성화에 실패했습니다.");
        },
    });

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", TIER_COLORS[purchase.tier])}>
                            {TIER_LABELS[purchase.tier]}
                        </span>
                        <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", STATUS_COLORS[purchase.status])}>
                            {STATUS_LABELS[purchase.status]}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        {new Date(purchase.startsAt).toLocaleDateString("ko-KR")} ~ {endsAt.toLocaleDateString("ko-KR")}
                    </p>
                    {purchase.status === "active" && (
                        <p className="text-sm text-primary font-medium mt-1">
                            남은 기간: {daysRemaining}일
                        </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                        결제 금액: {purchase.pricePaid.toLocaleString()}원
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {purchase.tier === "rookie" && purchase.status === "active" && (
                        <p className="text-xs text-gray-500">
                            점프업 {purchase.jumpupRemaining}/3
                        </p>
                    )}
                    {canJumpup && (
                        <button
                            onClick={() => jumpupMutation.mutate()}
                            disabled={jumpupMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Zap className="w-3 h-3" />
                            점프업
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PartnerAdsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["vendor", "ads"],
        queryFn: () => adsApi.getVendorAds(),
    });

    const purchases = data?.data?.items ?? [];
    const activePurchases = purchases.filter((p) => p.status === "active");
    const pastPurchases = purchases.filter((p) => p.status !== "active");

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Megaphone className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-bold text-content-primary">광고 관리</h1>
                </div>
                <Link
                    href="/partner/ads/purchase"
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-primary-900 hover:bg-primary-900/90 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    광고 구매하기
                </Link>
            </div>

            {purchases.length === 0 ? (
                <Empty
                    title="등록된 광고가 없습니다"
                    description="우선순위 광고를 구매하여 더 많은 고객에게 노출되세요."
                />
            ) : (
                <>
                    {activePurchases.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-content-primary">활성 광고</h2>
                            <div className="space-y-3">
                                {activePurchases.map((p) => (
                                    <PurchaseCard key={p.id} purchase={p} />
                                ))}
                            </div>
                        </div>
                    )}

                    {pastPurchases.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-500">지난 광고</h2>
                            <div className="space-y-3">
                                {pastPurchases.map((p) => (
                                    <PurchaseCard key={p.id} purchase={p} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
