"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ChevronDown,
    LayoutGrid,
    LayoutList,
    MapPin,
    SlidersHorizontal,
    Star,
    Shield,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { Select } from "@/components/ui/Select/Select";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { BADGE_DISPLAY_CONFIG, type VendorBadgeType } from "@/lib/schema/badge";
import { REGIONS, SIDO_LIST } from "@/lib/constants/regions";

/* ─────────────────────────── Types ──────────────────────────── */

export interface VendorFilterProps {
    // Price
    priceMin?: number;
    priceMax?: number;
    onPriceMinChange: (v: number | undefined) => void;
    onPriceMaxChange: (v: number | undefined) => void;
    // Region
    regionPrimary?: string;
    regionSecondary?: string;
    onRegionPrimaryChange: (v: string | undefined) => void;
    onRegionSecondaryChange: (v: string | undefined) => void;
    // Rating
    ratingMin?: number;
    onRatingMinChange: (v: number | undefined) => void;
    // Reviews
    hasReviews?: string;
    onHasReviewsChange: (v: string | undefined) => void;
    // Badges
    badgeTypes?: string; // comma-separated
    onBadgeTypesChange: (v: string | undefined) => void;
    // Sort
    sort: string;
    onSortChange: (v: string) => void;
    // View mode
    viewMode: string;
    onViewModeChange: (v: string) => void;
    // Meta
    totalCount?: number;
    onReset: () => void;
    isFiltered: boolean;
    listingType?: "vendor" | "product";
}

/* ─────────────────────────── Constants ──────────────────────── */

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
    { value: "reviewCount", label: "리뷰많은순" },
    { value: "popular", label: "인기순" },
];

const RATING_OPTIONS = [
    { value: undefined, label: "전체" },
    { value: 4.0, label: "4.0 이상" },
    { value: 4.5, label: "4.5 이상" },
] as const;

const BADGE_FILTER_TYPES: VendorBadgeType[] = [
    "verified",
    "premium_partner",
    "top_rated",
    "fast_response",
    "new_vendor",
];

/* ─────────────────────── FilterDropdown ─────────────────────── */

