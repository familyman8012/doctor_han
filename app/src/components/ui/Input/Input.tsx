import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { forwardRef } from "react";
import { cn } from "@/components/utils";

const inputVariants = cva(
    "w-full px-3 text-sm text-[#0a3b41] border bg-white rounded-lg transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#62e3d5] disabled:bg-gray-50 disabled:cursor-not-allowed",
    {
        variants: {
            variant: {
                default: "border-gray-200",
                error: "border-red-300 focus:ring-red-500",
            },
            size: {
                xs: "h-[34px] py-1.5 text-sm", // 리스트 페이지용 - text-sm으로 변경
                sm: "h-[38px] py-2 text-sm", // 상세 페이지용 (기본)
                md: "h-10 py-2.5 text-sm",
                lg: "h-11 py-3 text-base",
            },
            hasLeadingIcon: {
                true: "pl-9",
                false: "",
            },
            hasTrailingIcon: {
                true: "pr-9",
                false: "",
            },
            hasLeadingText: {
                true: "rounded-l-none",
                false: "",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "sm",
            hasLeadingIcon: false,
            hasTrailingIcon: false,
            hasLeadingText: false,
        },
    },
);

export interface InputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
        VariantProps<typeof inputVariants> {
    fullWidth?: boolean;
    label?: React.ReactNode;
    description?: string;
    required?: boolean;
    leadingText?: string;
    error?: string;
    helperText?: string;
    size?: "xs" | "sm" | "md" | "lg";
    LeadingIcon?: React.ReactElement<React.SVGProps<SVGSVGElement>>;
    TrailingIcon?: React.ReactElement<React.SVGProps<SVGSVGElement>>;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            fullWidth,
            className,
            type = "text",
            label,
            description,
            required,
            leadingText,
            error,
            helperText,
            size = "sm",
            LeadingIcon,
            TrailingIcon,
            disabled,
            id,
            ...props
        },
        ref,
    ) => {
        const inputId = id || props.name;
        const Leading = LeadingIcon?.type;
        const Trailing = TrailingIcon?.type;

        // React 경고 방지:
        // 부모가 value 프로퍼티를 한 번이라도 넘기면, 항상 "controlled"로 취급하고
        // 초기 undefined → 이후 문자열로 바뀌면서 발생하는
        // "uncontrolled -> controlled" 경고를 피하기 위해 빈 문자열로 정규화한다.
        const isValuePropProvided = Object.prototype.hasOwnProperty.call(props, "value");
        const normalizedInputProps: React.InputHTMLAttributes<HTMLInputElement> = {
            ...props,
            ...(isValuePropProvided ? { value: (props as any).value ?? "" } : {}),
        };

        return (
            <div className={cn("", fullWidth && "w-[100%]")}>
                {label && (
                    <div className="mb-1.5">
                        <label htmlFor={inputId} className="text-sm font-medium text-[#0a3b41]">
                            {label}
                            {required && <span className="ml-0.5 text-red-500">*</span>}
                        </label>
                        {description && <div className="mt-0.5 text-[10px] text-gray-500">{description}</div>}
                    </div>
                )}

                <div className={cn("relative", leadingText && "flex items-center")}>
                    {leadingText && (
                        <div
                            className={cn(
                                "flex items-center px-3 text-sm text-gray-500",
                                "border border-r-0 border-gray-200 rounded-l-[8px]",
                                size === "xs" && "h-[34px]",
                                size === "sm" && "h-[38px]",
                                size === "md" && "h-10",
                                size === "lg" && "h-11",
                                disabled && "bg-gray-50",
                            )}
                        >
                            {leadingText}
                        </div>
                    )}

                    <div className="relative flex-1">
                        {Leading && (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Leading
                                    {...(LeadingIcon?.props ?? {})}
                                    className={cn("w-4 h-4 text-gray-400", LeadingIcon?.props?.className)}
                                />
                            </div>
                        )}

                        {Trailing && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Trailing
                                    {...(TrailingIcon?.props ?? {})}
                                    className={cn(
                                        "w-4 h-4",
                                        error ? "text-red-500" : "text-gray-400",
                                        TrailingIcon.props?.className,
                                    )}
                                />
                            </div>
                        )}

                        <input
                            ref={ref}
                            id={inputId}
                            type={type}
                            className={cn(
                                inputVariants({
                                    variant: error ? "error" : "default",
                                    size,
                                    hasLeadingIcon: !!Leading,
                                    hasTrailingIcon: !!Trailing,
                                    hasLeadingText: !!leadingText,
                                }),
                                className,
                            )}
                            disabled={disabled}
                            aria-invalid={!!error}
                            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                            {...normalizedInputProps}
                        />
                    </div>
                </div>

                {error && (
                    <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-500">
                        {error}
                    </p>
                )}

                {helperText && !error && (
                    <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500">
                        {helperText}
                    </p>
                )}
            </div>
        );
    },
);

Input.displayName = "Input";
