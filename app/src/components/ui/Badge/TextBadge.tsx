import type React from "react";
import { cn } from "@/components/utils";

export type TextBadgeColor =
    | "success"
    | "warning"
    | "error"
    | "info"
    | "neutral"
    | "primary"
    // Legacy colors
    | "red"
    | "blue"
    | "yellow"
    | "orange";

interface TextBadgeProps {
    text?: string;
    color?: TextBadgeColor;
    children?: React.ReactNode;
    className?: string;
}

const colorClasses = {
    // Status colors with optimized contrast
    success: "text-badge-success-label bg-badge-success-bg",
    warning: "text-badge-warning-label bg-badge-warning-bg",
    error: "text-badge-error-label bg-badge-error-bg",
    info: "text-badge-info-label bg-badge-info-bg",
    neutral: "text-badge-neutral-label bg-badge-neutral-bg",
    primary: "text-badge-primary-label bg-badge-primary-bg",
    // Legacy colors
    red: "text-badge-error-label bg-badge-error-bg",
    blue: "text-badge-info-label bg-badge-info-bg",
    yellow: "text-badge-warning-label bg-badge-warning-bg",
    orange: "text-badge-orange-label bg-badge-orange-bg",
};

export const TextBadge = ({ text, color = "neutral", children, className }: TextBadgeProps) => {
    return (
        <div
            className={cn(
                "inline-flex items-center h-6 px-2 text-xs font-medium rounded-md",
                colorClasses[color],
                className,
            )}
        >
            <span className="line-clamp-1 overflow-hidden text-ellipsis whitespace-nowrap">{children || text}</span>
        </div>
    );
};
