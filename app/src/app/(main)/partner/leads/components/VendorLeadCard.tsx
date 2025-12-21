"use client";

import dayjs from "dayjs";
import { ChevronRight, User, Phone, Mail } from "lucide-react";
import { Badge, type BadgeColor } from "@/components/ui/Badge/Badge";
import type { LeadListItem, LeadStatus } from "@/lib/schema/lead";

interface VendorLeadCardProps {
    lead: LeadListItem;
    onClick: () => void;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: BadgeColor }> = {
    submitted: { label: "신규", color: "primary" },
    in_progress: { label: "진행중", color: "info" },
    quote_pending: { label: "견적대기", color: "warning" },
    negotiating: { label: "협의중", color: "purple" },
    contracted: { label: "계약완료", color: "success" },
    hold: { label: "보류", color: "neutral" },
    canceled: { label: "취소", color: "error" },
    closed: { label: "종료", color: "neutral" },
};

export function VendorLeadCard({ lead, onClick }: VendorLeadCardProps) {
    const statusConfig = STATUS_CONFIG[lead.status];
    const isNew = lead.status === "submitted";

    return (
        <div
            onClick={onClick}
            className={`
                flex items-center justify-between p-4 bg-white rounded-xl border cursor-pointer transition-all
                ${isNew ? "border-[#62e3d5] shadow-sm" : "border-gray-100 hover:border-[#62e3d5]"}
                hover:shadow-sm
            `}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <Badge color={statusConfig.color}>{statusConfig.label}</Badge>
                    {lead.serviceName && (
                        <span className="text-sm text-gray-500 truncate">{lead.serviceName}</span>
                    )}
                    {isNew && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                            NEW
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-[#0a3b41]">{lead.contactName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{lead.contactPhone}</span>
                    </div>
                    {lead.contactEmail && (
                        <div className="hidden md:flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 truncate max-w-[150px]">
                                {lead.contactEmail}
                            </span>
                        </div>
                    )}
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
