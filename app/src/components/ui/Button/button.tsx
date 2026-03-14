import type * as React from "react";
import type { ButtonHTMLAttributes, FC, ReactElement } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/components/utils";
import { Spinner } from "@/components/ui/Spinner/Spinner";

type ButtonVariant =
    | "primary"
    | "secondary"
    | "ghostPrimary"
    | "ghostSecondary"
    | "selectItem"
    | "selectItem_on"
    | "transparent"
    | "danger"
    | "list" // 리스트 페이지용 컴팩트 버튼
    | "listActive"; // 리스트 페이지용 활성 버튼

type ButtonSize = "xs" | "sm" | "md" | "lg";

const buttonVariants = cva(
    "inline-flex items-center justify-center w-fit rounded-lg whitespace-nowrap select-none cursor-pointer font-medium transition-colors disabled:cursor-not-allowed",
    {
        variants: {
            variant: {
                primary:
                    "text-white bg-primary hover:bg-primary-700 disabled:text-gray-300 disabled:border disabled:border-gray-200 disabled:bg-gray-100",
                secondary:
                    "text-content-primary bg-white border border-gray-200 hover:bg-gray-50 disabled:text-gray-300 disabled:border-gray-200 disabled:bg-gray-100",
                ghostPrimary:
                    "text-primary border border-primary bg-transparent hover:bg-primary-50 disabled:text-gray-300 disabled:border-gray-300 disabled:hover:bg-white",
                ghostSecondary:
                    "text-content-primary border border-gray-300 bg-white hover:bg-gray-50 disabled:text-gray-300 disabled:border-gray-300 disabled:hover:bg-white",
                selectItem:
                    "inline-flex !min-w-0 !h-auto !p-0 text-gray-700 border border-gray-300 bg-gray-50 rounded disabled:text-gray-300 disabled:border-gray-200 disabled:bg-white",
                selectItem_on:
                    "inline-flex !min-w-0 !h-auto !p-0 text-content-primary border border-primary bg-primary-50 rounded",
                transparent: "!min-w-0 bg-transparent border-none shadow-none hover:bg-gray-50 disabled:bg-gray-25",
                danger: "text-white bg-red-500 hover:bg-red-600 disabled:text-gray-300 disabled:border disabled:border-gray-200 disabled:bg-gray-100",
                list: "text-content-secondary bg-white border border-gray-200 hover:bg-gray-50 disabled:text-gray-300 disabled:bg-gray-100",
                listActive:
                    "text-content-primary bg-primary-50 border border-primary hover:bg-primary-100 disabled:text-gray-300 disabled:bg-gray-100",
            },
            size: {
                xs: "h-7 px-2.5 text-xs", // 28px 높이 - 리스트 페이지용
                sm: "h-[34px] px-3 text-sm", // 34px 높이
                md: "h-9 px-3.5 text-sm", // 36px 높이
                lg: "h-10 px-4 text-base", // 40px 높이
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "sm",
        },
    },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    LeadingIcon?: ReactElement;
    TrailingIcon?: ReactElement;
    IconOnly?: ReactElement;
    disabled?: boolean;
    isLoading?: boolean;
    asChild?: boolean;
}

export const Button: FC<ButtonProps> = ({
    children,
    variant = "primary",
    size = "sm",
    LeadingIcon,
    TrailingIcon,
    IconOnly,
    disabled,
    isLoading,
    type,
    className,
    asChild = false,
    ...buttonProps
}) => {
    const Comp = asChild ? Slot : "button";

    // Extract the component type and props from ReactElement
    const Leading = LeadingIcon?.type;
    const Trailing = TrailingIcon?.type;
    const IconOnlyType = IconOnly?.type;

    // 사이즈에 따른 아이콘 크기 설정
    const iconSizeClass =
        size === "xs" ? "h-3 w-3" : size === "sm" ? "h-4 w-4" : size === "lg" ? "h-4.5 w-4.5" : "h-4 w-4";

    // Special handling for selectItem variants with TrailingIcon (delete button)
    const isSelectItem = variant === "selectItem" || variant === "selectItem_on";

    if (isSelectItem && TrailingIcon) {
        return (
            <Comp
                {...buttonProps}
                type={type ?? "button"}
                className={cn(buttonVariants({ variant, size }), "group", className)}
                disabled={disabled}
            >
                <span className="px-3 py-1.5">{children}</span>
                <button
                    type="button"
                    className={cn(
                        "px-2 py-1.5 border-l flex items-center justify-center transition-colors",
                        variant === "selectItem"
                            ? "border-gray-300 hover:bg-gray-100"
                            : "border-primary hover:bg-primary-100",
                        disabled && "pointer-events-none opacity-50",
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        // if (TrailingIcon.props?.onClick) {
                        //   TrailingIcon.props.onClick(e);
                        // }
                    }}
                    disabled={disabled}
                >
                    <X className={cn("h-3 w-3", variant === "selectItem" ? "text-gray-500" : "text-content-primary")} />
                </button>
            </Comp>
        );
    }

    return (
        <Comp
            {...buttonProps}
            type={type ?? "button"}
            className={cn(buttonVariants({ variant, size }), IconOnly && "justify-center", className)}
            disabled={disabled}
        >
            {Leading && (
                <Leading
                    {...(LeadingIcon.props as React.HTMLAttributes<SVGSVGElement>)}
                    className={cn("mr-1", iconSizeClass)}
                />
            )}
            {!isLoading ? (
                IconOnlyType ? (
                    <IconOnlyType
                        {...(IconOnly.props as React.HTMLAttributes<SVGSVGElement>)}
                        className={iconSizeClass}
                    />
                ) : (
                    <span className="txt">{children}</span>
                )
            ) : (
                <Spinner className={iconSizeClass} color="white" />
            )}
            {Trailing && !isSelectItem && (
                <Trailing
                    {...(TrailingIcon.props as React.HTMLAttributes<SVGSVGElement>)}
                    className={cn("ml-1", iconSizeClass)}
                />
            )}
        </Comp>
    );
};

export const BtnDelete = ({ onClick }: { onClick?: () => void }) => {
    return (
        <button
            type="button"
            className="btn_close !mr-0"
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
        >
            <X className="btn_close_svg h-3.5 w-3.5" />
        </button>
    );
};

// For backward compatibility
Button.displayName = "Button";

export { buttonVariants };
