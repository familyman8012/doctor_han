"use client";

import { Clock, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge/Badge";
import type { SupportTicketStatus } from "@/lib/schema/support";

interface TicketStatusBadgeProps {
    status: SupportTicketStatus;
    size?: "xs" | "sm" | "md";
}

const STATUS_CONFIG: Record<
    SupportTicketStatus,
    { label: string; color: "warning" | "info" | "success" | "neutral"; Icon: typeof Clock }
> = {
    open: { label: "접수", color: "warning", Icon: Clock },
    in_progress: { label: "처리중", color: "info", Icon: Loader2 },
    resolved: { label: "해결", color: "success", Icon: CheckCircle },
    closed: { label: "종료", color: "neutral", Icon: XCircle },
};

export function TicketStatusBadge({ status, size = "sm" }: TicketStatusBadgeProps) {
    const config = STATUS_CONFIG[status];
    const Icon = config.Icon;

    return (
        <Badge color={config.color} size={size}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
        </Badge>
    );
}
