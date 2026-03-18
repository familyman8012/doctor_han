"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import Link from "next/link";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { EMPTY_ILLUSTRATIONS } from "@/lib/constants/assets";
import { SimplePagination } from "../../../../categories/[slug]/components/SimplePagination";
import type { VendorReviewListItem, ReviewSort, RatingDistributionItem, SubRatingSummary } from "@/lib/schema/review";
import { ReviewReportModal } from "../modal/ReviewReportModal";
import { RatingDistribution } from "../review/RatingDistribution";
import { SubRatingSummary as SubRatingSummaryDisplay } from "../review/SubRatingSummary";
import { ReviewCard } from "../review/ReviewCard";
import { ReviewFilters } from "../review/ReviewFilters";

interface ReviewTabProps {
    vendorId: string;
    ratingAvg: number | null;
    reviewCount: number;
    currentUserId?: string;
}

const PAGE_SIZE = 5;

export function ReviewTab({ vendorId, ratingAvg, reviewCount, currentUserId }: ReviewTabProps) {
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<ReviewSort>("recent");
    const [photoOnly, setPhotoOnly] = useState(false);
    const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- vendorId 변경 시 페이지 초기화
        setPage(1);
    }, [vendorId]);

    const { data: reviewData, isLoading, isError } = useQuery({
        queryKey: ["reviews", vendorId, page, sort],
        queryFn: async () => {
            const response = await api.get<{
                data: {
                    items: VendorReviewListItem[];
                    page: number;
                    pageSize: number;
                    total: number;
                    subRatingSummary: SubRatingSummary;
                    ratingDistribution: RatingDistributionItem[];
                };
            }>(`/api/vendors/${vendorId}/reviews?page=${page}&pageSize=${PAGE_SIZE}&sort=${sort}`);
            return response.data.data;
        },
    });

    const handleSortChange = (newSort: ReviewSort) => {
        setSort(newSort);
        setPage(1);
    };

    // Client-side photo filter
    const items = reviewData?.items ?? [];
    const filteredItems = photoOnly
        ? items.filter((r) => r.photoFileIds.length > 0)
        : items;
    const hasPhotoReviews = items.some((r) => r.photoFileIds.length > 0);

    return (
        <div>
            <h2 className="text-xl font-bold text-content-primary mb-6">리뷰</h2>

            {/* Rating Summary */}
            {ratingAvg !== null && ratingAvg > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-5 bg-gray-50 rounded-xl">
                    {/* Left: overall + distribution */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <p className="text-4xl font-bold text-content-primary tabular-nums">
                                {ratingAvg.toFixed(1)}
                            </p>
                            <div>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-5 h-5 ${
                                                star <= Math.round(ratingAvg)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "fill-gray-200 text-gray-200"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">{reviewCount}개의 리뷰</p>
                            </div>
                        </div>
                        {reviewData?.ratingDistribution && (
                            <RatingDistribution
                                distribution={reviewData.ratingDistribution}
                                totalCount={reviewCount}
                            />
                        )}
                    </div>

                    {/* Right: sub-rating summary */}
                    {reviewData?.subRatingSummary && (
                        <div className="flex flex-col justify-center">
                            <p className="text-sm font-medium text-gray-500 mb-3">항목별 평점</p>
                            <SubRatingSummaryDisplay summary={reviewData.subRatingSummary} />
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            {reviewCount > 0 && (
                <div className="mb-4">
                    <ReviewFilters
                        sort={sort}
                        onSortChange={handleSortChange}
                        photoOnly={photoOnly}
                        onPhotoOnlyChange={setPhotoOnly}
                        hasPhotoReviews={hasPhotoReviews}
                    />
                </div>
            )}

            {/* Review List */}
            {isLoading ? (
                <div className="flex justify-center py-10">
                    <Spinner size="md" />
                </div>
            ) : isError ? (
                <Empty title="리뷰를 불러올 수 없습니다" />
            ) : filteredItems.length === 0 ? (
                <Empty
                    illustration={EMPTY_ILLUSTRATIONS.review}
                    title={photoOnly ? "사진 리뷰가 없습니다" : "아직 리뷰가 없습니다"}
                    description={photoOnly ? "필터를 해제해 보세요" : "첫 번째 리뷰를 작성해 보세요"}
                />
            ) : (
                <div className="space-y-6">
                    {filteredItems.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            currentUserId={currentUserId}
                            onReport={setReportingReviewId}
                        />
                    ))}

                    {reviewData && reviewData.total > PAGE_SIZE && !photoOnly && (
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

            {/* Review policy */}
            <p className="text-sm text-gray-500 mt-4">
                리뷰 작성 및 노출 정책은{" "}
                <Link href="/legal/review-policy" className="text-primary underline">
                    리뷰 정책
                </Link>
                을 확인해 주세요.
            </p>

            {/* Report modal */}
            {reportingReviewId && (
                <ReviewReportModal
                    reviewId={reportingReviewId}
                    onClose={() => setReportingReviewId(null)}
                />
            )}
        </div>
    );
}
