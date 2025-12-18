import type React from "react";
import { cn } from "@/components/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "text" | "circular" | "rectangular" | "rounded";
    width?: string | number;
    height?: string | number;
    animation?: "pulse" | "wave" | "none";
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = "text",
    width,
    height,
    animation = "pulse",
    style,
    ...props
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case "circular":
                return "rounded-full";
            case "rectangular":
                return "rounded-none";
            case "rounded":
                return "rounded-[8px]";
            default:
                return "rounded h-3.5 my-1";
        }
    };

    const getAnimationStyles = () => {
        switch (animation) {
            case "wave":
                return "animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]";
            case "none":
                return "bg-gray-200";
            default:
                return "animate-pulse bg-gray-200";
        }
    };

    const computedStyle = {
        width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
        height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
        ...style,
    };

    return <div className={cn(getVariantStyles(), getAnimationStyles(), className)} style={computedStyle} {...props} />;
};

Skeleton.displayName = "Skeleton";