function FilterDropdown({
    label,
    icon: Icon,
    isActive,
    activeLabel,
    children,
}: {
    label: string;
    icon?: React.FC<{ className?: string }>;
    isActive: boolean;
    activeLabel?: string;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors
                    ${isActive
                        ? "border-primary bg-primary-50 text-content-primary font-medium"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }
                `}
            >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{activeLabel || label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1.5 z-50 bg-white rounded-xl border border-gray-200 shadow-lg p-3 min-w-[240px]">
                    {children}
                </div>
            )}
        </div>
    );
}

/* ───────────────────── RegionFilterPanel ─────────────────────── */

function RegionFilterPanel({
    regionPrimary,
    regionSecondary,
    onRegionPrimaryChange,
    onRegionSecondaryChange,
}: {
    regionPrimary?: string;
    regionSecondary?: string;
    onRegionPrimaryChange: (v: string | undefined) => void;
    onRegionSecondaryChange: (v: string | undefined) => void;
}) {
    const sigunguList = regionPrimary ? REGIONS[regionPrimary] ?? [] : [];

    return (
        <div className="flex gap-2 max-h-[280px]">
            {/* 시/도 */}
            <div className="w-24 overflow-y-auto border-r border-gray-100 pr-2 space-y-0.5">
                <button
                    type="button"
                    onClick={() => {
                        onRegionPrimaryChange(undefined);
                        onRegionSecondaryChange(undefined);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors ${
                        !regionPrimary ? "bg-primary-50 text-content-primary font-medium" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                    전체
                </button>
                {SIDO_LIST.map((sido) => (
                    <button
                        key={sido}
                        type="button"
                        onClick={() => {
                            onRegionPrimaryChange(sido);
                            onRegionSecondaryChange(undefined);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors ${
                            regionPrimary === sido
                                ? "bg-primary-50 text-content-primary font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        {sido}
                    </button>
                ))}
            </div>
            {/* 시/군/구 */}
            {sigunguList.length > 0 && (
                <div className="flex-1 overflow-y-auto space-y-0.5">
                    <button
                        type="button"
                        onClick={() => onRegionSecondaryChange(undefined)}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors ${
                            !regionSecondary ? "bg-primary-50 text-content-primary font-medium" : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        전체
                    </button>
                    {sigunguList.map((sg) => (
                        <button
                            key={sg}
                            type="button"
                            onClick={() => onRegionSecondaryChange(sg)}
                            className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors ${
                                regionSecondary === sg
                                    ? "bg-primary-50 text-content-primary font-medium"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            {sg}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ────────────────────── Main Component ──────────────────────── */

export function VendorFilter({
    priceMin,
    priceMax,
    onPriceMinChange,
    onPriceMaxChange,
    regionPrimary,
    regionSecondary,
    onRegionPrimaryChange,
    onRegionSecondaryChange,
    ratingMin,
    onRatingMinChange,
    hasReviews,
    onHasReviewsChange,
    badgeTypes,
    onBadgeTypesChange,
    sort,
    onSortChange,
    viewMode,
    onViewModeChange,
    totalCount,
    onReset,
    isFiltered,
    listingType = "vendor",
}: VendorFilterProps) {
    const isVendor = listingType === "vendor";

    // Badge types as array
    const selectedBadges = useMemo(
        () => (badgeTypes ? badgeTypes.split(",").filter(Boolean) : []),
        [badgeTypes],
    );

    const toggleBadge = useCallback(
        (bt: string) => {
            const next = selectedBadges.includes(bt)
                ? selectedBadges.filter((b) => b !== bt)
                : [...selectedBadges, bt];
            onBadgeTypesChange(next.length > 0 ? next.join(",") : undefined);
        },
        [selectedBadges, onBadgeTypesChange],
    );

    // Region active label
    const regionLabel = regionPrimary
        ? regionSecondary
            ? `${regionPrimary} ${regionSecondary}`
            : regionPrimary
        : undefined;

    // Rating active label
    const ratingLabel = ratingMin ? `${ratingMin}점 이상` : undefined;

    // Badge active label
    const badgeLabel =
        selectedBadges.length > 0
            ? selectedBadges.length === 1
                ? BADGE_DISPLAY_CONFIG[selectedBadges[0] as VendorBadgeType]?.label
                : `배지 ${selectedBadges.length}개`
            : undefined;

    // Active filter tags for display
    const activeTags: { key: string; label: string; onRemove: () => void }[] = [];
    if (regionPrimary) {
        activeTags.push({
            key: "region",
            label: regionLabel!,
            onRemove: () => {
                onRegionPrimaryChange(undefined);
                onRegionSecondaryChange(undefined);
            },
        });
    }
    if (priceMin !== undefined || priceMax !== undefined) {
        const minLabel = PRICE_OPTIONS.find((o) => o.value === String(priceMin))?.label;
        const maxLabel = PRICE_OPTIONS.find((o) => o.value === String(priceMax))?.label;
        const label = minLabel && maxLabel ? `${minLabel} ~ ${maxLabel}` : minLabel ? `${minLabel} 이상` : maxLabel ? `${maxLabel} 이하` : "가격";
        activeTags.push({
            key: "price",
            label,
            onRemove: () => {
                onPriceMinChange(undefined);
                onPriceMaxChange(undefined);
            },
        });
    }
    if (ratingMin !== undefined) {
        activeTags.push({
            key: "rating",
            label: ratingLabel!,
            onRemove: () => onRatingMinChange(undefined),
        });
    }
    if (hasReviews === "true") {
        activeTags.push({
            key: "reviews",
            label: "리뷰 있는 업체",
            onRemove: () => onHasReviewsChange(undefined),
        });
    }
    for (const bt of selectedBadges) {
        const config = BADGE_DISPLAY_CONFIG[bt as VendorBadgeType];
        if (config) {
            activeTags.push({
                key: `badge-${bt}`,
                label: config.label,
                onRemove: () => toggleBadge(bt),
            });
        }
    }

    return (
        <div className="space-y-3">
            {/* Row 1: Filter buttons + Sort + View toggle */}
            <div className="bg-white rounded-xl border border-gray-100 p-3">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Filter icon */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-400 mr-1">
                        <SlidersHorizontal className="w-4 h-4" />
                    </div>

                    {/* Region filter — vendor only */}
                    {isVendor && (
                        <FilterDropdown
                            label="지역"
                            icon={MapPin}
                            isActive={!!regionPrimary}
                            activeLabel={regionLabel}
                        >
                            <RegionFilterPanel
                                regionPrimary={regionPrimary}
                                regionSecondary={regionSecondary}
                                onRegionPrimaryChange={onRegionPrimaryChange}
                                onRegionSecondaryChange={onRegionSecondaryChange}
                            />
                        </FilterDropdown>
                    )}

                    {/* Price filter */}
                    <FilterDropdown
                        label="가격"
                        isActive={priceMin !== undefined || priceMax !== undefined}
                        activeLabel={
                            priceMin !== undefined || priceMax !== undefined ? "가격 설정됨" : undefined
                        }
                    >
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 font-medium mb-2">가격 범위</p>
                            <div className="flex items-center gap-2">
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
                                <span className="text-gray-400 text-sm">~</span>
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
                        </div>
                    </FilterDropdown>

                    {/* Rating filter — vendor only */}
                    {isVendor && (
                        <FilterDropdown
                            label="평점"
                            icon={Star}
                            isActive={ratingMin !== undefined}
                            activeLabel={ratingLabel}
                        >
                            <div className="space-y-1">
                                {RATING_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.label}
                                        type="button"
                                        onClick={() => onRatingMinChange(opt.value)}
                                        className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                            ratingMin === opt.value
                                                ? "bg-primary-50 text-content-primary font-medium"
                                                : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </FilterDropdown>
                    )}

                    {/* Badge filter — vendor only */}
                    {isVendor && (
                        <FilterDropdown
                            label="배지"
                            icon={Shield}
                            isActive={selectedBadges.length > 0}
                            activeLabel={badgeLabel}
                        >
                            <div className="space-y-1.5">
                                {BADGE_FILTER_TYPES.map((bt) => {
                                    const config = BADGE_DISPLAY_CONFIG[bt];
                                    return (
                                        <Checkbox
                                            key={bt}
                                            checked={selectedBadges.includes(bt)}
                                            onChange={() => toggleBadge(bt)}
                                            label={config.label}
                                            size="sm"
                                        />
                                    );
                                })}
                            </div>
                        </FilterDropdown>
                    )}

                    {/* Review filter — vendor only */}
                    {isVendor && (
                        <button
                            type="button"
                            onClick={() =>
                                onHasReviewsChange(hasReviews === "true" ? undefined : "true")
                            }
                            className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors
                                ${hasReviews === "true"
                                    ? "border-primary bg-primary-50 text-content-primary font-medium"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                }
                            `}
                        >
                            리뷰 있는 업체만
                        </button>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Sort */}
                    <div className="flex items-center gap-1.5">
                        <Select
                            options={SORT_OPTIONS}
                            value={SORT_OPTIONS.find((o) => o.value === sort) || SORT_OPTIONS[0]}
                            onChange={(option) => {
                                if (!option || Array.isArray(option)) return;
                                onSortChange(String(option.value));
                            }}
                            size="sm"
                            className="w-32"
                        />
                    </div>

                    {/* View mode toggle */}
                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
                        <button
                            type="button"
                            onClick={() => onViewModeChange("grid")}
                            className={`p-1.5 rounded-md transition-colors ${
                                viewMode === "grid"
                                    ? "bg-white text-content-primary shadow-sm"
                                    : "text-gray-400 hover:text-gray-600"
                            }`}
                            aria-label="그리드 뷰"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange("list")}
                            className={`p-1.5 rounded-md transition-colors ${
                                viewMode === "list"
                                    ? "bg-white text-content-primary shadow-sm"
                                    : "text-gray-400 hover:text-gray-600"
                            }`}
                            aria-label="리스트 뷰"
                        >
                            <LayoutList className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Row 2: Result count + Active filter tags */}
            {(isFiltered || totalCount !== undefined) && (
                <div className="flex flex-wrap items-center gap-2">
                    {totalCount !== undefined && (
                        <span className="text-sm font-medium text-content-primary">
                            {totalCount}개 {isVendor ? "업체" : "상품"}
                        </span>
                    )}

                    {activeTags.map((tag) => (
                        <span
                            key={tag.key}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary-50 text-content-primary rounded-full"
                        >
                            {tag.label}
                            <button
                                type="button"
                                onClick={tag.onRemove}
                                className="hover:text-primary-800 transition-colors"
                                aria-label={`${tag.label} 필터 제거`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}

                    {isFiltered && (
                        <Button
                            variant="ghostSecondary"
                            size="xs"
                            onClick={onReset}
                            LeadingIcon={<X className="w-3.5 h-3.5" />}
                        >
                            초기화
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
