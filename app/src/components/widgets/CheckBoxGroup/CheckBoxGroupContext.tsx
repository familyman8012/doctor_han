"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";

interface CheckBoxGroupContextType {
    values: { [key: string]: boolean };
    handleChange: (value: string, checked: boolean) => void;
    isAllSelected: boolean;
    isIndeterminate: boolean;
    handleAllChange: (checked: boolean) => void;
    allOptions?: { value: string; label: string }[];
    disabled?: boolean;
    size?: "sm" | "md";
}

const CheckBoxGroupContext = createContext<CheckBoxGroupContextType | undefined>(undefined);

export const useCheckBoxGroup = () => {
    const context = useContext(CheckBoxGroupContext);
    if (!context) {
        throw new Error("useCheckBoxGroup must be used within CheckBoxGroupProvider");
    }
    return context;
};

interface CheckBoxGroupProviderProps {
    children: ReactNode;
    initialCheckedValues?: string[];
    onChange?: (values: string[]) => void;
    allCheckHandler?: { value: string; label: string }[];
    disabled?: boolean;
    size?: "sm" | "md";
}

export const CheckBoxGroupProvider: React.FC<CheckBoxGroupProviderProps> = ({
    children,
    initialCheckedValues = [],
    onChange,
    allCheckHandler,
    disabled = false,
    size = "sm",
}) => {
    const [values, setValues] = useState<{ [key: string]: boolean }>(
        initialCheckedValues.reduce((acc: { [key: string]: boolean }, curr) => {
            acc[curr] = true;
            return acc;
        }, {}),
    );

    // onChange를 ref로 저장하여 dependency 문제 해결
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const isAllSelected = allCheckHandler
        ? allCheckHandler.every(({ value }) => values[value]) && allCheckHandler.length > 0
        : false;

    const isIndeterminate = allCheckHandler
        ? allCheckHandler.some(({ value }) => values[value]) && !allCheckHandler.every(({ value }) => values[value])
        : false;

    const handleChange = (value: string, checked: boolean) => {
        setValues((prev) => ({
            ...prev,
            [value]: checked,
        }));
    };

    const handleAllChange = (checked: boolean) => {
        if (!allCheckHandler) return;

        const newValues = { ...values };
        allCheckHandler.forEach(({ value }) => {
            newValues[value] = checked;
        });
        setValues(newValues);
    };

    useEffect(() => {
        if (onChangeRef.current) {
            onChangeRef.current(Object.keys(values).filter((key) => values[key]));
        }
    }, [values]);

    const contextValue: CheckBoxGroupContextType = {
        values,
        handleChange,
        isAllSelected,
        isIndeterminate,
        handleAllChange,
        allOptions: allCheckHandler,
        disabled,
        size,
    };

    return <CheckBoxGroupContext.Provider value={contextValue}>{children}</CheckBoxGroupContext.Provider>;
};

// Context를 사용하는 CheckBox 컴포넌트
interface ContextCheckBoxProps {
    value: string;
    label?: string;
    className?: string;
}

export const ContextCheckBox: React.FC<ContextCheckBoxProps> = ({ value, label, className }) => {
    const { values, handleChange, disabled, size } = useCheckBoxGroup();

    return (
        <label className={className}>
            <input
                type="checkbox"
                value={value}
                checked={values[value] || false}
                onChange={(e) => handleChange(value, e.target.checked)}
                disabled={disabled}
                className={`
          appearance-none bg-white bg-no-repeat bg-center bg-contain border rounded cursor-pointer transition-colors
          ${size === "sm" ? "w-4 h-4" : "w-6 h-6"}
          border-input-checkbox-border
          checked:border-input-checkbox-checked-border checked:bg-bg-input-checkbox
          checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTAiIHZpZXdOb249IjAgMCAxMiAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgMS41TDQuNSA3LjY2NjY3TDEuNDE2NjcgNC41ODMzMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]
          focus:outline-none focus:ring-0 focus:shadow-[0_0_0_2px_#62e3d5]
          disabled:border-input-checkbox-disabled-border disabled:bg-bg-input-checkbox-disabled disabled:pointer-events-none
        `}
            />
            {label && <span className="ml-2">{label}</span>}
        </label>
    );
};

// 전체 선택 CheckBox
export const ContextAllCheckBox: React.FC<{ label?: string; className?: string }> = ({
    label = "전체 선택",
    className,
}) => {
    const { isAllSelected, isIndeterminate, handleAllChange, disabled, size } = useCheckBoxGroup();

    return (
        <label className={className}>
            <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => handleAllChange(e.target.checked)}
                disabled={disabled}
                ref={(input) => {
                    if (input) {
                        input.indeterminate = isIndeterminate;
                    }
                }}
                className={`
          appearance-none bg-white bg-no-repeat bg-center bg-contain border rounded cursor-pointer transition-colors
          ${size === "sm" ? "w-4 h-4" : "w-6 h-6"}
          border-input-checkbox-border
          checked:border-input-checkbox-checked-border checked:bg-bg-input-checkbox
          checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMiAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgMS41TDQuNSA3LjY2NjY3TDEuNDE2NjcgNC41ODMzMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]
          indeterminate:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMiIgdmlld0JveD0iMCAwIDEyIDIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMiIgaGVpZ2h0PSIyIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=')]
          indeterminate:border-input-checkbox-checked-border indeterminate:bg-bg-input-checkbox
          focus:outline-none focus:ring-0 focus:shadow-[0_0_0_2px_#62e3d5]
          disabled:border-input-checkbox-disabled-border disabled:bg-bg-input-checkbox-disabled disabled:pointer-events-none
        `}
            />
            {label && <span className="ml-2">{label}</span>}
        </label>
    );
};
