"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/api-client/client";
import { vendorPricingApi } from "@/api-client/vendor-pricing";
import { Button } from "@/components/ui/Button/button";
import { InputNumber } from "@/components/ui/InputNumber";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import type { VendorDetail } from "@/lib/schema/vendor";
import type { VendorServicePrice } from "@/lib/schema/vendor-pricing";

function formatKRW(amount: number): string {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

export default function PartnerPricingPage() {
    const queryClient = useQueryClient();

    // 업체 정보 (카테고리 목록용)
    const { data: vendorData, isLoading: vendorLoading } = useQuery({
        queryKey: ["vendor", "me"],
        queryFn: async () => {
            const res = await api.get<{ data: { vendor: VendorDetail | null } }>("/api/vendors/me");
            return res.data.data.vendor;
        },
    });

    // 단가 목록
    const { data: priceData, isLoading: priceLoading } = useQuery({
        queryKey: ["vendor", "prices"],
        queryFn: () => vendorPricingApi.list(),
    });

    const prices = priceData?.data?.items ?? [];
    const vendorCategories = vendorData?.categories ?? [];

    // 아직 단가가 설정되지 않은 카테고리만 필터
    const activeCategoryIds = new Set(prices.map((p) => p.categoryId));
    const availableCategories = vendorCategories.filter((c) => !activeCategoryIds.has(c.id));

    // 추가 폼 상태
    const [newCategoryId, setNewCategoryId] = useState("");
    const [newPrice, setNewPrice] = useState<number | undefined>(undefined);
    const [newDailyLimit, setNewDailyLimit] = useState<number | undefined>(undefined);

    // 수정 상태
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState<number | undefined>(undefined);
    const [editDailyLimit, setEditDailyLimit] = useState<number | undefined>(undefined);

    const createMutation = useMutation({
        mutationFn: vendorPricingApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor", "prices"] });
            setNewCategoryId("");
            setNewPrice(undefined);
            setNewDailyLimit(undefined);
            toast.success("단가가 추가되었습니다.");
        },
        onError: () => {
            toast.error("단가 추가에 실패했습니다.");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: { price?: number; dailyBudgetLimit?: number | null } }) =>
            vendorPricingApi.update(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor", "prices"] });
            setEditingId(null);
            toast.success("단가가 수정되었습니다.");
        },
        onError: () => {
            toast.error("단가 수정에 실패했습니다.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: vendorPricingApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor", "prices"] });
            toast.success("단가가 삭제되었습니다.");
        },
        onError: () => {
            toast.error("단가 삭제에 실패했습니다.");
        },
    });

    const handleCreate = () => {
        if (!newCategoryId || newPrice === undefined) return;
        createMutation.mutate({
            categoryId: newCategoryId,
            price: newPrice,
            ...(newDailyLimit !== undefined ? { dailyBudgetLimit: newDailyLimit } : {}),
        });
    };

    const startEdit = (item: VendorServicePrice) => {
        setEditingId(item.id);
        setEditPrice(item.price);
        setEditDailyLimit(item.dailyBudgetLimit ?? undefined);
    };

    const handleUpdate = () => {
        if (!editingId || editPrice === undefined) return;
        updateMutation.mutate({
            id: editingId,
            body: {
                price: editPrice,
                dailyBudgetLimit: editDailyLimit ?? null,
            },
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        deleteMutation.mutate(id);
    };

    if (vendorLoading || priceLoading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-content-primary">서비스 단가 설정</h2>
                <p className="text-sm text-gray-500 mt-1">
                    카테고리별 서비스 단가를 설정하세요. 리드 발생 시 설정된 단가 기준으로 크레딧이 차감됩니다.
                </p>
            </div>

            {/* 단가 목록 */}
            <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-content-primary">설정된 단가</h3>
                </div>

                {prices.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-gray-400">
                        아직 설정된 단가가 없습니다.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {prices.map((item) => (
                            <div key={item.id} className="px-5 py-4">
                                {editingId === item.id ? (
                                    /* 수정 모드 */
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-content-primary">
                                            {item.category?.name ?? "카테고리"}
                                        </p>
                                        <div className="flex items-end gap-3 flex-wrap">
                                            <InputNumber
                                                label="단가 (원)"
                                                value={editPrice}
                                                onValueChange={setEditPrice}
                                                min={10000}
                                                max={200000}
                                                mode="integer"
                                                size="sm"
                                                placeholder="10,000 ~ 200,000"
                                            />
                                            <InputNumber
                                                label="일일 한도 (원)"
                                                value={editDailyLimit}
                                                onValueChange={setEditDailyLimit}
                                                min={0}
                                                mode="integer"
                                                size="sm"
                                                placeholder="선택사항"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleUpdate}
                                                    disabled={updateMutation.isPending || editPrice === undefined}
                                                >
                                                    {updateMutation.isPending ? "저장 중..." : "저장"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    취소
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* 보기 모드 */
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <span className="text-sm font-medium text-content-primary min-w-[100px]">
                                                {item.category?.name ?? "카테고리"}
                                            </span>
                                            <span className="text-sm text-gray-700">
                                                {formatKRW(item.price)}
                                            </span>
                                            {item.dailyBudgetLimit != null && (
                                                <span className="text-xs text-gray-400">
                                                    일일 한도: {formatKRW(item.dailyBudgetLimit)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                className="p-2 text-gray-400 hover:text-content-primary transition-colors"
                                                onClick={() => startEdit(item)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                onClick={() => handleDelete(item.id)}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 단가 추가 */}
            {availableCategories.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-content-primary">단가 추가</h3>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                        <div className="flex items-end gap-3 flex-wrap">
                            <div>
                                <label className="block text-sm font-medium text-content-primary mb-1.5">
                                    카테고리
                                </label>
                                <select
                                    value={newCategoryId}
                                    onChange={(e) => setNewCategoryId(e.target.value)}
                                    className="h-[38px] px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">카테고리 선택</option>
                                    {availableCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <InputNumber
                                label="단가 (원)"
                                value={newPrice}
                                onValueChange={setNewPrice}
                                min={10000}
                                max={200000}
                                mode="integer"
                                size="sm"
                                placeholder="10,000 ~ 200,000"
                            />
                            <InputNumber
                                label="일일 한도 (원)"
                                value={newDailyLimit}
                                onValueChange={setNewDailyLimit}
                                min={0}
                                mode="integer"
                                size="sm"
                                placeholder="선택사항"
                            />
                            <Button
                                size="sm"
                                onClick={handleCreate}
                                disabled={createMutation.isPending || !newCategoryId || newPrice === undefined}
                            >
                                {createMutation.isPending ? "추가 중..." : "추가"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* 모든 카테고리에 단가가 설정된 경우 */}
            {availableCategories.length === 0 && vendorCategories.length > 0 && prices.length > 0 && (
                <p className="text-sm text-gray-400 text-center">
                    모든 카테고리에 단가가 설정되었습니다.
                </p>
            )}
        </div>
    );
}
