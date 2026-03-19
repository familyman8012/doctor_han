"use client";

import { useState } from "react";
import { Star, User, Flag, MessageSquare } from "lucide-react";
import dayjs from "dayjs";
import type { VendorReviewListItem } from "@/lib/schema/review";
import { ImageLightbox } from "../gallery/ImageLightbox";

interface ReviewCardProps {
    review: VendorReviewListItem;
    currentUserId?: string;
    onReport: (reviewId: string) => void;
}

function Stars({ rating }: { rating: number }) {
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
}

export function ReviewCard({ review, currentUserId, onReport }: ReviewCardProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const isOwnReview = currentUserId === review.doctorUserId;
    const photoUrls = review.photoUrls ?? [];

    return (
        <div className="border-b border-gray-100 pb-6 last:border-0">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header: stars + date + report */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Stars rating={review.rating} />
                            <span className="text-sm text-gray-500">
                                {dayjs(review.createdAt).format("YYYY.MM.DD")}
                            </span>
                        </div>
                        {currentUserId && !isOwnReview && (
                            <button
                                type="button"
                                onClick={() => onReport(review.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="리뷰 신고"
                            >
                                <Flag className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <p className="text-content-primary whitespace-pre-wrap">{review.content}</p>

                    {/* Photo thumbnails */}
                    {photoUrls.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                            {photoUrls.map((url, i) => (
                                <button
                                    key={url}
                                    type="button"
                                    onClick={() => setLightboxIndex(i)}
                                    className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 hover:ring-2 hover:ring-primary transition-all"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`리뷰 사진 ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Metadata */}
                    {(review.amount !== null || review.workedAt) && (
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                            {review.amount !== null && (
                                <span>결제 금액: {review.amount.toLocaleString()}원</span>
                            )}
                            {review.workedAt && <span>작업일: {review.workedAt}</span>}
                        </div>
                    )}

                    {/* Vendor Reply */}
                    {review.reply && (
                        <div className="mt-3 ml-2 pl-4 border-l-2 border-primary/30 bg-gray-50 rounded-r-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-medium text-primary">업체 답변</span>
                                <span className="text-xs text-gray-400">
                                    {dayjs(review.reply.createdAt).format("YYYY.MM.DD")}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {review.reply.content}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Photo Lightbox */}
            {lightboxIndex !== null && (
                <ImageLightbox
                    images={photoUrls.map((url, i) => ({ url, alt: `리뷰 사진 ${i + 1}` }))}
                    currentIndex={lightboxIndex}
                    onIndexChange={setLightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
}
