"use client";

import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, TrendingUp, X, Building2, Tag, Package } from "lucide-react";
import api from "@/api-client/client";
import { useDebounce } from "@/hooks/useDebounce";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import {
    getRecentSearches,
    removeRecentSearch,
    clearRecentSearches,
} from "@/lib/utils/recent-searches";

interface SearchDropdownProps {
    containerRef: RefObject<HTMLElement | null>;
    query: string;
    isOpen: boolean;
    onClose: () => void;
    onSelect: (term: string) => void;
}

interface AutocompleteItem {
    label: string;
    type: "vendor" | "category" | "product";
    score: number;
}

interface PopularTerm {
    term: string;
    count: number;
}

const RESULT_TYPES = ["vendor", "category", "product"] as const;

const TYPE_CONFIG = {
    vendor: { label: "업체", icon: Building2 },
    category: { label: "카테고리", icon: Tag },
    product: { label: "상품", icon: Package },
} as const;

export function SearchDropdown({ containerRef, query, isOpen, onClose, onSelect }: SearchDropdownProps) {
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const listRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounce(query.trim(), 300);
    const hasQuery = debouncedQuery.length >= 1;

    // 최근 검색어 로드 (SSR 안전)
    useEffect(() => {
        if (isOpen) {
            setRecentSearches(getRecentSearches());
        }
    }, [isOpen]);

    // 자동완성 API
    const { data: autocompleteItems, isLoading: autocompleteLoading } = useQuery({
        queryKey: ["search", "autocomplete", debouncedQuery],
        queryFn: async () => {
            const res = await api.get<{ data: { items: AutocompleteItem[] } }>(
                `/api/search/autocomplete?q=${encodeURIComponent(debouncedQuery)}&limit=8`
            );
            return res.data.data.items;
        },
        enabled: hasQuery && isOpen,
        staleTime: 30_000,
    });

    // 인기 검색어 API
    const { data: popularTerms } = useQuery({
        queryKey: ["search", "popular"],
        queryFn: async () => {
            const res = await api.get<{ data: { items: PopularTerm[] } }>(
                "/api/search/popular?days=30&limit=10"
            );
            return res.data.data.items;
        },
        staleTime: 5 * 60 * 1000,
        enabled: isOpen && !hasQuery,
    });

    // 자동완성 결과를 type별로 그룹핑
    const groupedResults = useMemo(() => {
        return {
            vendor: autocompleteItems?.filter((item) => item.type === "vendor") ?? [],
            category: autocompleteItems?.filter((item) => item.type === "category") ?? [],
            product: autocompleteItems?.filter((item) => item.type === "product") ?? [],
        };
    }, [autocompleteItems]);

    const visibleRecentSearches = useMemo(() => recentSearches.slice(0, 5), [recentSearches]);

    const visiblePopularTerms = useMemo(() => popularTerms?.slice(0, 8) ?? [], [popularTerms]);

    const orderedAutocompleteItems = useMemo(
        () => RESULT_TYPES.flatMap((type) => groupedResults[type]),
        [groupedResults],
    );

    // 플랫 아이템 리스트 (키보드 네비게이션용)
    const flatItems = useMemo(() => {
        if (hasQuery) {
            return orderedAutocompleteItems.map((item) => item.label);
        }
        return [
            ...visibleRecentSearches,
            ...visiblePopularTerms.map((item) => item.term),
        ];
    }, [hasQuery, orderedAutocompleteItems, visibleRecentSearches, visiblePopularTerms]);

    // 하이라이트 인덱스 리셋
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [debouncedQuery, isOpen]);

    // 키보드 네비게이션
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen || flatItems.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < flatItems.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : flatItems.length - 1
                );
            } else if (e.key === "Enter" && highlightedIndex >= 0) {
                e.preventDefault();
                onSelect(flatItems[highlightedIndex]);
            } else if (e.key === "Escape") {
                onClose();
            }
        },
        [isOpen, flatItems, highlightedIndex, onSelect, onClose]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (e: PointerEvent) => {
            const target = e.target;
            if (!(target instanceof Node)) return;
            if (containerRef.current?.contains(target)) return;
            onClose();
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [containerRef, isOpen, onClose]);

    // 하이라이트된 아이템 스크롤
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const el = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
            el?.scrollIntoView({ block: "nearest" });
        }
    }, [highlightedIndex]);

    const handleRemoveRecent = (term: string) => {
        removeRecentSearch(term);
        setRecentSearches((prev) => prev.filter((s) => s !== term));
    };

    const handleClearAll = () => {
        clearRecentSearches();
        setRecentSearches([]);
    };

    if (!isOpen) return null;

    let flatIndex = -1;

    return (
        <div
            ref={listRef}
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-30 max-h-[400px] overflow-y-auto"
        >
                {/* === 검색어 없을 때: 최근 + 인기 === */}
                {!hasQuery && (
                    <>
                        {/* 최근 검색어 */}
                        {visibleRecentSearches.length > 0 && (
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        최근 검색어
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClearAll}
                                        className="text-xs text-gray-400 hover:text-gray-600"
                                    >
                                        전체 삭제
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {visibleRecentSearches.map((term) => {
                                        flatIndex++;
                                        const idx = flatIndex;
                                        return (
                                            <div
                                                key={term}
                                                role="option"
                                                aria-selected={highlightedIndex === idx}
                                                data-index={idx}
                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors cursor-pointer ${
                                                    highlightedIndex === idx
                                                        ? "bg-primary-50 text-primary-700"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => onSelect(term)}
                                                    className="leading-none"
                                                >
                                                    {term}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveRecent(term);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 인기 검색어 */}
                        {visiblePopularTerms.length > 0 && (
                            <div className={`p-3 ${visibleRecentSearches.length > 0 ? "border-t border-gray-100" : ""}`}>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    인기 검색어
                                </div>
                                <div className="space-y-0.5">
                                    {visiblePopularTerms.map((item, i) => {
                                        flatIndex++;
                                        const idx = flatIndex;
                                        return (
                                            <button
                                                key={item.term}
                                                type="button"
                                                role="option"
                                                aria-selected={highlightedIndex === idx}
                                                data-index={idx}
                                                onClick={() => onSelect(item.term)}
                                                className={`flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-sm transition-colors ${
                                                    highlightedIndex === idx
                                                        ? "bg-primary-50 text-primary-700"
                                                        : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                            >
                                                <span className={`w-5 text-center text-xs font-bold ${
                                                    i < 3 ? "text-primary-600" : "text-gray-400"
                                                }`}>
                                                    {i + 1}
                                                </span>
                                                <span>{item.term}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 둘 다 없을 때 */}
                        {visibleRecentSearches.length === 0 && visiblePopularTerms.length === 0 && (
                            <div className="p-6 text-center text-sm text-gray-400">
                                <Search className="w-5 h-5 mx-auto mb-2 text-gray-300" />
                                검색어를 입력해 보세요
                            </div>
                        )}
                    </>
                )}

                {/* === 검색어 있을 때: 자동완성 === */}
                {hasQuery && (
                    <>
                        {autocompleteLoading && (
                            <div className="flex items-center justify-center py-6">
                                <Spinner size="sm" />
                            </div>
                        )}

                        {!autocompleteLoading && orderedAutocompleteItems.length > 0 && (
                            <>
                                {RESULT_TYPES.map((type) => {
                                    const items = groupedResults[type];
                                    if (!items?.length) return null;
                                    const config = TYPE_CONFIG[type];
                                    const TypeIcon = config.icon;

                                    return (
                                        <div key={type} className="border-b border-gray-100 last:border-b-0">
                                            <div className="flex items-center gap-1.5 px-3 pt-3 pb-1 text-xs font-medium text-gray-500">
                                                <TypeIcon className="w-3.5 h-3.5" />
                                                {config.label}
                                            </div>
                                            {items.map((item) => {
                                                flatIndex++;
                                                const idx = flatIndex;
                                                return (
                                                    <button
                                                        key={`${type}-${item.label}`}
                                                        type="button"
                                                        role="option"
                                                        aria-selected={highlightedIndex === idx}
                                                        data-index={idx}
                                                        onClick={() => onSelect(item.label)}
                                                        className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm transition-colors ${
                                                            highlightedIndex === idx
                                                                ? "bg-primary-50 text-primary-700"
                                                                : "text-gray-700 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                        <span className="truncate">{item.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        {!autocompleteLoading && (!autocompleteItems || autocompleteItems.length === 0) && (
                            <div className="p-4 text-center text-sm text-gray-400">
                                &quot;{debouncedQuery}&quot;에 대한 추천 검색어가 없습니다
                            </div>
                        )}
                    </>
                )}
        </div>
    );
}
