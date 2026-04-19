"use client";

import dayjs from "dayjs";
import { Badge, type BadgeColor } from "@/components/ui/Badge/Badge";
import type { LeadStatusHistory as StatusHistoryType, LeadStatus } from "@/lib/schema/lead";

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

interface LeadStatusHistoryProps {
    history: StatusHistoryType[];
}

export function LeadStatusHistory({ history }: LeadStatusHistoryProps) {
    const sortedHistory = [...history].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return (
        <ol className="relative ml-2 space-y-5 border-l-2 border-gray-100 pl-6">
            {sortedHistory.map((item, idx) => {
                const toConfig = STATUS_CONFIG[item.toStatus];
                const fromConfig = item.fromStatus ? STATUS_CONFIG[item.fromStatus] : null;
                const isLatest = idx === 0;

                return (
                    <li key={item.id} className="relative">
                        {/* 타임라인 점 */}
                        <span
                            className={`absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                isLatest
                                    ? "border-primary bg-primary"
                                    : "border-gray-300 bg-white"
                            }`}
                            aria-hidden
                        >
                            {isLatest && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                            {fromConfig && (
                                <>
                                    <Badge color={fromConfig.color} size="xs">
                                        {fromConfig.label}
                                    </Badge>
                                    <span className="text-gray-300">→</span>
                                </>
                            )}
                            <Badge color={toConfig.color} size="xs">
                                {toConfig.label}
                            </Badge>
                            <span className="ml-auto text-xs text-gray-400">
                                {dayjs(item.createdAt).format("YYYY.MM.DD HH:mm")}
                            </span>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
