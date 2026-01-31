"use client";

import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "@/api-client/leads";
import { MessageList } from "@/app/(main)/mypage/leads/[id]/components/MessageList";
import { MessageInput } from "@/app/(main)/mypage/leads/[id]/components/MessageInput";

interface MessagesTabProps {
    leadId: string;
    currentUserId: string;
}

const PAGE_SIZE = 50;

export function MessagesTab({ leadId, currentUserId }: MessagesTabProps) {
    const queryClient = useQueryClient();
    const lastAttemptedIdsRef = useRef<string>("");
    const lastAttemptedAtRef = useRef<number>(0);
    const RETRY_WINDOW_MS = 30000; // 30초 내 같은 배치 재시도 방지

    // 메시지 목록 조회
    const {
        data,
        isLoading,
        isFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["lead-messages", leadId],
        queryFn: ({ pageParam }) => leadsApi.getMessages(leadId, { page: pageParam, pageSize: PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const { page, pageSize, total } = lastPage.data;
            return page * pageSize < total ? page + 1 : undefined;
        },
        staleTime: 30000,
        refetchInterval: 30000,
    });

    const messages = useMemo(() => {
        const pages = data?.pages ?? [];
        return pages
            .slice()
            .reverse()
            .flatMap((page) => page.data.items ?? []);
    }, [data]);

    // 읽지 않은 메시지 ID 추출 (상대방이 보낸 것만)
    const unreadMessageIds = useMemo(() => {
        return messages
            .filter((m) => m.senderId !== currentUserId && !m.readAt)
            .map((m) => m.id);
    }, [messages, currentUserId]);

    // 읽음 표시 mutation
    const markAsReadMutation = useMutation({
        mutationFn: (messageIds: string[]) =>
            leadsApi.markMessagesAsRead(leadId, { messageIds }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lead-messages", leadId] });
            queryClient.invalidateQueries({ queryKey: ["lead-messages-unread", leadId] });
        },
    });

    const isPending = markAsReadMutation.isPending;
    const markAsRead = markAsReadMutation.mutate;

    // 탭 진입 시 읽지 않은 메시지 자동 읽음 처리 (실패 시 재시도 가능)
    useEffect(() => {
        const idsKey = unreadMessageIds.join(",");
        if (!idsKey || isPending) return;

        const now = Date.now();
        const sameBatch = lastAttemptedIdsRef.current === idsKey;
        if (sameBatch && now - lastAttemptedAtRef.current < RETRY_WINDOW_MS) return;

        lastAttemptedIdsRef.current = idsKey;
        lastAttemptedAtRef.current = now;
        markAsRead(unreadMessageIds);
    }, [unreadMessageIds, isPending, markAsRead]);

    // 메시지 발송 mutation
    const sendMessageMutation = useMutation({
        mutationFn: ({
            content,
            attachmentFileIds,
        }: {
            content: string;
            attachmentFileIds: string[];
        }) =>
            leadsApi.sendMessage(leadId, {
                content,
                attachmentFileIds: attachmentFileIds.length > 0 ? attachmentFileIds : undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lead-messages", leadId] });
            queryClient.invalidateQueries({ queryKey: ["lead-messages-unread", leadId] });
        },
    });

    const handleSend = (content: string, attachmentFileIds: string[]) => {
        sendMessageMutation.mutate({ content, attachmentFileIds });
    };

    const isRefreshing = isFetching && !isFetchingNextPage;

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-100 overflow-hidden">
            <MessageList
                messages={messages}
                currentUserId={currentUserId}
                isLoading={isLoading}
                isFetching={isRefreshing}
                hasMore={hasNextPage}
                isLoadingMore={isFetchingNextPage}
                onLoadMore={() => fetchNextPage()}
            />
            <MessageInput
                onSend={handleSend}
                isSending={sendMessageMutation.isPending}
            />
        </div>
    );
}
