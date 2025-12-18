"use client";

import React from "react";
import { Select, type IOption } from "@/components/ui/Select/Select";

const CURRENCY_OPTIONS: IOption[] = [
    { value: "KRW", label: "KRW" },
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
];

interface CurrencySelectProps {
    value?: string | null;
    onChange?: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    size?: "xs" | "sm" | "md" | "lg";
    label?: string;
    error?: string;
    required?: boolean;
    className?: string;
}

export function CurrencySelect({
    value,
    onChange,
    disabled = false,
    placeholder = "통화 선택",
    size = "sm",
    label,
    error,
    required = false,
    className,
}: CurrencySelectProps) {
    const selectedOption = CURRENCY_OPTIONS.find((opt) => opt.value === value) ?? null;

    return (
        <div className={className}>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-[#0a3b41]">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <Select
                options={CURRENCY_OPTIONS}
                value={selectedOption}
                onChange={(option) => {
                    const newValue = option ? ((option as IOption).value as string) : "KRW";
                    onChange?.(newValue);
                }}
                placeholder={placeholder}
                isDisabled={disabled}
                size={size}
                className={error ? "border-red-500" : ""}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
