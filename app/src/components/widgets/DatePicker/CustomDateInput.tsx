"use client";

import { forwardRef } from "react";
import { FaRegCalendar } from "react-icons/fa";
import { Input } from "@/components/ui/Input/Input";

interface CustomDateInputProps {
    value?: string;
    onClick?: () => void;
    placeholder?: string;
    disabled?: boolean;
    size?: "xs" | "sm" | "md" | "lg";
    onChange?: () => void;
}

// Custom Input component for DatePicker with FaRegCalendar icon
const CustomDateInput = forwardRef<HTMLInputElement, CustomDateInputProps>((props, ref) => {
    const { value, onClick, placeholder, disabled, size = "xs" } = props;

    // value를 포맷팅하여 표시 (YYYY. MM. DD. 형식)
    const displayValue = value
        ? new Date(value).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
          })
        : "";

    return (
        <Input
            ref={ref}
            type="text"
            value={displayValue}
            onClick={onClick}
            placeholder={placeholder}
            disabled={disabled}
            size={size}
            readOnly
            TrailingIcon={<FaRegCalendar className="w-[13px] h-[13px] text-black" />}
        />
    );
});

CustomDateInput.displayName = "CustomDateInput";

export default CustomDateInput;
