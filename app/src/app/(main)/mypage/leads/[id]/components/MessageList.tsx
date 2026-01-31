"use client";

import { useEffect, useRef } from "react";
import dayjs from "dayjs";
import { MessageSquare } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import type { LeadMessage } from "@/lib/schema/lead";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
    messages: LeadMessage[];
    currentUserId: string;
    isLoading: boolean;
    isFetching: boolean;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    onLoadMore?: () => void;
}

export function MessageList({
    messages,
    currentUserId,
    isLoading,
    isFetching,
    hasMore,
    isLoadingMore,
    onLoadMore,
}: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const prevLastMessageIdRef = useRef<string | null>(null);
    const didInitialScrollRef = useRef(false);

    // 새 메시지가 추가되면 스크롤을 아래로 이동 (이전 메시지 로드는 제외)
    useEffect(() => {
        const lastMessageId = messages[messages.length - 1]?.id ?? null;
        const prevLastMessageId = prevLastMessageIdRef.current;

        if (prevLastMessageId && lastMessageId && prevLastMessageId !== lastMessageId) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevLastMessageIdRef.current = lastMessageId;
    }, [messages]);

    // 초기 로드 시 스크롤을 맨 아래로
    useEffect(() => {
        if (didInitialScrollRef.current) return;
        if (!isLoading && messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: "instant" });
            prevLastMessageIdRef.current = messages[messages.length - 1]?.id ?? null;
            didInitialScrollRef.current = true;
        }
    }, [isLoading, messages]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Empty
                    Icon={<MessageSquare className="w-12 h-12 text-gray-300" />}
                    title="아직 대화가 없습니다"
                    description="첫 메시지를 보내보세요!"
                />
            </div>
        );
    }

    // 날짜별 그룹핑
    const groupedMessages = messages.reduce<Record<string, LeadMessage[]>>(
        (acc, message) => {
            const date = dayjs(message.createdAt).format("YYYY-MM-DD");
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(message);
            return acc;
        },
        {},
    );

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 이전 메시지 로드 */}
            {hasMore && onLoadMore && (
                <div className="flex justify-center py-1">
                    <button
                        type="button"
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-[#0a3b41] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        {isLoadingMore && <Spinner size="xs" />}
                        이전 메시지 더 보기
                    </button>
                </div>
            )}

            {/* 새로고침 인디케이터 */}
            {isFetching && !isLoading && (
                <div className="flex justify-center py-2">
                    <Spinner size="sm" />
                </div>
            )}

            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                    {/* 날짜 구분선 */}
                    <div className="flex items-center justify-center my-4">
                        <span className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">
                            {dayjs(date).format("YYYY년 MM월 DD일")}
                        </span>
                    </div>

                    {/* 메시지 목록 */}
                    {dateMessages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isOwn={message.senderId === currentUserId}
                        />
                    ))}
                </div>
            ))}

            {/* 스크롤 앵커 */}
            <div ref={bottomRef} />
        </div>
    );
}
