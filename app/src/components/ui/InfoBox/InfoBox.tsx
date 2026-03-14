import type { ReactNode } from "react";
import { cn } from "@/components/utils";

export type InfoBoxVariant = "info" | "success" | "warning" | "error" | "neutral" | "primary";

interface InfoBoxProps {
    children: ReactNode;
    variant?: InfoBoxVariant;
    className?: string;
    title?: string;
}

// 우리 디자인 시스템에 맞춘 색상 - 배경은 매우 연하게, 텍스트는 진하게
const variantStyles: Record<InfoBoxVariant, string> = {
    // 브랜드 컬러 활용
    primary: "bg-primary-50 border-primary-200 text-content-primary",

    // 기본 info - 연한 회색 배경에 진한 텍스트
    info: "bg-gray-50 border-gray-200 text-content-primary",

    // 의미별 색상
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
    error: "bg-red-50 border-red-200 text-red-900",
    neutral: "bg-gray-50 border-gray-200 text-gray-700",
};

const titleStyles: Record<InfoBoxVariant, string> = {
    primary: "text-content-primary font-semibold",
    info: "text-content-primary font-semibold",
    success: "text-emerald-900 font-semibold",
    warning: "text-yellow-900 font-semibold",
    error: "text-red-900 font-semibold",
    neutral: "text-gray-900 font-semibold",
};

export function InfoBox({ children, variant = "info", className, title }: InfoBoxProps) {
    return (
        <div className={cn("rounded-lg border px-4 py-3", variantStyles[variant], className)}>
            {title ? (
                <div className="flex gap-2 text-sm">
                    <span className={titleStyles[variant]}>{title}</span>
                    <span className="opacity-90">{children}</span>
                </div>
            ) : (
                <div className="text-sm">{children}</div>
            )}
        </div>
    );
}

export default InfoBox;