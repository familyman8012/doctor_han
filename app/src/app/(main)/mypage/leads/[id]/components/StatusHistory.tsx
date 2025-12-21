"use client";

import dayjs from "dayjs";
import { History } from "lucide-react";
import { Badge, type BadgeColor } from "@/components/ui/Badge/Badge";
import type { LeadStatusHistory as StatusHistoryType, LeadStatus } from "@/lib/schema/lead";

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

interface LeadStatusHistoryProps {
    history: StatusHistoryType[];
}

export function LeadStatusHistory({ history }: LeadStatusHistoryProps) {
    const sortedHistory = [...history].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#0a3b41] mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                상태 변경 이력
            </h2>

            <div className="space-y-4">
                {sortedHistory.map((item) => {
                    const toConfig = STATUS_CONFIG[item.toStatus];
                    const fromConfig = item.fromStatus ? STATUS_CONFIG[item.fromStatus] : null;

                    return (
                        <div
                            key={item.id}
                            className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    {fromConfig && (
                                        <>
                                            <Badge color={fromConfig.color} size="xs">
                                                {fromConfig.label}
                                            </Badge>
                                            <span className="text-gray-400">→</span>
                                        </>
                                    )}
                                    <Badge color={toConfig.color} size="xs">
                                        {toConfig.label}
                                    </Badge>
                                </div>
                            </div>
                            <span className="text-sm text-gray-400">
                                {dayjs(item.createdAt).format("MM.DD HH:mm")}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
