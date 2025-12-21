"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { Select } from "@/components/ui/Select/Select";

interface VendorFilterProps {
    priceMin?: number;
    priceMax?: number;
    sort: string;
    onPriceMinChange: (value: number | undefined) => void;
    onPriceMaxChange: (value: number | undefined) => void;
    onSortChange: (value: string) => void;
    onReset: () => void;
    isFiltered: boolean;
}

const PRICE_OPTIONS = [
    { value: "", label: "전체" },
    { value: "0", label: "무료" },
    { value: "100000", label: "10만원" },
    { value: "500000", label: "50만원" },
    { value: "1000000", label: "100만원" },
    { value: "5000000", label: "500만원" },
    { value: "10000000", label: "1000만원" },
];

const SORT_OPTIONS = [
    { value: "newest", label: "최신순" },
    { value: "rating", label: "평점순" },
];

export function VendorFilter({
    priceMin,
    priceMax,
    sort,
    onPriceMinChange,
    onPriceMaxChange,
    onSortChange,
    onReset,
    isFiltered,
}: VendorFilterProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>필터</span>
                </div>

                {/* 가격 범위 */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">가격</span>
                    <Select
                        options={PRICE_OPTIONS}
                        value={PRICE_OPTIONS.find((o) => o.value === String(priceMin ?? "")) || PRICE_OPTIONS[0]}
                        onChange={(option) => {
                            if (!option || Array.isArray(option)) return;
                            onPriceMinChange(option.value ? Number(option.value) : undefined);
                        }}
                        placeholder="최소"
                        size="sm"
                        className="w-28"
                    />
                    <span className="text-gray-400">~</span>
                    <Select
                        options={PRICE_OPTIONS}
                        value={PRICE_OPTIONS.find((o) => o.value === String(priceMax ?? "")) || PRICE_OPTIONS[0]}
                        onChange={(option) => {
                            if (!option || Array.isArray(option)) return;
                            onPriceMaxChange(option.value ? Number(option.value) : undefined);
                        }}
                        placeholder="최대"
                        size="sm"
                        className="w-28"
                    />
                </div>

                {/* 구분선 */}
                <div className="hidden sm:block w-px h-6 bg-gray-200" />

                {/* 정렬 */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">정렬</span>
                    <Select
                        options={SORT_OPTIONS}
                        value={SORT_OPTIONS.find((o) => o.value === sort) || SORT_OPTIONS[0]}
                        onChange={(option) => {
                            if (!option || Array.isArray(option)) return;
                            onSortChange(String(option.value));
                        }}
                        size="sm"
                        className="w-28"
                    />
                </div>

                {/* 필터 초기화 */}
                {isFiltered && (
                    <Button
                        variant="ghostSecondary"
                        size="sm"
                        onClick={onReset}
                        LeadingIcon={<X className="w-4 h-4" />}
                    >
                        초기화
                    </Button>
                )}
            </div>
        </div>
    );
}
