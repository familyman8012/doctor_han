import type React from "react";
import type { FC, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/components/utils";

type BadgeType = "square" | "circle";
type BadgeSize = "xs" | "sm" | "md" | "circle";
export type BadgeColor =
    // Status colors
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral"
    // Brand colors
    | "primary"
    | "secondary"
    // Category colors
    | "purple"
    | "orange"
    | "pink"
    | "indigo"
    | "teal"
    | "amber"
    // Legacy colors (backward compatibility)
    | "green"
    | "yellow"
    | "red"
    | "blue"
    | "gray";
type BadgeFill = "fill" | "outline" | "transparent";

const badgeVariants = cva("w-max", {
    variants: {
        type: {
            square: "min-w-[48px] justify-center rounded",
            circle: "rounded-full",
        },
        size: {
            xs: "py-0.5 px-2 text-[11px] leading-4 font-medium",
            sm: "py-0.5 px-2.5 text-xs leading-5 font-medium",
            md: "py-1 px-3 text-sm leading-5 font-medium",
            circle: "py-0 px-1.5 text-[11px] leading-4 rounded-full font-medium",
        },
        color: {
            // Status colors
            success: "text-badge-success-label border-badge-success-border bg-badge-success-bg",
            warning: "text-badge-warning-label border-badge-warning-border bg-badge-warning-bg",
            error: "text-badge-error-label border-badge-error-border bg-badge-error-bg",
            info: "text-badge-info-label border-badge-info-border bg-badge-info-bg",
            neutral: "text-badge-neutral-label border-badge-neutral-border bg-badge-neutral-bg",
            // Brand colors
            primary: "text-badge-primary-label border-badge-primary-border bg-badge-primary-bg",
            secondary: "text-badge-secondary-label border-badge-secondary-border bg-badge-secondary-bg",
            // Category colors
            purple: "text-badge-purple-label border-badge-purple-border bg-badge-purple-bg",
            orange: "text-badge-orange-label border-badge-orange-border bg-badge-orange-bg",
            pink: "text-badge-pink-label border-badge-pink-border bg-badge-pink-bg",
            indigo: "text-badge-indigo-label border-badge-indigo-border bg-badge-indigo-bg",
            teal: "text-badge-teal-label border-badge-teal-border bg-badge-teal-bg",
            amber: "text-badge-amber-label border-badge-amber-border bg-badge-amber-bg",
            // Legacy mappings
            green: "text-badge-success-label border-badge-success-border bg-badge-success-bg",
            yellow: "text-badge-warning-label border-badge-warning-border bg-badge-warning-bg",
            red: "text-badge-error-label border-badge-error-border bg-badge-error-bg",
            blue: "text-badge-info-label border-badge-info-border bg-badge-info-bg",
            gray: "text-badge-neutral-label border-badge-neutral-border bg-badge-neutral-bg",
        },
        fill: {
            fill: "border",
            outline: "border bg-transparent",
            transparent: "border-none bg-transparent",
        },
        hasBorder: {
            true: "",
            false: "border-none font-semibold",
        },
    },
    defaultVariants: {
        type: "circle",
        size: "sm",
        color: "neutral",
        fill: "fill",
        hasBorder: true,
    },
});

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
    children: ReactNode;
    dot?: boolean;
    LeadingIcon?: React.ReactElement;
    TrailingIcon?: React.ReactElement;
    textWhite?: boolean;
    onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
    className?: string;
}

export const Badge: FC<BadgeProps> = ({
    type = "circle",
    size = "sm",
    color = "neutral",
    dot,
    fill = "fill",
    LeadingIcon,
    TrailingIcon,
    children,
    textWhite,
    hasBorder = true,
    onClick,
    className,
}) => {
    const Leading = LeadingIcon?.type;
    const Trailing = TrailingIcon?.type;

    const hasIcon = !!Leading || !!Trailing || dot;

    return (
        <span
            className={cn(
                badgeVariants({ type, size, color, fill, hasBorder }),
                hasIcon ? "inline-flex items-center" : "inline-block",
                dot &&
                    "before:inline-block before:content-[''] before:w-[6px] before:h-[6px] before:mr-[4px] before:rounded-full before:bg-current",
                className,
            )}
            onClick={onClick}
        >
            {Leading && (
                <Leading {...(LeadingIcon.props as React.HTMLAttributes<SVGSVGElement>)} className="mr-1 w-3 h-3" />
            )}
            {children}
            {Trailing && (
                <Trailing {...(TrailingIcon.props as React.HTMLAttributes<SVGSVGElement>)} className="ml-1 w-3 h-3" />
            )}
        </span>
    );
};
