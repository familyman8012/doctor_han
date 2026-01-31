"use client";

import dayjs from "dayjs";
import { Check, CheckCheck } from "lucide-react";
import type { SupportTicketMessageView } from "@/lib/schema/support";

interface MessageBubbleProps {
    message: SupportTicketMessageView;
    isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
    return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
            <div
                className={`max-w-[70%] ${
                    isOwn
                        ? "bg-[#0a3b41] text-white rounded-2xl rounded-br-md"
                        : "bg-gray-100 text-[#0a3b41] rounded-2xl rounded-bl-md"
                } px-4 py-3`}
            >
                {/* 관리자 표시 */}
                {!isOwn && message.isAdmin && (
                    <p className={`text-xs font-medium mb-1 ${isOwn ? "text-white/70" : "text-[#62e3d5]"}`}>
                        고객지원팀
                    </p>
                )}

                {/* 메시지 내용 */}
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                {/* 시간 + 읽음 표시 */}
                <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                    <span className={`text-xs ${isOwn ? "text-white/60" : "text-gray-400"}`}>
                        {dayjs(message.createdAt).format("HH:mm")}
                    </span>
                    {isOwn && (
                        <span className="text-white/60">
                            {message.readAt ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
