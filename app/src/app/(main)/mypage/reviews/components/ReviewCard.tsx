"use client";

import { useRouter } from "next/navigation";
import { Star, MoreVertical, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { Badge } from "@/components/ui/Badge/Badge";
import dayjs from "dayjs";
import { cn } from "@/components/utils";
import type { MyReviewListItem } from "@/lib/schema/review";
import { useState, useRef, useEffect } from "react";

interface ReviewCardProps {
    review: MyReviewListItem;
    onEdit: () => void;
    onDelete: () => void;
    onToggleStatus: () => void;
    isDeleting?: boolean;
    isTogglingStatus?: boolean;
}

export function ReviewCard({
    review,
    onEdit,
    onDelete,
    onToggleStatus,
    isDeleting,
    isTogglingStatus,
}: ReviewCardProps) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // 메뉴 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const isHidden = review.status === "hidden";

    return (
        <div className={cn(
            "bg-white rounded-xl border p-5 transition-colors",
            isHidden ? "border-gray-200 bg-gray-50" : "border-gray-200"
        )}>
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* 업체명 */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => review.vendor && router.push(`/vendors/${review.vendor.id}`)}
                            className="text-lg font-semibold text-[#0a3b41] hover:text-[#62e3d5] transition-colors truncate"
                        >
                            {review.vendor?.name ?? "삭제된 업체"}
                        </button>
                        {isHidden && (
                            <Badge color="gray" size="sm">
                                비공개
                            </Badge>
                        )}
                    </div>

                    {/* 별점 */}
                    <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className={cn(
                                    "w-4 h-4",
                                    i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                                )}
                            />
                        ))}
                        <span className="text-sm text-gray-500 ml-1">{review.rating}.0</span>
                    </div>
                </div>

                {/* 액션 메뉴 */}
                <div className="relative" ref={menuRef}>
                    <Button
                        variant="transparent"
                        size="xs"
                        IconOnly={<MoreVertical />}
                        onClick={() => setMenuOpen(!menuOpen)}
                    />
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onEdit();
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Edit2 className="w-4 h-4" />
                                수정하기
                            </button>
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onToggleStatus();
                                }}
                                disabled={isTogglingStatus}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                {isHidden ? (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        공개로 전환
                                    </>
                                ) : (
                                    <>
                                        <EyeOff className="w-4 h-4" />
                                        비공개로 전환
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    onDelete();
                                }}
                                disabled={isDeleting}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                삭제하기
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 리뷰 내용 */}
            <p className={cn(
                "mt-3 text-sm leading-relaxed",
                isHidden ? "text-gray-500" : "text-gray-700"
            )}>
                {review.content}
            </p>

            {/* 사진 */}
            {review.photoFileIds.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                    {review.photoFileIds.map((fileId) => (
                        <div
                            key={fileId}
                            className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden"
                        >
                            <img
                                src={`/api/files/open?fileId=${fileId}`}
                                alt="리뷰 사진"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* 메타 정보 */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                <span>{dayjs(review.createdAt).format("YYYY.MM.DD")}</span>
                {review.amount && (
                    <span>이용 금액: {review.amount.toLocaleString()}원</span>
                )}
                {review.workedAt && (
                    <span>시술일: {dayjs(review.workedAt).format("YYYY.MM.DD")}</span>
                )}
            </div>
        </div>
    );
}
