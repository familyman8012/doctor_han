import { Loader2 } from "lucide-react";
import { cn } from "@/components/utils";

interface SpinnerProps {
    className?: string;
    color?: string;
}

export const Spinner = ({ className, color = "currentColor" }: SpinnerProps) => {
    return <Loader2 className={cn("h-4 w-4 animate-spin", className)} style={{ color }} />;
};
