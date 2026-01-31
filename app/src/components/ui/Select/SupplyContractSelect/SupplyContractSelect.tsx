"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Handshake } from "lucide-react";

import { supplyContractApi } from "@/api-client/supply-contract";
import { Select, type IOption } from "@/components/ui/Select/Select";
import type { SupplyContractDetailView, SupplyContractListQuery, SupplyContractSummary } from "@/lib/schema/supply-contract";
import { useDebounce } from "@/hooks/agent-ncos/use-debounce";

interface SupplyContractSelectProps {
    value?: string | null;
    onChange?: (value: string | null, contractData?: unknown) => void;
    disabled?: boolean;
    placeholder?: string;
    size?: "xs" | "sm" | "md" | "lg";
    label?: string;
    error?: string;
    required?: boolean;
    className?: string;
    queryParams?: Partial<SupplyContractListQuery>;
}

type SupplyContractOption = IOption & { data?: SupplyContractSummary | SupplyContractDetailView };

const DEFAULT_PAGE_SIZE = 30;

export function SupplyContractSelect({
    value,
    onChange,
    disabled,
    placeholder = "공급계약 선택",
    size = "sm",
    label,
    error,
    required,
    className,
    queryParams,
}: SupplyContractSelectProps) {
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounce(searchInput, 300).trim();

    const baseQueryParams = useMemo(() => {
        const merged = {
            includeInvalid: false,
            orderDirection: "desc" as SupplyContractListQuery["orderDirection"],
            orderBy: (queryParams?.orderBy ?? "createdAt") as SupplyContractListQuery["orderBy"],
            pageSize: Math.min(queryParams?.pageSize ?? DEFAULT_PAGE_SIZE, 100),
            ...queryParams,
        } satisfies Partial<SupplyContractListQuery>;
        return merged;
    }, [queryParams]);

    const searchFilters = useMemo(() => {
        if (!debouncedSearch) return {} as Pick<SupplyContractListQuery, "contractNo" | "name">;
        const normalized = debouncedSearch.trim();
        const contractNoPattern = /^\d{8}[A-Za-z]\d{4}$/;
        if (contractNoPattern.test(normalized)) {
            return { contractNo: normalized.toUpperCase(), name: undefined };
        }
        return { contractNo: undefined, name: normalized };
    }, [debouncedSearch]);

    const {
        data,
        isLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["supplyContracts", "select", baseQueryParams, searchFilters],
        initialPageParam: 1,
        queryFn: ({ pageParam = 1, signal }) =>
            supplyContractApi.getList(
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
        staleTime: 5 * 60 * 1000,
    });

    const listItems = useMemo(() => {
        if (!data?.pages) return [] as SupplyContractSummary[];
        const seen = new Map<string, SupplyContractSummary>();
        data.pages.forEach((page) => {
            page.items.forEach((item) => {
                seen.set(item.id, item);
            });
        });
        return Array.from(seen.values());
    }, [data]);

    const listOptions = useMemo<SupplyContractOption[]>(() => {
        return listItems.map((contract) => ({
            value: contract.id,
            label: contract.name,
            description: contract.contractNo ? `계약번호 ${contract.contractNo}` : undefined,
            icon: (
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[#62e3d5]/20">
                    <Handshake className="h-3.5 w-3.5 text-[#0a3b41]" />
                </div>
            ),
            status: contract.status,
            data: contract,
        }));
    }, [listItems]);

    const shouldFetchSelectedDetail = Boolean(
        value && !listOptions.some((option) => option.value === value),
    );

    const { data: selectedDetail, isLoading: selectedDetailLoading } = useQuery({
        queryKey: ["supplyContracts", "select", "detail", value],
        queryFn: () => supplyContractApi.getById(value as string),
        enabled: shouldFetchSelectedDetail,
        staleTime: 5 * 60 * 1000,
    });

    const fallbackOption = useMemo<SupplyContractOption | null>(() => {
        if (!selectedDetail) return null;
        return {
            value: selectedDetail.id,
            label: selectedDetail.name,
            description: selectedDetail.contractNo ? `계약번호 ${selectedDetail.contractNo}` : undefined,
            icon: (
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[#62e3d5]/20">
                    <Handshake className="h-3.5 w-3.5 text-[#0a3b41]" />
                </div>
            ),
            status: selectedDetail.status,
            data: selectedDetail,
        } satisfies SupplyContractOption;
    }, [selectedDetail]);

    const optionMap = useMemo(() => {
        const map = new Map<string, SupplyContractOption>();
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
                    const cast = option as SupplyContractOption | null;
                    onChange?.(cast ? String(cast.value) : null, cast?.data);
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
                          : "공급계약이 없습니다."
                }
            />
            {error ? <p className="mt-1.5 text-sm text-red-500">{error}</p> : null}
        </div>
    );
}
