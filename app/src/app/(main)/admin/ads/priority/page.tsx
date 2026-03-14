"use client";

import { useQuery } from "@tanstack/react-query";
import { adsApi } from "@/api-client/ads";
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

export default function AdminPriorityPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["admin", "ads", "priority"],
        queryFn: () => adsApi.getAdminPriority(),
    });

    const slots = data?.data?.slots ?? [];

    // Group by category
    const grouped = slots.reduce<Record<string, typeof slots>>((acc, item) => {
        const key = item.categoryName;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (slots.length === 0) {
        return <Empty title="우선순위 슬롯이 없습니다" description="카테고리에 슬롯이 설정되지 않았습니다." />;
    }

    const totalRevenue = slots.reduce((sum, s) => sum + s.activePurchases * s.slot.priceWeekly, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-content-primary">우선순위 슬롯 현황</h1>
                <div className="text-sm text-gray-500">
                    예상 주간 매출: <span className="font-semibold text-content-primary">{totalRevenue.toLocaleString()}원</span>
                </div>
            </div>

            <div className="space-y-6">
                {Object.entries(grouped).map(([categoryName, categorySlots]) => (
                    <div key={categoryName} className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-lg font-semibold text-content-primary mb-4">{categoryName}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {categorySlots.map(({ slot, activePurchases }) => (
                                <div key={slot.id} className="text-center p-3 rounded-lg bg-gray-50">
                                    <span className={cn("inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-2", TIER_COLORS[slot.tier])}>
                                        {TIER_LABELS[slot.tier]}
                                    </span>
                                    <p className="text-2xl font-bold text-content-primary">
                                        {activePurchases}<span className="text-sm text-gray-400">/{slot.maxSlots}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {slot.priceWeekly.toLocaleString()}원/주
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
