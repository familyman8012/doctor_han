"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";

import { listAdminOrgUnits } from "@/api-client/admin/org-units";
import { OrgUnitTypeSchema } from "@/lib/schema/org/directory";
import { Select, type IOption } from "./Select";

type OrgUnitType = z.infer<typeof OrgUnitTypeSchema>;

interface OrgUnitPathSelectProps {
    value: string | null;
    onChange: (value: string | null) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    allowedUnitTypes?: OrgUnitType[];
}

export function OrgUnitPathSelect({
    value,
    onChange,
    label,
    placeholder = "조직 경로를 검색하세요",
    required = false,
    disabled = false,
    className,
    allowedUnitTypes = ["DEPARTMENT", "TEAM", "SQUAD"],
}: OrgUnitPathSelectProps) {
    const [search, setSearch] = useState("");
    const [opened, setOpened] = useState(false);

    const queryUnitType: OrgUnitType | undefined =
        allowedUnitTypes && allowedUnitTypes.length === 1 ? allowedUnitTypes[0] : undefined;

    const { data, isLoading } = useQuery({
        queryKey: ["org-unit-path-select", { search }],
        enabled: opened || Boolean(value),
        queryFn: ({ signal }) =>
            listAdminOrgUnits(
                {
                    search: search || undefined,
                    unitType: queryUnitType,
                },
                { signal },
            ),
        staleTime: 1000 * 60 * 5,
    });

    const options = useMemo<IOption[]>(() => {
        const items = data?.items ?? [];
        const filtered = allowedUnitTypes
            ? items.filter((unit) => allowedUnitTypes.includes(unit.unitType as OrgUnitType))
            : items;
        return filtered.map((unit) => ({
            value: unit.path,
            label: unit.breadcrumb,
            description: unit.path,
        }));
    }, [allowedUnitTypes, data?.items]);

    const selected = useMemo(() => {
        if (!value) return null;
        return options.find((opt) => opt.value === value) ?? {
            value,
            label: value,
            description: value,
        };
    }, [options, value]);

    return (
        <div className={className}>
            {label ? (
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            ) : null}
            <Select
                options={options}
                value={selected}
                onChange={(option) => {
                    const newValue = option ? ((option as IOption).value as string) : null;
                    onChange(newValue);
                }}
                onMenuOpen={() => setOpened(true)}
                onMenuClose={() => setOpened(false)}
                onInputChange={(value) => setSearch(value)}
                placeholder={placeholder}
                isDisabled={disabled}
                isClearable
                isSearchable
                showCheckmark
                isLoading={isLoading}
                usePortal={false}
                noOptionsMessage={({ inputValue }) =>
                    isLoading ? "불러오는 중…" : inputValue ? "검색 결과가 없습니다" : "옵션이 없습니다"
                }
                showDescriptionWhenSelected
            />
        </div>
    );
}
