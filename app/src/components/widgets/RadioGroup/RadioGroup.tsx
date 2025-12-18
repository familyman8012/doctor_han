"use client";

import React from "react";
import { cn } from "@/components/utils";
import { Radio, type RadioProps } from "@/components/ui/Radio/Radio";

export interface RadioGroupOption {
    value: string;
    label: string;
    subText?: string;
}

export interface RadioGroupProps {
    name?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    options?: RadioGroupOption[];
    children?: React.ReactNode;
    className?: string;
    direction?: "horizontal" | "vertical";
    size?: "sm" | "md";
    disabled?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
    name = "radio-group",
    value: controlledValue,
    defaultValue = "",
    onChange,
    options,
    children,
    className,
    direction = "vertical",
    size = "md",
    disabled = false,
}) => {
    // controlled/uncontrolled 모드 처리
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    const handleChange = React.useCallback(
        (newValue: string) => {
            if (!isControlled) {
                setInternalValue(newValue);
            }
            onChange?.(newValue);
        },
        [isControlled, onChange],
    );

    // options 배열이 있을 때 Radio 컴포넌트 렌더링
    const renderOptions = () => {
        if (!options) return null;

        return options.map((option) => (
            <Radio
                key={option.value}
                name={name}
                value={option.value}
                checked={currentValue === option.value}
                onChange={(e) => handleChange(e.target.value)}
                label={option.label}
                subText={option.subText}
                size={size}
                disabled={disabled}
            />
        ));
    };

    // children이 있을 때 처리
    const renderChildren = () => {
        return React.Children.map(children, (child) => {
            if (React.isValidElement<RadioProps>(child) && child.type === Radio) {
                const element = child as React.ReactElement<RadioProps>;
                return React.cloneElement(element, {
                    name,
                    checked: element.props.value === currentValue,
                    size: element.props.size || size,
                    disabled: element.props.disabled !== undefined ? element.props.disabled : disabled,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        handleChange(e.target.value);
                        if (element.props.onChange) {
                            element.props.onChange(e);
                        }
                    },
                });
            }
            return child;
        });
    };

    return (
        <div
            className={cn(
                "flex",
                direction === "horizontal" ? "flex-row flex-wrap gap-4" : "flex-col gap-3",
                className,
            )}
            role="radiogroup"
            aria-orientation={direction}
        >
            {options ? renderOptions() : renderChildren()}
        </div>
    );
};

RadioGroup.displayName = "RadioGroup";
