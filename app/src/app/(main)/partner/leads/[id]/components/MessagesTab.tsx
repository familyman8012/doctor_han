"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { leadsApi } from "@/api-client/leads";
import { MessageList } from "@/app/(main)/mypage/leads/[id]/components/MessageList";
import { MessageInput } from "@/app/(main)/mypage/leads/[id]/components/MessageInput";

interface MessagesTabProps {
    leadId: string;
    currentUserId: string;
}

export function MessagesTab({ leadId, currentUserId }: MessagesTabProps) {
    const queryClient = useQueryClient();

    // 메시지 목록 조회
    const {
        data,
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ["lead-messages", leadId],
        queryFn: () => leadsApi.getMessages(leadId, { pageSize: 50 }),
        staleTime: 30000, // 30초
        refetchInterval: 30000, // 30초마다 폴링
    });

    const messages = useMemo(() => {
        if (!data?.data?.items) return [];
        // API는 created_at ASC 정렬, 이미 정렬되어 있음
        return data.data.items;
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
        },
    });

    const isPending = markAsReadMutation.isPending;
    const markAsRead = markAsReadMutation.mutate;

    // 탭 진입 시 읽지 않은 메시지 자동 읽음 처리
    useEffect(() => {
        if (unreadMessageIds.length > 0 && !isPending) {
            markAsRead(unreadMessageIds);
        }
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
        },
        onError: () => {
            toast.error("메시지 전송에 실패했습니다");
        },
    });

    const handleSend = (content: string, attachmentFileIds: string[]) => {
        sendMessageMutation.mutate({ content, attachmentFileIds });
    };

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-100 overflow-hidden">
            <MessageList
                messages={messages}
                currentUserId={currentUserId}
                isLoading={isLoading}
                isFetching={isFetching}
            />
            <MessageInput
                onSend={handleSend}
                isSending={sendMessageMutation.isPending}
            />
        </div>
    );
}
