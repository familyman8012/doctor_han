"use client";

import dayjs from "dayjs";
import { ChevronRight, Building2 } from "lucide-react";
import { Badge, type BadgeColor } from "@/components/ui/Badge/Badge";
import type { LeadListItem, LeadStatus } from "@/lib/schema/lead";

interface LeadListCardProps {
    lead: LeadListItem;
    onClick: () => void;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: BadgeColor }> = {
    submitted: { label: "접수", color: "primary" },
    in_progress: { label: "진행중", color: "info" },
    quote_pending: { label: "견적대기", color: "warning" },
    negotiating: { label: "협의중", color: "purple" },
    contracted: { label: "계약완료", color: "success" },
    hold: { label: "보류", color: "neutral" },
    canceled: { label: "취소", color: "error" },
    closed: { label: "종료", color: "neutral" },
};

export function LeadListCard({ lead, onClick }: LeadListCardProps) {
    const statusConfig = STATUS_CONFIG[lead.status];

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-[#62e3d5] hover:shadow-sm cursor-pointer transition-all"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <Badge color={statusConfig.color}>{statusConfig.label}</Badge>
                    {lead.serviceName && (
                        <span className="text-sm text-gray-500 truncate">{lead.serviceName}</span>
                    )}
                </div>

                <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-[#0a3b41] truncate">
                        {lead.vendor?.name ?? "업체 정보 없음"}
                    </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-1">{lead.content}</p>

                <p className="text-xs text-gray-400 mt-2">
                    {dayjs(lead.createdAt).format("YYYY.MM.DD HH:mm")}
                </p>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 ml-4" />
        </div>
    );
}
