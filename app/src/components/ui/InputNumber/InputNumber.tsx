import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/components/utils";

// 스타일은 기존 Input 컴포넌트와 동일한 규칙을 따름
const inputVariants = cva(
    "w-full px-3 text-sm text-[#0a3b41] border bg-white rounded-lg transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#62e3d5] disabled:bg-gray-50 disabled:cursor-not-allowed",
    {
        variants: {
            variant: {
                default: "border-gray-200",
                error: "border-red-300 focus:ring-red-500",
            },
            size: {
                xs: "h-[34px] py-1.5 text-sm",
                sm: "h-[38px] py-2 text-sm",
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

export type InputNumberMode = "integer" | "decimal";

export interface InputNumberProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "value" | "onChange" | "min" | "max">,
        VariantProps<typeof inputVariants> {
    /**
     * 표시/편집 중 내부 상태는 문자열로 유지되고, 바깥으로는 숫자 형태로만 전달됨.
     * undefined는 "빈 입력" 상태를 의미함.
     */
    value?: number | undefined;
    onValueChange?: (value: number | undefined) => void;
    /** 원본 input onChange 이벤트 핸들러 (전달용) */
    onChange?: React.ChangeEventHandler<HTMLInputElement>;

    /** 입력 모드: 정수/소수 */
    mode?: InputNumberMode;
    /**
     * 소수 자릿수 제한(입력 차단). rounding='none'가 기본이므로 blur 시 값 변경은 하지 않으며,
     * 초과 자릿수 입력은 onChange 단계에서 무시됩니다.
     */
    fractionDigits?: number;
    /** 기존 precision(반올림 자리수)은 하위호환을 위해 유지합니다. rounding='round'일 때만 사용됩니다. */
    precision?: number;
    /** 최솟값/최댓값. clamp는 blur 시점에 수행 */
    min?: number;
    max?: number;
    /** blur 시점에 min/max/precision 적용 여부 */
    clampOnBlur?: boolean;
    /** 음수 허용 여부 */
    allowNegative?: boolean;
    /** 반올림 모드: 기본은 'none'(반올림/반내림 없음). 'round'일 때 precision 적용 */
    rounding?: "none" | "round";
    /**
     * 비어있는 상태에서 blur 발생 시 대체값을 적용.
     * 'min'이면 현재 min 값(정의된 경우)에 맞춰 설정.
     * 지정하지 않으면 빈값을 그대로 undefined로 유지.
     */
    fallbackValueOnBlur?: number | "min";

    // UI 공통 속성(기존 Input과 동일한 패턴 유지)
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

/**
 * InputNumber
 * - type="text" + inputMode 사용으로 휠 증감 및 브라우저 number 입력의 UX 문제 제거
 * - 편집 중 문자열 상태 허용 → 삭제/중간 상태("-", "1.") 보존
 * - blur 시 파싱/정규화(정수화, precision 반올림, min/max clamp)
 */
export const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
    (
        {
            value,
            onValueChange,
            mode = "decimal",
            fractionDigits,
            precision,
            min,
            max,
            clampOnBlur = true,
            allowNegative = false,
            rounding = "none",
            fallbackValueOnBlur,
            fullWidth,
            className,
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
            name,
            onBlur,
            onFocus,
            onChange,
            placeholder,
            ...rest
        },
        ref,
    ) => {
        const inputId = id || name;
        const Leading = LeadingIcon?.type;
        const Trailing = TrailingIcon?.type;

        const [focused, setFocused] = useState(false);
        const [text, setText] = useState<string>(value === undefined || value === null ? "" : String(value));
        const lastPropValueRef = useRef<number | undefined>(value);

        // 외부 value가 바뀌면(포커스 중이 아니면) 표시 문자열 동기화
        useEffect(() => {
            if (value !== lastPropValueRef.current) {
                lastPropValueRef.current = value;
                if (!focused) {
                    setText(value === undefined || value === null ? "" : String(value));
                }
            }
        }, [value, focused]);

        // 정규식 유효성(입력 허용 문자 제약)
        const pattern = useMemo(() => {
            const neg = allowNegative ? "-?" : "";
            return mode === "integer" ? new RegExp(`^${neg}\\d*$`) : new RegExp(`^${neg}\\d*(\\.\\d*)?$`);
        }, [mode, allowNegative]);

        const inputMode = mode === "integer" ? "numeric" : "decimal";

        const parseNumber = (raw: string): number | undefined => {
            if (raw === "" || raw === "-" || raw === "." || raw === "-." || raw === "-0.") return undefined;
            const normalized = raw.replace(",", ".");
            const n = Number(normalized);
            if (Number.isNaN(n)) return undefined;
            if (mode === "integer") return Math.trunc(n);
            return n;
        };

        const roundTo = (n: number, p?: number): number => {
            if (p == null || p < 0) return n;
            const f = 10 ** p;
            return Math.round(n * f) / f;
        };

        const clamp = (n: number): number => {
            let res = n;
            if (typeof min === "number") res = Math.max(min, res);
            if (typeof max === "number") res = Math.min(max, res);
            return res;
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            let next = e.target.value;
            // 소수점은 쉼표 입력을 점으로 보정
            if (mode === "decimal" && next.includes(",")) next = next.replace(/,/g, ".");

            // 허용 패턴 외 문자는 입력 무시
            if (!pattern.test(next)) {
                // 원래 onChange가 필요하면 그대로 전달
                onChange?.(e);
                return;
            }

            // 소수 자릿수 제한: 입력 단계에서 초과 자리수는 차단
            if (mode === "decimal" && typeof fractionDigits === "number") {
                const dot = next.indexOf(".");
                if (dot >= 0) {
                    const decimals = next.slice(dot + 1);
                    if (decimals.length > fractionDigits) {
                        onChange?.(e);
                        return; // 무시
                    }
                }
            }

            setText(next);

            const parsed = parseNumber(next);
            onValueChange?.(parsed);
            onChange?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setFocused(false);

            let parsed = parseNumber(text);
            if (parsed === undefined) {
                // 비어있음: 필요 시 fallback 적용
                let fallback: number | undefined;
                if (fallbackValueOnBlur === "min" && typeof min === "number") {
                    fallback = min;
                } else if (typeof fallbackValueOnBlur === "number") {
                    fallback = fallbackValueOnBlur;
                }

                if (typeof fallback === "number") {
                    let normalized = fallback;
                    if (clampOnBlur) {
                        if (mode === "integer") normalized = Math.trunc(normalized);
                        normalized = roundTo(normalized, precision);
                        normalized = clamp(normalized);
                    }
                    setText(String(normalized));
                    onValueChange?.(normalized);
                    onBlur?.(e);
                    return;
                }

                // fallback 명시되지 않으면 undefined로 확정
                setText("");
                onValueChange?.(undefined);
                onBlur?.(e);
                return;
            }

            if (clampOnBlur) {
                if (mode === "integer") parsed = Math.trunc(parsed);
                // 반올림은 명시적으로 round를 택한 경우만 수행
                if (rounding === "round") {
                    parsed = roundTo(parsed, precision);
                }
                parsed = clamp(parsed);
            }

            // 표시 문자열 동기화(반올림 기본 없음; 자연스러운 표시 유지)
            setText(String(parsed));
            onValueChange?.(parsed);
            onBlur?.(e);
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setFocused(true);
            onFocus?.(e);
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
                                        TrailingIcon?.props?.className,
                                    )}
                                />
                            </div>
                        )}

                        <input
                            ref={ref}
                            id={inputId}
                            name={name}
                            type="text"
                            inputMode={inputMode}
                            // 모바일 입력 제한 힌트 제공(실제 검증은 내부 로직)
                            placeholder={placeholder}
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
                            value={text}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onFocus={handleFocus}
                            onWheel={(e) => e.preventDefault()}
                            disabled={disabled}
                            aria-invalid={!!error}
                            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                            {...rest}
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

InputNumber.displayName = "InputNumber";
