import type React from "react";
import type { FC, ReactElement } from "react";
import { cn } from "@/components/utils";
import { AlertCircle } from "lucide-react";

export interface EmptyProps {
    Icon?: ReactElement<{ className?: string }>;
    title?: string;
    description?: string;
    className?: string;
}

export const Empty: FC<React.PropsWithChildren<EmptyProps>> = ({ Icon, title, description, children, className }) => {
    const IconComponent = Icon?.type || AlertCircle;

    return (
        <div
            className={cn("w-full flex flex-col items-center justify-center min-h-[100px] py-6 text-center", className)}
        >
            {IconComponent && (
                <IconComponent
                    {...(Icon?.props || {})}
                    className={cn("w-8 h-8 text-gray-400 mb-2", Icon?.props?.className)}
                />
            )}
            <p className="text-sm text-[#5f6b6d] font-normal whitespace-pre-line">
                {children || title || "데이터가 없습니다."}
            </p>
            {description && <p className="text-xs text-gray-400 mt-1.5">{description}</p>}
        </div>
    );
};

Empty.displayName = "Empty";
