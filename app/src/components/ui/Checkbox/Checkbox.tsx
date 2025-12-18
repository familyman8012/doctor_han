import { cva, type VariantProps } from "class-variance-authority";
import React, { useId } from "react";
import { cn } from "@/components/utils";

const checkboxVariants = cva(
    "appearance-none bg-white bg-no-repeat bg-center bg-contain border rounded cursor-pointer transition-colors",
    {
        variants: {
            size: {
                xs: "w-3.5 h-3.5", // 14px - 컴팩트한 테이블/리스트용
                sm: "w-4 h-4", // 16px - 일반 폼 요소용 (기본값)
                md: "w-5 h-5", // 20px - 강조가 필요한 경우
            },
        },
        defaultVariants: {
            size: "sm",
        },
    },
);

const labelVariants = cva("flex cursor-pointer", {
    variants: {
        size: {
            xs: "text-xs", // 12px
            sm: "text-sm", // 14px
            md: "text-base", // 16px
        },
        hasSubText: {
            true: "",
            false: "items-center",
        },
    },
    defaultVariants: {
        size: "sm",
        hasSubText: false,
    },
});

export interface CheckboxProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type">,
        VariantProps<typeof checkboxVariants> {
    label?: string;
    subText?: string;
    size?: "xs" | "sm" | "md";
}

export const Checkbox: React.FC<CheckboxProps> = ({
    id,
    value,
    checked,
    onChange,
    size = "sm",
    readOnly,
    disabled,
    label,
    subText,
    className,
    ...props
}) => {
    // 고유 ID 자동 생성: id 미지정 시 React.useId() 사용
    const autoId = useId();
    const checkboxId = id ?? autoId;

    return (
        <label
            htmlFor={checkboxId}
            className={cn(
                labelVariants({ size, hasSubText: !!subText }),
                "group",
                disabled && "cursor-not-allowed opacity-50",
                className,
            )}
        >
            <input
                id={checkboxId}
                type="checkbox"
                value={value}
                checked={checked}
                onChange={onChange}
                readOnly={readOnly}
                disabled={disabled}
                className={cn(
                    checkboxVariants({ size }),
                    "border-gray-300",
                    "checked:border-[#62e3d5] checked:bg-[#62e3d5]",
                    "checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTAiIHZpZXdNb249IjAgMCAxMiAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgMS41TDQuNSA3LjY2NjY3TDEuNDE2NjcgNC41ODMzMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')]",
                    "focus:outline-none focus:ring-2 focus:ring-[#62e3d5] focus:ring-offset-2",
                    readOnly &&
                        "border-gray-300 bg-gray-50 pointer-events-none checked:bg-gray-300 checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTAiIHZpZXdOb249IjAgMCAxMiAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgMS41TDQuNSA3LjY2NjY3TDEuNDE2NjcgNC41ODMzMyIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=')]",
                    disabled &&
                        "border-gray-200 bg-gray-100 pointer-events-none checked:bg-gray-300 checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTAiIHZpZXdNb289IjAgMCAxMiAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgMS41TDQuNSA3LjY2NjY3TDEuNDE2NjcgNC41ODMzMyIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=')]",
                )}
                {...props}
            />
            {(label || subText) && (
                <span className="flex flex-col ml-2">
                    {label && (
                        <span
                            className={cn(
                                "font-medium text-[#0a3b41]",
                                size === "xs"
                                    ? "text-xs leading-4"
                                    : size === "sm"
                                      ? "text-sm leading-5"
                                      : "text-base leading-6",
                            )}
                        >
                            {label}
                        </span>
                    )}
                    {subText && (
                        <span
                            className={cn(
                                "font-normal text-gray-500",
                                size === "xs"
                                    ? "text-xs leading-4"
                                    : size === "sm"
                                      ? "text-sm leading-5"
                                      : "text-base leading-6",
                            )}
                        >
                            {subText}
                        </span>
                    )}
                </span>
            )}
        </label>
    );
};

Checkbox.displayName = "Checkbox";
