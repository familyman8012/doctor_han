"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { FaBuilding } from "react-icons/fa";
import type { DropdownIndicatorProps, FilterOptionOption, GroupBase, StylesConfig } from "react-select";
import { components } from "react-select";
import WindowedSelect from "react-windowed-select";
import { partnerAdminApi } from "@/api-client/partner";
import { type IOption } from "@/components/ui/Select/Select";

interface PartnerCodeSelectProps {
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

export function PartnerCodeSelect({
    value,
    onChange,
    disabled = false,
    placeholder = "파트너를 선택하세요",
    size = "sm",
    label,
    error,
    required = false,
    className,
    usePortal = true,
}: PartnerCodeSelectProps) {
    const instanceId = useId();

    const { data: partnerResponse, isLoading } = useQuery({
        queryKey: ["partnersAll"],
        queryFn: () =>
            partnerAdminApi.getList({
                orderBy: "legalName",
                orderDirection: "asc",
                pageSize: 5000,
            }),
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    const partnerOptions = useMemo<IOption[]>(() => {
        if (!partnerResponse?.items) return [];

        return partnerResponse.items.map((partner) => ({
            value: partner.partnerCode, // Use partnerCode as value
            label: partner.legalName,
            description: partner.partnerCode,
            icon: (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#62e3d5]/20">
                    <FaBuilding className="h-4 w-4 text-[#0a3b41]" />
                </div>
            ),
            data: partner,
        }));
    }, [partnerResponse]);

    const selectedOption = useMemo(() => {
        if (!value) return null;
        return partnerOptions.find((opt) => opt.value === value) || null;
    }, [value, partnerOptions]);

    const sizeHeights = {
        xs: "34px",
        sm: "38px",
        md: "40px",
        lg: "44px",
    };
    const computedHeight = sizeHeights[size] || "38px";

    const customStyles: StylesConfig<unknown, boolean, GroupBase<unknown>> = {
        control: (provided, state) => ({
            ...provided,
            width: "100%",
            minHeight: computedHeight,
            height: computedHeight,
            display: "flex",
            border:
                state.menuIsOpen || state.isFocused
                    ? "1px solid transparent !important"
                    : "1px solid #e5e7eb !important",
            boxShadow: state.menuIsOpen || state.isFocused ? "0 0 0 2px #62e3d5" : "none",
            borderRadius: "8px",
            backgroundColor: disabled || isLoading ? "#f9fafb" : "white",
            "&:hover": {
                borderColor: state.menuIsOpen || state.isFocused ? "transparent" : "#d1d5db",
            },
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: "2px 4px 2px 8px",
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
            zIndex: 140,
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            borderRadius: "8px",
        }),
        menuList: (provided) => ({
            ...provided,
            paddingTop: 0,
            paddingBottom: 0,
        }),
        menuPortal: (provided) => ({
            ...provided,
            zIndex: 1000002,
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: "14px",
            lineHeight: "20px",
            padding: "8px 12px",
            backgroundColor: state.isFocused ? "#f3f4f6" : state.isSelected ? "#62e3d5/10" : "transparent",
            color: state.isSelected ? "#0a3b41" : state.isFocused ? "#0a3b41" : "#374151",
            cursor: "pointer",
            "&:active": {
                backgroundColor: "#62e3d5/20",
            },
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
            fontSize: "14px",
        }),
        singleValue: (provided) => ({
            ...provided,
            fontSize: "14px",
            color: "#0a3b41",
        }),
        input: (provided) => ({
            ...provided,
            fontSize: "14px",
            color: "#0a3b41",
        }),
    };

    const menuPortalTarget = useMemo<HTMLElement | undefined>(() => {
        if (!usePortal || typeof window === "undefined") return undefined;
        return document.body;
    }, [usePortal]);

    const isMenuOpenRef = useRef(false);
    const [menuIsOpen, setMenuIsOpen] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        if (menuIsOpen === true) {
            const id = setTimeout(() => setMenuIsOpen(undefined), 0);
            return () => clearTimeout(id);
        }
    }, [menuIsOpen]);

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
        const label = (typeof option.label === "string" ? option.label : "").toLowerCase();
        const optionData = option.data as { description?: string } | undefined;
        const description = (optionData?.description || "").toLowerCase();
        return label.includes(search) || description.includes(search);
    };

    const handleInputChange = (inputValue: string, meta: { action: string }) => {
        if (meta.action === "input-change" && inputValue === "" && isMenuOpenRef.current) {
            setMenuIsOpen(false);
            setTimeout(() => setMenuIsOpen(true), 0);
        }
    };

    return (
        <div className={className}>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <WindowedSelect
                instanceId={instanceId}
                options={partnerOptions}
                value={selectedOption}
                onChange={(option: unknown) => {
                    const typedOption = option as IOption | null;
                    const newValue = typedOption ? (typedOption.value as string) : null;
                    onChange?.(newValue);
                }}
                placeholder={placeholder}
                isDisabled={disabled || isLoading}
                isClearable
                isSearchable
                styles={customStyles}
                menuPortalTarget={menuPortalTarget}
                menuPosition={usePortal ? "fixed" : "absolute"}
                menuIsOpen={menuIsOpen}
                onMenuOpen={() => {
                    isMenuOpenRef.current = true;
                }}
                onMenuClose={() => {
                    isMenuOpenRef.current = false;
                }}
                components={{
                    DropdownIndicator,
                }}
                filterOption={customFilterOption}
                onInputChange={handleInputChange}
                formatOptionLabel={(option: unknown, { context }: { context: "menu" | "value" }) => {
                    const typedOption = option as IOption;
                    return (
                        <div className="flex items-center gap-2">
                            {typedOption.icon && <div className="flex-shrink-0">{typedOption.icon}</div>}
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{typedOption.label}</span>
                                {context === "menu" && typedOption.description && (
                                    <span className="text-xs text-gray-500 truncate">• {typedOption.description}</span>
                                )}
                            </div>
                        </div>
                    );
                }}
                windowThreshold={100}
                classNamePrefix="react-select"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
