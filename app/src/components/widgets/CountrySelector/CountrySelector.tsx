"use client";

import { useId, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import type {
    DropdownIndicatorProps,
    FilterOptionOption,
    FormatOptionLabelMeta,
    GroupBase,
    StylesConfig,
} from "react-select";
import { components } from "react-select";
import WindowedSelect from "react-windowed-select";
import { useCountries } from "@/hooks/useCountries";
import type { CountryOption } from "@/lib/utils/country-options";
import { COUNTRY_CODE_REGEX } from "@/lib/utils/country-options";
import { cn } from "@/components/utils";

interface CountrySelectorProps {
    value?: string | null;
    onChange?: (code: string | null) => void;
    placeholder?: string;
    disabled?: boolean;
    size?: "xs" | "sm" | "md" | "lg";
    label?: string;
    required?: boolean;
    error?: string;
    className?: string;
    usePortal?: boolean;
}

type CountrySelectOption = {
    value: string;
    label: string;
    description?: string;
    keywords: string;
    data: CountryOption;
};

const sizeHeights: Record<NonNullable<CountrySelectorProps["size"]>, string> = {
    xs: "34px",
    sm: "38px",
    md: "40px",
    lg: "44px",
};

export function CountrySelector({
    value,
    onChange,
    placeholder = "국가 코드 또는 이름 검색",
    disabled = false,
    size = "sm",
    label,
    required = false,
    error,
    className,
    usePortal = true,
}: CountrySelectorProps) {
    const instanceId = useId();
    const { data, isLoading } = useCountries();

    const options = useMemo<CountrySelectOption[]>(() => {
        if (!data?.options) return [];
        return data.options.map((country) => ({
            value: country.code,
            label: country.commonName,
            description: country.officialName,
            keywords: country.keywords,
            data: country,
        }));
    }, [data?.options]);

    const selectedOption = useMemo(() => {
        if (!value) return null;
        return options.find((option) => option.value === value.toUpperCase()) ?? null;
    }, [options, value]);

    const customStyles: StylesConfig<unknown, boolean, GroupBase<unknown>> = {
        control: (provided, state) => ({
            ...provided,
            minHeight: sizeHeights[size] ?? "38px",
            height: selectedOption?.description ? "auto" : sizeHeights[size] ?? "38px",
            borderRadius: "8px",
            border:
                state.menuIsOpen || state.isFocused
                    ? "1px solid transparent !important"
                    : "1px solid #e5e7eb !important",
            boxShadow: state.menuIsOpen || state.isFocused ? "0 0 0 2px #62e3d5" : "none",
            backgroundColor: disabled ? "#f9fafb" : "white",
            "&:hover": {
                borderColor: state.menuIsOpen || state.isFocused ? "transparent" : "#d1d5db",
            },
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: selectedOption?.description ? "6px 8px" : "2px 8px",
        }),
        dropdownIndicator: (provided, state) => ({
            ...provided,
            padding: state.selectProps.menuIsOpen ? "8px 0 8px 8px" : "8px 8px 8px 0",
            transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : undefined,
            transition: "transform 0.2s",
        }),
        indicatorSeparator: () => ({
            display: "none",
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 160,
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            borderRadius: "8px",
        }),
        menuList: (provided) => ({
            ...provided,
            paddingTop: 0,
            paddingBottom: 0,
        }),
        option: (provided, state) => ({
            ...provided,
            padding: "8px 12px",
            backgroundColor: state.isFocused ? "#f3f4f6" : state.isSelected ? "#ecfdf7" : "white",
            color: "#0a3b41",
        }),
        placeholder: (provided) => ({
            ...provided,
            fontSize: "14px",
            color: "#9ca3af",
        }),
        singleValue: (provided) => ({
            ...provided,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
        }),
    };

    const menuPortalTarget = useMemo<HTMLElement | undefined>(() => {
        if (!usePortal || typeof window === "undefined") return undefined;
        return document.body;
    }, [usePortal]);

    const DropdownIndicator = (props: DropdownIndicatorProps<unknown, boolean, GroupBase<unknown>>) => {
        return (
            <components.DropdownIndicator {...props}>
                <ChevronDown className="h-4 w-4 text-gray-500" />
            </components.DropdownIndicator>
        );
    };

    const customFilterOption = (option: FilterOptionOption<unknown>, searchText: string) => {
        if (!searchText) return true;
        const search = searchText.toLowerCase();
        const typedOption = option as FilterOptionOption<CountrySelectOption>;
        const keywords = typedOption.data?.keywords ?? "";
        return keywords.includes(search);
    };

    const formatOptionLabel = (option: unknown, meta: FormatOptionLabelMeta<unknown>) => {
        const { context } = meta;
        const typedOption = option as CountrySelectOption;
        return (
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#5f6b6d]">[{typedOption.value}]</span>
                    <span className="text-sm text-[#0a3b41]">{typedOption.label}</span>
                </div>
                {context === "menu" && typedOption.description && (
                    <span className="text-xs text-[#7a8587]">{typedOption.description}</span>
                )}
            </div>
        );
    };

    return (
        <div className={cn("w-full text-left", className)}>
            {label && (
                <label className="mb-1 block text-xs font-semibold text-[#0a3b41]">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <WindowedSelect
                instanceId={instanceId}
                isDisabled={disabled || isLoading}
                options={options}
                value={selectedOption}
                placeholder={placeholder}
                onChange={(option) => {
                    if (!onChange) return;
                    const typed = option as CountrySelectOption | null;
                    const code = typed ? typed.value : null;
                    onChange(code ? code.toUpperCase() : null);
                }}
                onBlur={() => {
                    if (value && !COUNTRY_CODE_REGEX.test(value)) {
                        onChange?.(null);
                    }
                }}
                styles={customStyles}
                components={{
                    DropdownIndicator,
                    IndicatorSeparator: () => null,
                }}
                formatOptionLabel={formatOptionLabel}
                filterOption={customFilterOption}
                isClearable
                isSearchable
                menuPortalTarget={menuPortalTarget}
                menuPlacement="auto"
                windowThreshold={100}
                classNamePrefix="react-select"
                noOptionsMessage={({ inputValue }) =>
                    inputValue ? "일치하는 국가가 없습니다." : "검색어를 입력하세요."
                }
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
