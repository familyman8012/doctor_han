"use client";

import { useQuery } from "@tanstack/react-query";
import { Star, User } from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { SimplePagination } from "../../../categories/[slug]/components/SimplePagination";
import type { ReviewView } from "@/lib/schema/review";

interface ReviewSectionProps {
    vendorId: string;
    ratingAvg: number | null;
    reviewCount: number;
}

const PAGE_SIZE = 5;

export function ReviewSection({ vendorId, ratingAvg, reviewCount }: ReviewSectionProps) {
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [vendorId]);

    const { data: reviewData, isLoading, isError } = useQuery({
        queryKey: ["reviews", vendorId, page],
        queryFn: async () => {
            const response = await api.get<{
                data: { items: ReviewView[]; page: number; pageSize: number; total: number };
            }>(`/api/vendors/${vendorId}/reviews?page=${page}&pageSize=${PAGE_SIZE}`);
            return response.data.data;
        },
    });

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${
                            star <= rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"
                        }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#0a3b41]">리뷰</h2>
                <div className="flex items-center gap-2">
                    {ratingAvg !== null && ratingAvg > 0 ? (
                        <>
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span className="text-lg font-bold text-[#0a3b41]">
                                {ratingAvg.toFixed(1)}
                            </span>
                            <span className="text-gray-500">({reviewCount}개)</span>
                        </>
                    ) : (
                        <span className="text-gray-400">리뷰 없음</span>
                    )}
                </div>
            </div>

            {/* 평점 분포 (후순위) */}
            {ratingAvg !== null && ratingAvg > 0 && (
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <p className="text-4xl font-bold text-[#0a3b41]">
                            {ratingAvg.toFixed(1)}
                        </p>
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                            {renderStars(Math.round(ratingAvg))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{reviewCount}개의 리뷰</p>
                    </div>
                </div>
            )}

            {/* 리뷰 목록 */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spinner size="md" />
                </div>
            ) : isError ? (
                <Empty title="리뷰를 불러올 수 없습니다" />
            ) : reviewData?.items.length === 0 ? (
                <Empty
                    title="아직 리뷰가 없습니다"
                    description="첫 번째 리뷰를 작성해 보세요"
                />
            ) : (
                <div className="space-y-6">
                    {reviewData?.items.map((review) => {
                        const hasAmount = review.amount !== null;
                        const hasWorkedAt = Boolean(review.workedAt);

                        return (
                            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {renderStars(review.rating)}
                                            <span className="text-sm text-gray-500">
                                                {dayjs(review.createdAt).format("YYYY.MM.DD")}
                                            </span>
                                        </div>
                                        <p className="text-[#0a3b41] whitespace-pre-wrap">
                                            {review.content}
                                        </p>
                                        {(hasAmount || hasWorkedAt) && (
                                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                                                {hasAmount && (
                                                    <span>결제 금액: {review.amount.toLocaleString()}원</span>
                                                )}
                                                {hasWorkedAt && (
                                                    <span>작업일: {review.workedAt}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {reviewData && reviewData.total > PAGE_SIZE && (
                        <div className="flex justify-center pt-2">
                            <SimplePagination
                                currentPage={page}
                                totalPages={Math.ceil(reviewData.total / PAGE_SIZE)}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
