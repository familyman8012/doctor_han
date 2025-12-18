"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2, Package, X } from "lucide-react";
import React, {
    forwardRef,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { skuApi } from "@/api-client/sku";
import { type IOption } from "@/components/ui/Select/Select";
import { useSkuInfiniteOptions } from "@/hooks/sku/useSkuInfiniteOptions";
import type { SkuView } from "@/lib/schema/sku";

interface SkuSelectProps {
    value?: string | null;
    onChange?: (value: string | null, skuData?: any) => void;
    disabled?: boolean;
    placeholder?: string;
    size?: "xs" | "sm" | "md" | "lg";
    label?: string;
    error?: string;
    required?: boolean;
    className?: string;
    brand?: string;
    status?: string;
    salesGroupId?: number;
    includeHidden?: boolean;
    usePortal?: boolean;
    excludeSkuCodes?: string[];
}

const sizeHeights = {
    xs: "34px",
    sm: "38px",
    md: "40px",
    lg: "44px",
} as const;

export const SkuSelect = forwardRef<HTMLButtonElement, SkuSelectProps>(function SkuSelect(
    {
        value,
        onChange,
        disabled = false,
        placeholder = "SKU를 선택하세요",
        size = "sm",
        label,
        error,
        required = false,
        className,
        brand,
        status,
        salesGroupId,
        includeHidden = false,
        usePortal = true,
        excludeSkuCodes = [],
    },
    _ref,
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const controlRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const menuContainerRef = useRef<HTMLDivElement>(null);
    const hasInitialHighlightRef = useRef(false);
    const hasInitialScrollRef = useRef(false);
    const hasUserScrolledRef = useRef(false);
    const previousSearchRef = useRef<string>("");

    const [isOpen, setIsOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [shouldFetch, setShouldFetch] = useState(Boolean(value));
    const [highlightIndex, setHighlightIndex] = useState(0);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number }>({
        top: 0,
        left: 0,
        width: 0,
    });

    const {
        items,
        isLoading: isListLoading,
        isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useSkuInfiniteOptions({
        search: searchInput,
        brand,
        status,
        salesGroupId,
        includeHidden,
        enabled: shouldFetch,
        pageSize: 50,
        orderBy: "itemCode",
        orderDirection: "asc",
    });

    const shouldFetchSelectedDetail = Boolean(value) && !items.some((item) => item.itemCode === value);
    const { data: selectedDetail, isLoading: isDetailLoading } = useQuery({
        queryKey: ["skus", "select", "detail", value],
        queryFn: ({ signal }) => skuApi.getDetail(value as string, { signal }),
        enabled: shouldFetchSelectedDetail,
        staleTime: 5 * 60 * 1000,
    });

    const itemMap = useMemo(() => {
        const map = new Map<string, SkuView>();
        items.forEach((item) => {
            map.set(item.itemCode, item);
        });
        return map;
    }, [items]);

    const skuOptions = useMemo<IOption[]>(() => {
        if (itemMap.size === 0) return [];

        return Array.from(itemMap.values())
            .filter((sku) => !excludeSkuCodes.includes(sku.itemCode))
            .map((sku) => ({
                value: sku.itemCode,
                label: sku.itemCode,
                description: sku.itemName,
                icon: (
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-[#62e3d5]/20">
                        <Package className="h-3 w-3 text-[#0a3b41]" />
                    </div>
                ),
                data: sku,
            }));
    }, [excludeSkuCodes, itemMap]);

    const selectedOption = useMemo(() => {
        if (value === null || value === undefined) return null;
        return skuOptions.find((opt) => opt.value === value) || null;
    }, [value, skuOptions]);

    // 옵션에 아직 없는 값도 즉시 표시하기 위한 폴백
    const displayOption = useMemo<IOption | null>(() => {
        if (selectedOption) return selectedOption;
        if (value === null || value === undefined) return null;

        const fallback = selectedDetail;
        return {
            value,
            label: String(value),
            description: fallback?.itemName ?? undefined,
        };
    }, [selectedOption, selectedDetail, value]);

    const isLoading = (shouldFetch && (isListLoading || isFetching)) || isDetailLoading;
    const isInitialLoading = isLoading && skuOptions.length === 0;
    const isBackgroundFetching = skuOptions.length > 0 && (isFetchingNextPage || isFetching);
    const computedHeight = sizeHeights[size] || sizeHeights.sm;
    const isControlDisabled = disabled || isLoading;
    const hasSelectedDescription = Boolean(displayOption?.description);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (!containerRef.current) return;
            if (event.target instanceof Node) {
                if (containerRef.current.contains(event.target)) return;
                if (menuContainerRef.current && menuContainerRef.current.contains(event.target)) {
                    return;
                }
            }
            setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isOpen]);

    useLayoutEffect(() => {
        if (!isOpen || !usePortal || !controlRef.current) return;
        const updatePosition = () => {
            const rect = controlRef.current!.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        };
        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [isOpen, usePortal]);

    // 드롭다운 열림/닫힘에 따른 초기화
    useEffect(() => {
        if (!isOpen) {
            hasInitialHighlightRef.current = false;
            hasInitialScrollRef.current = false;
            hasUserScrolledRef.current = false;
        }
    }, [isOpen]);

    // 최초 열림 시, 선택된 값이 현재 옵션에 있으면 해당 위치로 한 번만 하이라이트 이동
    useEffect(() => {
        if (!isOpen) return;
        if (hasInitialHighlightRef.current) return;
        if (hasUserScrolledRef.current) return;
        if (skuOptions.length === 0) return;

        // 선택값이 없는 경우: 단순히 첫 항목에 포커스 한 번만 주고 끝낸다.
        if (value === null || value === undefined) {
            setHighlightIndex(0);
            hasInitialHighlightRef.current = true;
            return;
        }

        const foundIndex = skuOptions.findIndex((opt) => opt.value === value);
        if (foundIndex >= 0) {
            setHighlightIndex(foundIndex);
            hasInitialHighlightRef.current = true;
        }
    }, [isOpen, value, skuOptions]);

    // 하이라이트 변경 시, 해당 항목이 보이도록 스크롤 (인피니트 스크롤 중 데이터 추가에는 반응하지 않음)
    useEffect(() => {
        if (!isOpen) return;
        if (!listRef.current) return;
        if (highlightIndex < 0 || highlightIndex >= skuOptions.length) return;

        const container = listRef.current;
        const optionEl = container.children[highlightIndex] as HTMLElement | undefined;
        if (!optionEl) return;

        optionEl.scrollIntoView({ block: "nearest" });
        hasInitialScrollRef.current = true;
    }, [highlightIndex, isOpen]);

    const toggleOpen = () => {
        if (disabled) return;
        setIsOpen((prev) => {
            const next = !prev;
            if (next && !shouldFetch) {
                setShouldFetch(true);
            }
            return next;
        });
    };

    const handleSelect = (option: IOption | null) => {
        const newValue = option ? (option.value as string) : null;
        const skuData = option ? (option as IOption & { data?: unknown }).data : null;
        onChange?.(newValue, skuData);
        setIsOpen(false);
    };

    const handleClear = (event: React.MouseEvent) => {
        event.stopPropagation();
        handleSelect(null);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (!isOpen && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            toggleOpen();
            return;
        }
        if (!isOpen) return;
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightIndex((prev) => Math.min(prev + 1, skuOptions.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightIndex((prev) => Math.max(prev - 1, 0));
        } else if (event.key === "Enter") {
            event.preventDefault();
            const option = skuOptions[highlightIndex];
            if (option) {
                handleSelect(option);
            }
        } else if (event.key === "Escape") {
            event.preventDefault();
            setIsOpen(false);
        }
    };

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const target = event.currentTarget;
        if (target.scrollTop > 0) {
            hasUserScrolledRef.current = true;
        }
        // 바닥 근처에서 미리 불러와 부드럽게 이어지도록 여유값을 크게 설정
        const threshold = 200;
        if (
            target.scrollHeight - target.scrollTop - target.clientHeight < threshold &&
            hasNextPage &&
            !isFetchingNextPage
        ) {
            void fetchNextPage();
        }
    };

    // 검색어를 지웠을 때는 리스트 스크롤과 하이라이트를 상단으로 되돌린다.
    useEffect(() => {
        const prev = previousSearchRef.current.trim();
        const current = searchInput.trim();
        if (isOpen && prev.length > 0 && current.length === 0) {
            if (listRef.current) {
                listRef.current.scrollTop = 0;
            }
            setHighlightIndex(0);
            hasInitialScrollRef.current = false;
            hasUserScrolledRef.current = false;
        }
        previousSearchRef.current = searchInput;
    }, [isOpen, searchInput]);

    const renderOptions = () => {
        if (!shouldFetch && !isOpen) return null;
        if (isInitialLoading) {
            return <div className="px-3 py-3 text-sm text-gray-500">불러오는 중...</div>;
        }
        if (!isLoading && skuOptions.length === 0) {
            return (
                <div className="px-3 py-3 text-sm text-gray-500">
                    {searchInput ? "검색 결과가 없습니다" : "옵션이 없습니다"}
                </div>
            );
        }

        return (
            <>
                <div
                    ref={listRef}
                    className="max-h-80 overflow-y-auto divide-y divide-gray-100"
                    onScroll={handleScroll}
                >
                    {skuOptions.map((option, index) => {
                        const isHighlighted = index === highlightIndex;
                        const isSelected = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option)}
                                className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${
                                    isHighlighted ? "bg-gray-100" : "hover:bg-gray-50"
                                } ${isSelected ? "text-[#0a3b41] font-semibold" : "text-gray-800"}`}
                            >
                                {option.icon && <div className="mt-0.5">{option.icon}</div>}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm truncate">{option.label}</div>
                                    {option.description && (
                                        <div className="text-xs text-gray-500 truncate mt-0.5">{option.description}</div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
                {!hasNextPage && skuOptions.length > 0 && (
                    <div className="px-3 py-2 text-xs text-gray-400">모두 불러왔습니다</div>
                )}
            </>
        );
    };

    const effectivePlaceholder = isInitialLoading ? "SKU 불러오는 중..." : placeholder;

    const hasValue = value !== null && value !== undefined && String(value).trim().length > 0;
    const selectedLabel = hasValue ? String(value) : "";

    const controlDisplay = hasValue ? (
        <div className="flex items-center gap-3 text-left">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#62e3d5]/15">
                <Package className="h-3.5 w-3.5 text-[#0a3b41]" />
            </div>
            <div className="flex min-w-0 flex-col items-start">
                <span className="truncate text-sm font-medium text-[#0a3b41]">{selectedLabel}</span>
                {hasSelectedDescription && displayOption?.description && (
                    <span className="truncate text-xs text-[#5f6b6d]">{displayOption.description}</span>
                )}
            </div>
        </div>
    ) : (
        <div className="flex items-center gap-3 text-gray-400">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[#62e3d5]/10">
                <Package className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <span className="truncate text-sm">{effectivePlaceholder}</span>
        </div>
    );

    const menuContent = (
        <div
            ref={menuContainerRef}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
            style={
                usePortal
                    ? {
                          position: "fixed",
                          top: menuPosition.top,
                          left: menuPosition.left,
                          width: menuPosition.width,
                          zIndex: 1000002,
                      }
                    : {
                          position: "absolute",
                          insetInlineStart: 0,
                          insetInlineEnd: 0,
                          zIndex: 40,
                      }
            }
        >
            <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <input
                        value={searchInput}
                        onChange={(e) => {
                            setSearchInput(e.target.value);
                            setShouldFetch(true);
                        }}
                        autoFocus
                        className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#62e3d5] focus:ring-1 focus:ring-[#62e3d5]"
                        placeholder="SKU 코드 또는 이름 검색"
                    />
                    {isBackgroundFetching && (
                        <Loader2
                            className="h-4 w-4 animate-spin text-gray-400"
                            role="status"
                            aria-label="옵션 불러오는 중"
                        />
                    )}
                </div>
            </div>
            {renderOptions()}
        </div>
    );

    return (
        <div className={className} ref={containerRef}>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <button
                    ref={controlRef}
                    type="button"
                    className={`flex w-full items-center justify-between rounded-lg border px-3 overflow-hidden ${
                        hasSelectedDescription ? "py-2" : "py-2.5"
                    } text-sm ${
                        isControlDisabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"
                    } ${error ? "border-red-400" : "border-gray-200"} focus:outline-none focus:ring-2 focus:ring-[#62e3d5]`}
                    style={{ minHeight: computedHeight }}
                    onClick={toggleOpen}
                    onKeyDown={handleKeyDown}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    disabled={disabled}
                >
                    <div className="flex-1 min-w-0">{controlDisplay}</div>
                    <div className="flex items-center gap-1 pl-2">
                        {selectedOption && !isControlDisabled && (
                            <X
                                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                                onClick={handleClear}
                                aria-label="clear selection"
                            />
                        )}
                        <ChevronDown
                            className={`h-4 w-4 text-gray-500 transition-transform ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </div>
                </button>
                {isOpen &&
                    (usePortal && typeof document !== "undefined"
                        ? createPortal(menuContent, document.body)
                        : menuContent)}
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
});
