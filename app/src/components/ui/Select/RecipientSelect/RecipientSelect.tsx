"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaUser } from "react-icons/fa";
import { Select, type IOption } from "@/components/ui/Select/Select";
import { recipientApi } from "@/api-client/recipient";

interface RecipientSelectProps {
    value?: string | null;
    onChange?: (value: string | null) => void;
    disabled?: boolean;
    placeholder?: string;
    size?: "xs" | "sm" | "md" | "lg";
    label?: string;
    error?: string;
    required?: boolean;
    className?: string;
}

export function RecipientSelect({
    value,
    onChange,
    disabled = false,
    placeholder = "수령인을 선택하세요",
    size = "sm",
    label,
    error,
    required = false,
    className,
}: RecipientSelectProps) {
    const { data: recipientResponse, isLoading } = useQuery({
        queryKey: ["recipients"],
        queryFn: () =>
            recipientApi.getList({
                orderBy: "name",
                orderDirection: "asc",
                pageSize: 100,
            }),
    });

    const recipientOptions = useMemo<IOption[]>(() => {
        if (!recipientResponse?.items) return [];

        return recipientResponse.items.map((recipient) => ({
            value: recipient.id,
            label: recipient.name,
            description: recipient.address,
            icon: (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#62e3d5]/20">
                    <FaUser className="w-4 h-4 text-[#0a3b41]" />
                </div>
            ),
        }));
    }, [recipientResponse]);

    const selectedOption = useMemo(() => {
        if (!value) return null;
        return recipientOptions.find((opt) => opt.value === value) || null;
    }, [value, recipientOptions]);

    return (
        <div className={className}>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <Select
                options={recipientOptions}
                value={selectedOption}
                onChange={(option) => {
                    const newValue = option ? ((option as IOption).value as string) : null;
                    onChange?.(newValue);
                }}
                placeholder={placeholder}
                isDisabled={disabled || isLoading}
                isClearable
                isSearchable
                size={size}
                showCheckmark
                className={error ? "border-red-500" : ""}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}