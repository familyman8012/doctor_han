"use client";

import { useQuery } from "@tanstack/react-query";
import { Star, User, Flag, ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { SimplePagination } from "../../../categories/[slug]/components/SimplePagination";
import type { ReviewView, ReviewSort } from "@/lib/schema/review";
import { ReviewReportModal } from "./modal/ReviewReportModal";

interface ReviewSectionProps {
    vendorId: string;
    ratingAvg: number | null;
    reviewCount: number;
    currentUserId?: string;
}

const PAGE_SIZE = 5;

const SORT_OPTIONS: { value: ReviewSort; label: string }[] = [
    { value: "recent", label: "최신순" },
    { value: "rating_high", label: "별점 높은순" },
    { value: "rating_low", label: "별점 낮은순" },
];

export function ReviewSection({ vendorId, ratingAvg, reviewCount, currentUserId }: ReviewSectionProps) {
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<ReviewSort>("recent");
    const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
    const [isSortOpen, setIsSortOpen] = useState(false);

    /* eslint-disable-next-line react-compiler/react-compiler -- vendorId나 sort 변경 시 페이지 초기화 필요 */
    useEffect(() => {
        setPage(1);
    }, [vendorId, sort]);

    const { data: reviewData, isLoading, isError } = useQuery({
        queryKey: ["reviews", vendorId, page, sort],
        queryFn: async () => {
            const response = await api.get<{
                data: { items: ReviewView[]; page: number; pageSize: number; total: number };
            }>(`/api/vendors/${vendorId}/reviews?page=${page}&pageSize=${PAGE_SIZE}&sort=${sort}`);
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
                <div className="flex items-center gap-4">
                    {/* 정렬 드롭다운 */}
                    {reviewCount > 0 && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            {isSortOpen && (
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    {SORT_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                setSort(option.value);
                                                setIsSortOpen(false);
                                            }}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                                sort === option.value ? "text-primary font-medium" : "text-gray-700"
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {/* 평점 표시 */}
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
                        const amount = review.amount;
                        const hasAmount = amount !== null;
                        const hasWorkedAt = Boolean(review.workedAt);
                        const isOwnReview = currentUserId === review.doctorUserId;

                        return (
                            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                {renderStars(review.rating)}
                                                <span className="text-sm text-gray-500">
                                                    {dayjs(review.createdAt).format("YYYY.MM.DD")}
                                                </span>
                                            </div>
                                            {/* 신고 버튼 (본인 리뷰 제외, 로그인 사용자만) */}
                                            {currentUserId && !isOwnReview && (
                                                <button
                                                    type="button"
                                                    onClick={() => setReportingReviewId(review.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="리뷰 신고"
                                                >
                                                    <Flag className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[#0a3b41] whitespace-pre-wrap">
                                            {review.content}
                                        </p>
                                        {(hasAmount || hasWorkedAt) && (
                                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                                                {hasAmount && (
                                                    <span>결제 금액: {amount.toLocaleString()}원</span>
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

            {/* 리뷰 정책 안내 */}
            <p className="text-sm text-gray-500 mt-4">
                리뷰 작성 및 노출 정책은{" "}
                <Link href="/legal/review-policy" className="text-primary underline">
                    리뷰 정책
                </Link>
                을 확인해 주세요.
            </p>

            {/* 신고 모달 */}
            {reportingReviewId && (
                <ReviewReportModal
                    reviewId={reportingReviewId}
                    onClose={() => setReportingReviewId(null)}
                />
            )}
        </div>
    );
}
