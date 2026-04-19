"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, MessageSquare, Pencil, Trash2, User, Siren, Package, Building2 } from "lucide-react";
import dayjs from "dayjs";
import { toast } from "sonner";
import api from "@/api-client/client";
import { reviewsApi } from "@/api-client/reviews";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { ReviewReportModal } from "@/app/(main)/vendors/[id]/components/modal/ReviewReportModal";
import type { VendorDetail, VendorMeResponse } from "@/lib/schema/vendor";
import type { VendorReviewListItem, VendorReviewListResponse } from "@/lib/schema/review";

const PAGE_SIZE = 20;

function StarsDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
    const px = size === "md" ? "w-5 h-5" : "w-4 h-4";
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={`${px} ${
                        n <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
                    }`}
                />
            ))}
        </div>
    );
}

interface ReviewItemProps {
    review: VendorReviewListItem;
    onReplySubmit: (reviewId: string, content: string, isUpdate: boolean) => void;
    onReplyDelete: (reviewId: string) => void;
    onReport: (reviewId: string) => void;
    isSubmitting: boolean;
}

function ReviewItem({ review, onReplySubmit, onReplyDelete, onReport, isSubmitting }: ReviewItemProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(review.reply?.content ?? "");

    const existing = review.reply;
    const isComposing = editing || (!existing && draft !== "");

    const handleSubmit = () => {
        if (!draft.trim()) {
            toast.error("답글 내용을 입력해주세요");
            return;
        }
        onReplySubmit(review.id, draft.trim(), Boolean(existing));
        setEditing(false);
    };

    const handleCancel = () => {
        setEditing(false);
        setDraft(existing?.content ?? "");
    };

    const isProductReview = Boolean(review.productId);
    const serviceLabel = review.leadServiceName?.trim() || null;
    const categoryLabel = review.categoryName?.trim() || null;
    const originLabel = serviceLabel ?? categoryLabel;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
            {/* 출처 뱃지 */}
            <div className="flex items-center justify-between gap-2 mb-3">
                {isProductReview ? (
                    review.productId ? (
                        <Link
                            href={`/products/${review.productId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-full transition-colors"
                            title="상품 페이지 열기"
                        >
                            <Package className="w-3.5 h-3.5" />
                            <span>상품: {review.productName ?? "상품 정보 없음"}</span>
                        </Link>
                    ) : null
                ) : originLabel ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full max-w-full">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{originLabel} 문의</span>
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>업체 리뷰</span>
                    </span>
                )}
                <button
                    type="button"
                    onClick={() => onReport(review.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="허위/부적절한 리뷰 신고"
                >
                    <Siren className="w-4 h-4" />
                </button>
            </div>

            {/* 리뷰 본문 */}
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <StarsDisplay rating={review.rating} />
                        <span className="text-sm text-gray-500">
                            {dayjs(review.createdAt).format("YYYY.MM.DD")}
                        </span>
                    </div>
                    <p className="text-content-primary whitespace-pre-wrap">{review.content}</p>
                    {review.photoUrls && review.photoUrls.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                            {review.photoUrls.map((url, i) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    key={url}
                                    src={url}
                                    alt={`리뷰 사진 ${i + 1}`}
                                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                                />
                            ))}
                        </div>
                    )}
                    {(review.amount !== null || review.workedAt) && (
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                            {review.amount !== null && (
                                <span>결제 금액: {review.amount.toLocaleString()}원</span>
                            )}
                            {review.workedAt && <span>작업일: {review.workedAt}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* 답글 영역 */}
            <div className="mt-4 ml-13 pl-4 border-l-2 border-primary/30">
                {existing && !editing ? (
                    <div className="bg-gray-50 rounded-r-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-medium text-primary">업체 답변</span>
                                <span className="text-xs text-gray-400">
                                    {dayjs(existing.createdAt).format("YYYY.MM.DD")}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDraft(existing.content);
                                        setEditing(true);
                                    }}
                                    className="p-1 text-gray-400 hover:text-primary rounded"
                                    title="답글 수정"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm("답글을 삭제하시겠어요?")) {
                                            onReplyDelete(review.id);
                                        }
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                                    title="답글 삭제"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{existing.content}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="고객 리뷰에 답변을 남겨주세요 (최대 2000자)"
                            maxLength={2000}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{draft.length} / 2000</span>
                            <div className="flex items-center gap-2">
                                {isComposing && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        취소
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !draft.trim()}
                                    isLoading={isSubmitting}
                                >
                                    {existing ? "수정" : "답글 등록"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PartnerReviewsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [reportTargetId, setReportTargetId] = useState<string | null>(null);

    // 내 업체 id 가져오기
    const { data: vendor, isLoading: vendorLoading } = useQuery({
        queryKey: ["vendor", "me"],
        queryFn: async () => {
            const res = await api.get<VendorMeResponse>("/api/vendors/me");
            return res.data.data.vendor as VendorDetail | null;
        },
    });

    const vendorId = vendor?.id;

    // 리뷰 목록 (통계 포함)
    const { data, isLoading: reviewsLoading } = useQuery({
        queryKey: ["partner", "reviews", vendorId, page],
        queryFn: async (): Promise<VendorReviewListResponse["data"]> => {
            if (!vendorId) throw new Error("no vendor");
            return reviewsApi.listByVendor(vendorId, { page, pageSize: PAGE_SIZE, sort: "recent" });
        },
        enabled: Boolean(vendorId),
    });

    const replyMutation = useMutation({
        mutationFn: async (args: { reviewId: string; content: string; isUpdate: boolean }) => {
            if (args.isUpdate) {
                return reviewsApi.updateReply(args.reviewId, { content: args.content });
            }
            return reviewsApi.createReply(args.reviewId, { content: args.content });
        },
        onSuccess: () => {
            toast.success("답글이 저장되었습니다");
            queryClient.invalidateQueries({ queryKey: ["partner", "reviews", vendorId] });
        },
        onError: () => {
            toast.error("답글 저장에 실패했습니다");
        },
    });

    const deleteReplyMutation = useMutation({
        mutationFn: async (reviewId: string) => reviewsApi.deleteReply(reviewId),
        onSuccess: () => {
            toast.success("답글이 삭제되었습니다");
            queryClient.invalidateQueries({ queryKey: ["partner", "reviews", vendorId] });
        },
        onError: () => {
            toast.error("답글 삭제에 실패했습니다");
        },
    });

    const ratingAvg = useMemo(() => {
        if (!data || data.total === 0 || !data.ratingDistribution?.length) return 0;
        const totalCount = data.ratingDistribution.reduce((sum, r) => sum + r.count, 0);
        if (totalCount === 0) return 0;
        const weighted = data.ratingDistribution.reduce((sum, r) => sum + r.rating * r.count, 0);
        return weighted / totalCount;
    }, [data]);

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

    if (vendorLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-800">
                업체 프로필이 없습니다. 먼저 업체 프로필을 등록해주세요.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-content-primary">리뷰 관리</h1>
                <p className="text-gray-500 mt-1">고객 리뷰를 확인하고 답글을 작성할 수 있습니다</p>
            </div>

            {/* 통계 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">평균 별점</p>
                        <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-content-primary">
                                {ratingAvg.toFixed(1)}
                            </span>
                            <StarsDisplay rating={Math.round(ratingAvg)} size="md" />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">총 리뷰</p>
                        <p className="text-3xl font-bold text-content-primary">{data?.total ?? 0}건</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">사진 리뷰</p>
                        <p className="text-3xl font-bold text-content-primary">
                            {data?.photoReviewCount ?? 0}건
                        </p>
                    </div>
                </div>

                {/* 세부 평점 */}
                {data?.subRatingSummary && data.total > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: "품질", value: data.subRatingSummary.qualityRatingAvg },
                            { label: "소통", value: data.subRatingSummary.communicationRatingAvg },
                            { label: "속도", value: data.subRatingSummary.speedRatingAvg },
                        ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{row.label}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-content-primary">
                                        {row.value !== null ? row.value.toFixed(1) : "-"}
                                    </span>
                                    {row.value !== null && (
                                        <StarsDisplay rating={Math.round(row.value)} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 목록 */}
            {reviewsLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner size="lg" />
                </div>
            ) : !data || data.items.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
                    아직 등록된 리뷰가 없습니다
                </div>
            ) : (
                <div className="space-y-3">
                    {data.items.map((review) => (
                        <ReviewItem
                            key={review.id}
                            review={review}
                            onReplySubmit={(reviewId, content, isUpdate) =>
                                replyMutation.mutate({ reviewId, content, isUpdate })
                            }
                            onReplyDelete={(reviewId) => deleteReplyMutation.mutate(reviewId)}
                            onReport={(reviewId) => setReportTargetId(reviewId)}
                            isSubmitting={replyMutation.isPending || deleteReplyMutation.isPending}
                        />
                    ))}
                </div>
            )}

            {/* 페이지네이션 */}
            {data && data.total > PAGE_SIZE && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                    >
                        이전
                    </Button>
                    <span className="text-sm text-gray-600">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                    >
                        다음
                    </Button>
                </div>
            )}

            {/* 신고 모달 */}
            {reportTargetId && (
                <ReviewReportModal
                    reviewId={reportTargetId}
                    onClose={() => setReportTargetId(null)}
                />
            )}
        </div>
    );
}
