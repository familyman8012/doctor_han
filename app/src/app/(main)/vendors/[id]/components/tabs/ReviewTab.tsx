"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Star } from "lucide-react";
import Link from "next/link";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { EMPTY_ILLUSTRATIONS } from "@/lib/constants/assets";
import { SimplePagination } from "../../../../categories/[slug]/components/SimplePagination";
import type { VendorReviewListItem, ReviewSort, RatingDistributionItem, SubRatingSummary } from "@/lib/schema/review";
import { ImageLightbox } from "../gallery/ImageLightbox";
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
        queryKey: ["reviews", vendorId, page, sort, photoOnly],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(PAGE_SIZE),
                sort,
                photoOnly: String(photoOnly),
            });

            const response = await api.get<{
                data: {
                    items: VendorReviewListItem[];
                    page: number;
                    pageSize: number;
                    total: number;
                    photoReviewCount: number;
                    subRatingSummary: SubRatingSummary;
                    ratingDistribution: RatingDistributionItem[];
                };
            }>(`/api/vendors/${vendorId}/reviews?${params.toString()}`);
            return response.data.data;
        },
    });

    const handleSortChange = (newSort: ReviewSort) => {
        setSort(newSort);
        setPage(1);
    };

    const handlePhotoOnlyChange = (value: boolean) => {
        setPhotoOnly(value);
        setPage(1);
    };

    const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
    const [showPhotoGrid, setShowPhotoGrid] = useState(false);

    const items = reviewData?.items ?? [];
    const hasPhotoReviews = (reviewData?.photoReviewCount ?? 0) > 0;

    // 모든 리뷰의 사진을 모아서 갤러리용 배열 생성
    const allPhotos = useMemo(
        () => items.flatMap((r) => (r.photoUrls ?? []).map((url) => ({ url, alt: "리뷰 사진" }))),
        [items],
    );

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

            {/* 리뷰 사진 모아보기 */}
            {allPhotos.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-gray-400" />
                            리뷰 사진
                            <span className="text-gray-400 font-normal">({allPhotos.length})</span>
                        </h3>
                        {allPhotos.length > 6 && (
                            <button
                                type="button"
                                onClick={() => setShowPhotoGrid(true)}
                                className="text-sm text-gray-500 hover:text-content-primary transition-colors"
                            >
                                전체보기
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                        {allPhotos.slice(0, 6).map((photo, i) => (
                            <button
                                key={`${photo.url}-${i}`}
                                type="button"
                                onClick={() => setGalleryIndex(i)}
                                className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 hover:ring-2 hover:ring-primary transition-all"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={photo.url}
                                    alt={photo.alt}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                        {allPhotos.length > 6 && (
                            <button
                                type="button"
                                onClick={() => setShowPhotoGrid(true)}
                                className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                <span className="text-lg font-bold">+{allPhotos.length - 6}</span>
                                <span className="text-[10px]">더보기</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Filters */}
            {reviewCount > 0 && (
                <div className="mb-4">
                    <ReviewFilters
                        sort={sort}
                        onSortChange={handleSortChange}
                        photoOnly={photoOnly}
                        onPhotoOnlyChange={handlePhotoOnlyChange}
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
            ) : items.length === 0 ? (
                <Empty
                    illustration={EMPTY_ILLUSTRATIONS.review}
                    title={photoOnly ? "사진 리뷰가 없습니다" : "아직 리뷰가 없습니다"}
                    description={photoOnly ? "필터를 해제해 보세요" : "첫 번째 리뷰를 작성해 보세요"}
                />
            ) : (
                <div className="space-y-6">
                    {items.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            currentUserId={currentUserId}
                            onReport={setReportingReviewId}
                        />
                    ))}

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

            {/* Review policy */}
            <p className="text-sm text-gray-500 mt-4">
                리뷰 작성 및 노출 정책은{" "}
                <Link href="/legal/review-policy" className="text-primary underline">
                    리뷰 정책
                </Link>
                을 확인해 주세요.
            </p>

            {/* 사진 전체보기 모달 (바둑판) */}
            {showPhotoGrid && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowPhotoGrid(false)}>
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-content-primary flex items-center gap-2">
                                <Camera className="w-5 h-5 text-gray-400" />
                                리뷰 사진 전체보기
                                <span className="text-sm font-normal text-gray-400">({allPhotos.length})</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowPhotoGrid(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {allPhotos.map((photo, i) => (
                                <button
                                    key={`grid-${photo.url}-${i}`}
                                    type="button"
                                    onClick={() => {
                                        setShowPhotoGrid(false);
                                        setGalleryIndex(i);
                                    }}
                                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-primary transition-all"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photo.url}
                                        alt={photo.alt}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 사진 갤러리 Lightbox */}
            {galleryIndex !== null && allPhotos.length > 0 && (
                <ImageLightbox
                    images={allPhotos}
                    currentIndex={galleryIndex}
                    onIndexChange={setGalleryIndex}
                    onClose={() => setGalleryIndex(null)}
                />
            )}

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
