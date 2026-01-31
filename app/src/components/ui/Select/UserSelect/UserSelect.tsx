"use client";

import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { employeeAdminApi } from "@/api-client/employee";
import { type IOption, Select } from "@/components/ui/Select/Select";
import { useSession } from "@/server/auth/client";
import type { EmployeeView } from "@/lib/schema/employee";

interface UserSelectProps {
    value?: string | null;
    onChange?: (value: string | null) => void;
    disabled?: boolean;
    placeholder?: string;
    size?: "xs" | "sm" | "md" | "lg";
    showCurrentUserFirst?: boolean;
    filterDeleted?: boolean;
    label?: string;
    error?: string;
    required?: boolean;
    className?: string;
    // value 타입 설정 - 백엔드 통일 전까지 임시로 두 타입 모두 지원
    valueType?: "userId" | "identityId"; // userId: user.id 사용, identityId: identity.identityId 사용 (기본값)
    usePortal?: boolean;
    filterEmployee?: (employee: EmployeeView) => boolean;
}

export function UserSelect({
    value,
    onChange,
    disabled = false,
    placeholder = "사용자를 선택하세요",
    size = "sm",
    showCurrentUserFirst = true,
    filterDeleted = true,
    label,
    error,
    required = false,
    className,
    valueType = "identityId", // 기본값은 identityId 사용
    usePortal = true,
    filterEmployee,
}: UserSelectProps) {
    const { data: session } = useSession();

    const [shouldFetch, setShouldFetch] = useState(Boolean(value));

    // value가 truthy로 변경되면 fetch 트리거 (렌더 중 상태 업데이트)
    if (value && !shouldFetch) {
        setShouldFetch(true);
    }

    // 활성 사용자 목록 조회 (지연 로딩)
    const { data: employeeResponse, isLoading } = useQuery({
        queryKey: ["employees", "all", { filterDeleted }],
        queryFn: ({ signal }) =>
            employeeAdminApi.getList(
                {
                    pageSize: 200,
                },
                { signal },
            ),
        enabled: shouldFetch,
        // 임직원 변동이 낮아 캐시를 길게 유지
        // - staleTime: Infinity → 한 번 받아오면 탭에서 재포커스/재마운트 시 재요청 안 함
        // - gcTime: 1일 → 미사용 시에도 일주일간 메모리 캐시 보존
        staleTime: Infinity,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });

    // 사용자 옵션 생성
    const userOptions = useMemo<IOption[]>(() => {
        if (!employeeResponse?.items) return [];

        let filteredItems = employeeResponse.items;

        // 삭제된 사용자 필터링
        if (filterDeleted) {
            filteredItems = filteredItems.filter((item) => !item.legacy.deleted);
        }

        if (filterEmployee) {
            filteredItems = filteredItems.filter(filterEmployee);
        }

        const options = filteredItems.reduce<IOption[]>((acc, employee) => {
            const legacy = employee.legacy;
            const name = legacy.name;
            const email = legacy.email;
            const image = legacy.image;

            // 이름에서 이니셜 추출
            const initials = name
                .split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

            const identityId = employee.identity?.identityId ?? undefined;
            const userId = employee.user?.id ?? undefined;

            const optionValue = valueType === "userId" ? userId : identityId;

            if (!optionValue) {
                return acc;
            }

            acc.push({
                value: optionValue,
                label: name,
                description: email,
                icon: image ? (
                    <img
                        src={image}
                        alt={name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                            // 이미지 로드 실패시 이니셜 표시
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                                parent.innerHTML = `<div class="flex h-8 w-8 items-center justify-center rounded-full bg-[#62e3d5]/20 text-sm font-semibold text-[#0a3b41]">${initials}</div>`;
                            }
                        }}
                    />
                ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#62e3d5]/20 text-sm font-semibold text-[#0a3b41]">
                        {initials}
                    </div>
                ),
            });

            return acc;
        }, []);

        // 현재 사용자를 최상단으로 정렬
        if (showCurrentUserFirst && session?.user?.email) {
            const currentUserIndex = options.findIndex((opt) => opt.description === session.user.email);
            if (currentUserIndex !== -1) {
                const currentUser = options[currentUserIndex];
                options.splice(currentUserIndex, 1);
                options.unshift(currentUser);
            }
        }

        return options;
    }, [employeeResponse, session, showCurrentUserFirst, filterDeleted, valueType, filterEmployee]);

    // 선택된 옵션 찾기
    const selectedOption = useMemo(() => {
        if (!value) return null;
        return userOptions.find((opt) => opt.value === value) || null;
    }, [value, userOptions]);

    return (
        <div className={className}>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}
            <Select
                options={userOptions}
                value={selectedOption}
                onChange={(option) => {
                    const newValue = option ? ((option as IOption).value as string) : null;
                    onChange?.(newValue);
                }}
                onMenuOpen={() => setShouldFetch(true)}
                placeholder={placeholder}
                isDisabled={disabled}
                isClearable
                size={size}
                showCheckmark
                isLoading={shouldFetch && isLoading}
                className={error ? "border-red-500" : ""}
                noOptionsMessage={({ inputValue }) =>
                    shouldFetch && isLoading ? "불러오는 중…" : inputValue ? "검색 결과가 없습니다" : "옵션이 없습니다"
                }
                usePortal={usePortal}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
