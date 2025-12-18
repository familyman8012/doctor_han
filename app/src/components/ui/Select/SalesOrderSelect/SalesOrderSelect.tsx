"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { format } from "date-fns";

import { salesOrderApi } from "@/api-client/sales-order";
import { Select, type IOption } from "@/components/ui/Select/Select";
import { useDebounce } from "@/hooks/agent-ncos/use-debounce";
import type { SalesOrderListQuery, SalesOrderDetail } from "@/lib/schema/sales-order";

interface SalesOrderSelectProps {
    value?: string | null;
    onChange?: (value: string | null) => void;
    disabled?: boolean;
    placeholder?: string;
    size?: "xs" | "sm" | "md" | "lg";
    label?: string;
    error?: string;
    required?: boolean;
    className?: string;
    usePortal?: boolean;
}

type SalesOrderOption = IOption & { data?: any };

const DEFAULT_PAGE_SIZE = 50;

export function SalesOrderSelect({
    value,
    onChange,
    disabled = false,
    placeholder = "주문을 선택하세요",
    size = "sm",
    label,
    error,
    required = false,
    className,
    usePortal = true,
}: SalesOrderSelectProps) {
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounce(searchInput, 300).trim();

    const baseQueryParams = useMemo(() => {
        return {
            pageSize: DEFAULT_PAGE_SIZE,
            sortKey: "orderPlacedAt",
            sortOrder: "desc",
        } satisfies Partial<SalesOrderListQuery>;
    }, []);

    const searchFilters = useMemo(() => {
        if (!debouncedSearch) return {};
        return { orderNumber: debouncedSearch };
    }, [debouncedSearch]);

    const {
        data,
        isLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["salesOrders", "select", baseQueryParams, searchFilters],
        initialPageParam: 1,
        queryFn: ({ pageParam = 1, signal }) =>
            salesOrderApi.getList(
                {
                    ...baseQueryParams,
                    ...searchFilters,
                    page: pageParam,
                },
                { signal },
            ),
        getNextPageParam: (lastPage, pages) => {
            const loaded = pages.reduce((sum, page) => sum + page.items.length, 0);
            return loaded < lastPage.total ? pages.length + 1 : undefined;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const listItems = useMemo(() => {
        if (!data?.pages) return [];
        const seen = new Map<string, any>();
        data.pages.forEach((page) => {
            page.items.forEach((item) => {
                seen.set(item.id, item);
            });
        });
        return Array.from(seen.values());
    }, [data?.pages]);

    const listOptions = useMemo<SalesOrderOption[]>(() => {
        return listItems.map((order) => ({
            value: order.id,
            label: order.orderNumber,
            description: `${order.sourceType} | ${format(new Date(order.orderPlacedAt), "yyyy-MM-dd")}`,
            icon: (
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
                    <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                </div>
            ),
            data: order,
        }));
    }, [listItems]);

    const shouldFetchSelectedDetail = Boolean(
        value && !listOptions.some((option) => option.value === value),
    );

    const { data: selectedDetail, isLoading: selectedDetailLoading } = useQuery({
        queryKey: ["salesOrders", "select", "detail", value],
        queryFn: () => salesOrderApi.getById(value as string),
        enabled: shouldFetchSelectedDetail,
        staleTime: 1000 * 60 * 5,
    });

    const fallbackOption = useMemo<SalesOrderOption | null>(() => {
        if (!selectedDetail) return null;
        return {
            value: selectedDetail.header.id,
            label: selectedDetail.header.orderNumber,
            description: `${selectedDetail.header.sourceType} | ${format(new Date(selectedDetail.header.orderPlacedAt), "yyyy-MM-dd")}`,
            icon: (
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
                    <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
                </div>
            ),
            data: selectedDetail,
        };
    }, [selectedDetail]);

    const optionMap = useMemo(() => {
        const map = new Map<string, SalesOrderOption>();
        listOptions.forEach((option) => {
            map.set(String(option.value), option);
        });
        if (fallbackOption) {
            map.set(String(fallbackOption.value), fallbackOption);
        }
        return map;
    }, [listOptions, fallbackOption]);

    const combinedOptions = useMemo(() => Array.from(optionMap.values()), [optionMap]);

    const selected = useMemo(() => {
        if (!value) return null;
        const found = optionMap.get(value);
        return found ?? null;
    }, [optionMap, value]);

    const loading = isLoading || isFetchingNextPage || (shouldFetchSelectedDetail && selectedDetailLoading);

    return (
        <div className={className}>
            {label ? (
                <label className="mb-1.5 block text-sm font-medium text-[#0a3b41]">
                    {label}
                    {required ? <span className="ml-0.5 text-red-500">*</span> : null}
                </label>
            ) : null}
            <Select
                options={combinedOptions}
                value={selected}
                onChange={(option) => {
                    const cast = option as SalesOrderOption | null;
                    onChange?.(cast ? String(cast.value) : null);
                }}
                onInputChange={setSearchInput}
                onMenuScrollToBottom={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                        void fetchNextPage();
                    }
                }}
                placeholder={loading && combinedOptions.length === 0 ? "로딩 중..." : placeholder}
                isDisabled={disabled}
                isClearable
                isSearchable
                size={size}
                showCheckmark
                showDescriptionWhenSelected
                className={error ? "border border-red-400" : undefined}
                isLoading={loading}
                noOptionsMessage={({ inputValue }) =>
                    loading
                        ? "불러오는 중..."
                        : inputValue?.length
                          ? "검색 결과가 없습니다."
                          : "주문이 없습니다."
                }
            />
            {error ? <p className="mt-1.5 text-sm text-red-500">{error}</p> : null}
        </div>
    );
}
