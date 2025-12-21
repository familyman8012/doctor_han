"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Filter } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Button } from "@/components/ui/Button/button";
import { ReviewCard } from "./components/ReviewCard";
import { ReviewEditModal } from "./components/ReviewEditModal";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import type { MyReviewListItem, ReviewStatus } from "@/lib/schema/review";

type StatusFilter = "all" | "published" | "hidden";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "published", label: "공개" },
    { value: "hidden", label: "비공개" },
];

export default function MyReviewsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useQueryState("status", { defaultValue: "all" });
    const [editingReview, setEditingReview] = useState<MyReviewListItem | null>(null);

    // 내 리뷰 목록 조회
    const { data, isLoading } = useQuery({
        queryKey: ["reviews", "my", statusFilter],
        queryFn: async () => {
            const res = await api.get<{
                data: { items: MyReviewListItem[]; total: number };
            }>("/api/reviews", {
                params: { status: statusFilter },
            });
            return res.data.data;
        },
    });

    // 리뷰 삭제
    const deleteMutation = useMutation({
        mutationFn: async (reviewId: string) => {
            await api.delete(`/api/reviews/${reviewId}`);
        },
        onSuccess: () => {
            toast.success("리뷰가 삭제되었습니다");
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
        },
    });

    // 리뷰 공개/비공개 전환
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ reviewId, status }: { reviewId: string; status: ReviewStatus }) => {
            await api.patch(`/api/reviews/${reviewId}`, { status });
        },
        onSuccess: (_, variables) => {
            toast.success(variables.status === "published" ? "리뷰가 공개되었습니다" : "리뷰가 비공개로 전환되었습니다");
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
        },
    });

    const handleDelete = (reviewId: string) => {
        if (confirm("리뷰를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            deleteMutation.mutate(reviewId);
        }
    };

    const handleToggleStatus = (review: MyReviewListItem) => {
        const newStatus: ReviewStatus = review.status === "published" ? "hidden" : "published";
        toggleStatusMutation.mutate({ reviewId: review.id, status: newStatus });
    };

    const reviews = data?.items ?? [];
    const total = data?.total ?? 0;

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0a3b41] flex items-center gap-2">
                        <Star className="w-6 h-6 text-[#62e3d5]" />
                        내 리뷰
                    </h1>
                    <p className="text-gray-500 mt-1">총 {total}개의 리뷰</p>
                </div>
            </div>

            {/* 필터 */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="flex gap-2">
                    {STATUS_OPTIONS.map((option) => (
                        <Button
                            key={option.value}
                            variant={statusFilter === option.value ? "listActive" : "list"}
                            size="xs"
                            onClick={() => setStatusFilter(option.value)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* 리뷰 목록 */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spinner size="lg" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-16">
                    <Empty
                        Icon={<Star className="w-8 h-8" />}
                        title="작성한 리뷰가 없습니다"
                        description={statusFilter !== "all" ? "해당 상태의 리뷰가 없습니다" : "업체 이용 후 리뷰를 작성해 보세요"}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            onEdit={() => setEditingReview(review)}
                            onDelete={() => handleDelete(review.id)}
                            onToggleStatus={() => handleToggleStatus(review)}
                            isDeleting={deleteMutation.isPending}
                            isTogglingStatus={toggleStatusMutation.isPending}
                        />
                    ))}
                </div>
            )}

            {/* 수정 모달 */}
            {editingReview && (
                <ReviewEditModal
                    review={editingReview}
                    onClose={() => setEditingReview(null)}
                    onSuccess={() => {
                        setEditingReview(null);
                        queryClient.invalidateQueries({ queryKey: ["reviews"] });
                    }}
                />
            )}
        </div>
    );
}
