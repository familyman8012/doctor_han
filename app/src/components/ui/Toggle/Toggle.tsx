import type React from "react";
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/utils";

const toggleVariants = cva(
    "relative inline-flex cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#62e3d5]/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    {
        variants: {
            size: {
                sm: "h-5 w-9", // 20px x 36px
                md: "h-6 w-11", // 24px x 44px
            },
            variant: {
                primary: "data-[state=checked]:bg-[#62e3d5]",
                red: "data-[state=checked]:bg-red-500",
                green: "data-[state=checked]:bg-green-500",
            },
        },
        defaultVariants: {
            size: "sm",
            variant: "primary",
        },
    },
);

export interface ToggleProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size">,
        VariantProps<typeof toggleVariants> {
    loading?: boolean;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
    (
        { className, checked, defaultChecked, loading, disabled, size = "sm", variant = "primary", onChange, ...props },
        ref,
    ) => {
        const isDisabled = loading || disabled;

        return (
            <label
                className={cn(
                    "relative inline-flex cursor-pointer",
                    size === "sm" ? "h-5 w-9" : "h-6 w-11",
                    isDisabled && "cursor-not-allowed opacity-50",
                )}
            >
                <input
                    ref={ref}
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    defaultChecked={defaultChecked}
                    disabled={isDisabled}
                    onChange={onChange}
                    {...props}
                />
                <span
                    className={cn(
                        "absolute inset-0 rounded-full bg-gray-300 transition-colors",
                        "peer-checked:bg-[#62e3d5]",
                        variant === "red" && "peer-checked:bg-red-500",
                        variant === "green" && "peer-checked:bg-green-500",
                        "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#62e3d5]/20 peer-focus-visible:ring-offset-2",
                        className,
                    )}
                />
                <span
                    className={cn(
                        "absolute left-[2px] top-[2px] rounded-full bg-white shadow-sm transition-transform",
                        size === "sm" ? "h-4 w-4 peer-checked:translate-x-4" : "h-5 w-5 peer-checked:translate-x-5",
                    )}
                />
            </label>
        );
    },
);

Toggle.displayName = "Toggle";
