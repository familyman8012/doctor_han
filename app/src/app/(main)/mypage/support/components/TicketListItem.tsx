"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { ChevronRight, MessageCircle } from "lucide-react";
import type { SupportTicketListItem as TicketListItemType } from "@/lib/schema/support";
import { TicketStatusBadge } from "./TicketStatusBadge";

interface TicketListItemProps {
    ticket: TicketListItemType;
    basePath: string;
}

export function TicketListItem({ ticket, basePath }: TicketListItemProps) {
    return (
        <Link
            href={`${basePath}/${ticket.id}`}
            className="flex items-start justify-between gap-4 p-4 hover:bg-gray-50 transition-colors"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <TicketStatusBadge status={ticket.status} size="xs" />
                    {ticket.category && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {ticket.category.name}
                        </span>
                    )}
                    <span className="text-xs text-gray-400">{dayjs(ticket.createdAt).format("YYYY.MM.DD")}</span>
                </div>
                <p className="font-medium text-[#0a3b41] truncate">{ticket.title}</p>
                {ticket.lastMessagePreview && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{ticket.lastMessagePreview}</p>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {ticket.unreadCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-[#62e3d5] text-[#0a3b41] text-xs font-medium rounded-full">
                        <MessageCircle className="w-3 h-3" />
                        {ticket.unreadCount}
                    </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
        </Link>
    );
}
