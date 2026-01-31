"use client";

import { Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge/Badge";
import type { SlaStatus } from "@/lib/schema/support";

interface SlaStatusBadgeProps {
    status: SlaStatus;
    size?: "xs" | "sm" | "md";
}

const SLA_CONFIG: Record<SlaStatus, { label: string; color: "success" | "warning" | "error"; Icon: typeof Clock }> = {
    normal: { label: "정상", color: "success", Icon: Clock },
    warning: { label: "임박", color: "warning", Icon: AlertTriangle },
    violated: { label: "위반", color: "error", Icon: AlertCircle },
};

export function SlaStatusBadge({ status, size = "xs" }: SlaStatusBadgeProps) {
    const config = SLA_CONFIG[status];
    const Icon = config.Icon;

    return (
        <Badge color={config.color} size={size}>
            <Icon className="w-3 h-3 mr-1" />
            SLA {config.label}
        </Badge>
    );
}
