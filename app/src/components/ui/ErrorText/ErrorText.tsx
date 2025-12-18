import type React from "react";
import { cn } from "@/components/utils";

export interface ErrorTextProps {
    error?: {
        type?: string | number;
        message?: string;
    };
    className?: string;
}

export const ErrorText: React.FC<React.PropsWithChildren<ErrorTextProps>> = ({ error, children, className }) => {
    if (children) {
        return <p className={cn("text-sm text-red-500 font-medium mt-1", className)}>{children}</p>;
    }

    if (!error) return null;

    let message = error.message;

    if (!message) {
        switch (error.type) {
            case "required":
                message = "필수 입력 항목입니다.";
                break;
            case "minLength":
                message = `최소 ${error.message || ""}글자 이상 입력해주세요.`;
                break;
            case "maxLength":
                message = `최대 ${error.message || ""}글자 이하로 입력해주세요.`;
                break;
            case "pattern":
                message = "형식에 맞지 않습니다.";
                break;
            default:
                message = "입력값을 확인해주세요.";
        }
    }

    return <p className={cn("text-sm text-red-500 font-medium mt-1", className)}>{message}</p>;
};

ErrorText.displayName = "ErrorText";
