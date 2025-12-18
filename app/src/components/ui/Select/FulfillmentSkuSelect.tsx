"use client";

import { useMemo } from "react";
import { Select, type IOption } from "@/components/ui/Select/Select";
import type { FulfillmentSkuOption } from "@/hooks/rms/useFulfillmentSkuSource";

interface FulfillmentSkuSelectProps {
    options: FulfillmentSkuOption[];
    value?: string | null;
    onChange?: (value: string | null, option: FulfillmentSkuOption | null) => void;
    placeholder?: string;
    disabled?: boolean;
    isLoading?: boolean;
    isClearable?: boolean;
}

export function FulfillmentSkuSelect({
    options,
    value,
    onChange,
    placeholder = "SKU를 선택하세요",
    disabled = false,
    isLoading = false,
    isClearable = true,
}: FulfillmentSkuSelectProps) {
    const selectedOption = useMemo(() => {
        if (!value) return null;
        return options.find((opt) => opt.value === value) ?? null;
    }, [options, value]);

    const handleChange = (option: IOption | IOption[] | null) => {
        if (!onChange) return;
        if (!option || Array.isArray(option)) {
            onChange(null, null);
            return;
        }
        onChange(option.value as string, option as FulfillmentSkuOption);
    };

    return (
        <Select
            options={options}
            value={selectedOption as IOption | null}
            onChange={handleChange}
            placeholder={placeholder}
            isDisabled={disabled || isLoading}
            isLoading={isLoading}
            isClearable={isClearable}
            showDescriptionWhenSelected
            className="w-full"
            formatOptionLabel={(option) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#0a3b41]">{option.label}</span>
                    {option.description && (
                        <span className="text-xs text-[#5f6b6d]">{option.description}</span>
                    )}
                </div>
            )}
        />
    );
}
