import { Loader2 } from "lucide-react";
import { cn } from "@/components/utils";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva("animate-spin", {
    variants: {
        size: {
            xs: "h-3 w-3", // 12px
            sm: "h-4 w-4", // 16px (기본값)
            md: "h-5 w-5", // 20px
            lg: "h-6 w-6", // 24px
        },
    },
    defaultVariants: {
        size: "sm",
    },
});

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
    className?: string;
    color?: string;
}

export const Spinner = ({ className, color = "#62e3d5", size = "sm" }: SpinnerProps) => {
    return <Loader2 className={cn(spinnerVariants({ size }), className)} style={{ color }} />;
};
