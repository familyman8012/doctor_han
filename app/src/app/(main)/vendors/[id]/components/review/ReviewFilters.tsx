"use client";

import { useState } from "react";
import { ChevronDown, Camera } from "lucide-react";
import type { ReviewSort } from "@/lib/schema/review";

interface ReviewFiltersProps {
    sort: ReviewSort;
    onSortChange: (sort: ReviewSort) => void;
    photoOnly: boolean;
    onPhotoOnlyChange: (value: boolean) => void;
    hasPhotoReviews: boolean;
}

const SORT_OPTIONS: Array<{ value: ReviewSort; label: string }> = [
    { value: "recent", label: "최신순" },
    { value: "rating_high", label: "별점 높은순" },
    { value: "rating_low", label: "별점 낮은순" },
];

export function ReviewFilters({
    sort,
    onSortChange,
    photoOnly,
    onPhotoOnlyChange,
    hasPhotoReviews,
}: ReviewFiltersProps) {
    const [isSortOpen, setIsSortOpen] = useState(false);

    return (
        <div className="flex items-center justify-between">
            {/* Sort dropdown */}
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
                    <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        {SORT_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onSortChange(option.value);
                                    setIsSortOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                    sort === option.value
                                        ? "text-primary font-medium"
                                        : "text-gray-700"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Photo filter toggle */}
            {hasPhotoReviews && (
                <button
                    type="button"
                    onClick={() => onPhotoOnlyChange(!photoOnly)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        photoOnly
                            ? "bg-primary/10 border-primary text-primary font-medium"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                >
                    <Camera className="w-4 h-4" />
                    사진 리뷰만
                </button>
            )}
        </div>
    );
}
