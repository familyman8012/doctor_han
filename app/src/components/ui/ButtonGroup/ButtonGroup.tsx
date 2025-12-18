import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/utils";

const buttonGroupVariants = cva("inline-flex rounded-lg border border-gray-200 p-0.5", {
    variants: {
        size: {
            xs: "",
            sm: "",
            md: "",
            lg: "",
        },
    },
    defaultVariants: {
        size: "sm",
    },
});

const buttonGroupItemVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#62e3d5] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            size: {
                xs: "h-6 px-2 text-xs rounded-md",
                sm: "h-7 px-2.5 text-xs rounded-md",
                md: "h-8 px-3 text-sm rounded-md",
                lg: "h-9 px-3.5 text-base rounded-md",
            },
            isActive: {
                true: "bg-white text-[#0a3b41] shadow-sm",
                false: "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
            },
        },
        defaultVariants: {
            size: "sm",
            isActive: false,
        },
    },
);

export interface ButtonGroupItem {
    value: string;
    label?: string;
    content?: React.ReactNode;
    disabled?: boolean;
}

export interface ButtonGroupProps extends VariantProps<typeof buttonGroupVariants> {
    options: ButtonGroupItem[];
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    className?: string;
    orientation?: "horizontal" | "vertical";
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    size = "sm",
    className,
    orientation = "horizontal",
}) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || options[0]?.value);
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleClick = (newValue: string) => {
        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
    };

    return (
        <div
            className={cn(buttonGroupVariants({ size }), orientation === "vertical" && "flex-col", className)}
            role="group"
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleClick(option.value)}
                    disabled={option.disabled}
                    className={cn(
                        buttonGroupItemVariants({
                            size,
                            isActive: value === option.value,
                        }),
                        orientation === "vertical" && "w-full justify-start",
                    )}
                    aria-pressed={value === option.value}
                >
                    {option.content || option.label || option.value}
                </button>
            ))}
        </div>
    );
};

ButtonGroup.displayName = "ButtonGroup";

// Alternative segmented control style
const segmentedVariants = cva("inline-flex items-center justify-center rounded-lg bg-gray-100 p-0.5", {
    variants: {
        size: {
            xs: "",
            sm: "",
            md: "",
            lg: "",
        },
    },
    defaultVariants: {
        size: "sm",
    },
});

const segmentedItemVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#62e3d5] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            size: {
                xs: "h-5.5 px-2 text-xs",
                sm: "h-6.5 px-2.5 text-xs",
                md: "h-7.5 px-3 text-sm",
                lg: "h-8.5 px-3.5 text-base",
            },
            isActive: {
                true: "bg-white text-[#0a3b41] shadow-sm",
                false: "text-gray-600 hover:text-gray-900",
            },
        },
        defaultVariants: {
            size: "sm",
            isActive: false,
        },
    },
);

export interface SegmentedControlProps extends ButtonGroupProps {
    variant?: "default" | "segmented";
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    size = "sm",
    className,
    orientation = "horizontal",
}) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || options[0]?.value);
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleClick = (newValue: string) => {
        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }
        onChange?.(newValue);
    };

    return (
        <div
            className={cn(segmentedVariants({ size }), orientation === "vertical" && "flex-col", className)}
            role="group"
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleClick(option.value)}
                    disabled={option.disabled}
                    className={cn(
                        segmentedItemVariants({
                            size,
                            isActive: value === option.value,
                        }),
                        orientation === "vertical" && "w-full justify-start",
                    )}
                    aria-pressed={value === option.value}
                >
                    {option.content || option.label || option.value}
                </button>
            ))}
        </div>
    );
};

SegmentedControl.displayName = "SegmentedControl";
