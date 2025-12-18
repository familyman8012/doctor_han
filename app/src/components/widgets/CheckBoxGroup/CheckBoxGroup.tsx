"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/components/utils";
import { CheckBoxGroupProvider, useCheckBoxGroup } from "./CheckBoxGroupContext";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";

export interface CheckBoxGroupOption {
    value: string;
    label: string;
    subText?: string;
}

export interface CheckBoxGroupProps {
    children?: ReactNode;
    options?: CheckBoxGroupOption[];
    initialCheckedValues?: string[];
    onChange?: (values: string[]) => void;
    allCheckHandler?: { value: string; label: string }[];
    disabled?: boolean;
    size?: "sm" | "md";
    className?: string;
    direction?: "horizontal" | "vertical";
    showAllCheckBox?: boolean;
}

// 통합된 CheckBoxGroup 컴포넌트 (Context API 기반)
export const CheckBoxGroup: React.FC<CheckBoxGroupProps> = ({
    children,
    options,
    initialCheckedValues,
    onChange,
    allCheckHandler,
    disabled,
    size,
    className,
    direction = "vertical",
    showAllCheckBox = false,
}) => {
    return (
        <CheckBoxGroupProvider
            initialCheckedValues={initialCheckedValues}
            onChange={onChange}
            allCheckHandler={allCheckHandler || options}
            disabled={disabled}
            size={size}
        >
            {options ? (
                // Options 모드: 자동으로 체크박스 생성
                <div
                    className={cn(
                        "flex gap-3",
                        direction === "vertical" ? "flex-col" : "flex-row flex-wrap",
                        className,
                    )}
                >
                    {/* allCheckHandler가 있으면 자동으로 전체 선택 표시, 또는 showAllCheckBox가 true일 때 */}
                    {(allCheckHandler || showAllCheckBox) && <AllCheckBox label="전체 선택" />}
                    {options.map((option) => (
                        <ConnectedCheckBox
                            key={option.value}
                            value={option.value}
                            label={option.label}
                            subText={option.subText}
                        />
                    ))}
                </div>
            ) : (
                // Children 모드: 자유로운 레이아웃
                <div className={className}>{children}</div>
            )}
        </CheckBoxGroupProvider>
    );
};

// Context와 연결된 Checkbox 컴포넌트
interface ConnectedCheckBoxProps {
    value: string;
    label?: string;
    subText?: string;
    className?: string;
}

export const ConnectedCheckBox: React.FC<ConnectedCheckBoxProps> = ({ value, label, subText, className }) => {
    const { values, handleChange, disabled, size } = useCheckBoxGroup();

    return (
        <Checkbox
            value={value}
            checked={values[value] || false}
            onChange={(e) => handleChange(value, (e.target as HTMLInputElement).checked)}
            disabled={disabled}
            size={size}
            label={label}
            subText={subText}
            className={className}
        />
    );
};

// 전체 선택 체크박스
export const AllCheckBox: React.FC<{ label?: string; className?: string }> = ({ label = "전체 선택", className }) => {
    const { isAllSelected, isIndeterminate, handleAllChange, disabled, size } = useCheckBoxGroup();

    // indeterminate 상태를 위한 ref 사용
    const checkboxRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    return (
        <div className={className}>
            <label className="flex items-center cursor-pointer">
                <input
                    ref={checkboxRef}
                    type="checkbox"
                    checked={isAllSelected || isIndeterminate}
                    onChange={(e) => {
                        // indeterminate 상태에서 클릭하면 전체 해제
                        if (isIndeterminate) {
                            handleAllChange(false);
                        } else {
                            handleAllChange(e.target.checked);
                        }
                    }}
                    disabled={disabled}
                    className={cn(
                        "appearance-none bg-white bg-no-repeat bg-center bg-contain border rounded cursor-pointer transition-colors",
                        size === "sm" ? "w-4 h-4" : "w-6 h-6",
                        "border-gray-300",
                        "checked:border-[#62e3d5] checked:bg-[#62e3d5]",
                        !isIndeterminate &&
                            "checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMiAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgMS41TDQuNSA3LjY2NjY3TDEuNDE2NjcgNC41ODMzMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]",
                        "focus:outline-none focus:ring-0 focus:shadow-[0_0_0_2px_#62e3d5]",
                        disabled && "border-gray-200 bg-gray-50 pointer-events-none",
                    )}
                    style={{
                        ...(isIndeterminate && {
                            backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMiIgdmlld0JveD0iMCAwIDEyIDIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMiIgaGVpZ2h0PSIyIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=")`,
                            backgroundColor: "#62e3d5",
                            borderColor: "#62e3d5",
                        }),
                    }}
                />
                {label && (
                    <span
                        className={cn(
                            "ml-2 font-medium text-neutral-10",
                            size === "sm" ? "text-sm leading-5" : "text-base leading-6",
                            disabled && "opacity-50",
                        )}
                    >
                        {label}
                    </span>
                )}
            </label>
        </div>
    );
};

CheckBoxGroup.displayName = "CheckBoxGroup";
