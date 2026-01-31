"use client";

import { useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dayjs from "dayjs";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { supportApi } from "@/api-client/support";
import { useProfile } from "@/stores/auth";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { TicketStatusBadge } from "@/app/(main)/mypage/support/components/TicketStatusBadge";
import { MessageList } from "@/app/(main)/mypage/support/components/MessageList";
import { MessageInput } from "@/app/(main)/mypage/support/components/MessageInput";

export default function PartnerSupportDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const profile = useProfile();
    const currentUserId = profile?.id ?? "";

    const lastAttemptedAtRef = useRef<number>(0);
    const RETRY_WINDOW_MS = 30000;

    // 티켓 상세 조회
    const { data, isLoading } = useQuery({
        queryKey: ["support", "ticket", params.id],
        queryFn: () => supportApi.getDetail(params.id),
        refetchInterval: 30000,
    });

    const ticket = data?.data?.ticket;
    const messages = useMemo(() => data?.data?.messages ?? [], [data?.data?.messages]);

    // 읽지 않은 메시지 ID 추출 (상대방이 보낸 것만)
    const unreadCount = useMemo(() => {
        return messages.filter((m) => m.senderId !== currentUserId && !m.readAt).length;
    }, [messages, currentUserId]);

    // 읽음 표시 mutation
    const markAsReadMutation = useMutation({
        mutationFn: () => supportApi.markMessagesAsRead(params.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["support", "ticket", params.id] });
            queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
        },
    });

    // 페이지 진입 시 읽음 처리
    useEffect(() => {
        if (unreadCount === 0 || markAsReadMutation.isPending) return;

        const now = Date.now();
        if (now - lastAttemptedAtRef.current < RETRY_WINDOW_MS) return;

        lastAttemptedAtRef.current = now;
        markAsReadMutation.mutate();
    }, [unreadCount, markAsReadMutation]);

    // 메시지 발송 mutation
    const sendMessageMutation = useMutation({
        mutationFn: (content: string) => supportApi.sendMessage(params.id, { content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["support", "ticket", params.id] });
            queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
        },
        onError: () => {
            toast.error("메시지 전송에 실패했습니다.");
        },
    });

    // 티켓 재오픈 mutation
    const reopenMutation = useMutation({
        mutationFn: () => supportApi.reopen(params.id),
        onSuccess: () => {
            toast.success("문의가 재오픈되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["support", "ticket", params.id] });
            queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
        },
        onError: () => {
            toast.error("재오픈에 실패했습니다.");
        },
    });

    const handleSend = (content: string) => {
        sendMessageMutation.mutate(content);
    };

    const handleReopen = () => {
        reopenMutation.mutate();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">문의를 찾을 수 없습니다.</p>
                <Button variant="secondary" size="sm" onClick={() => router.back()} className="mt-4">
                    돌아가기
                </Button>
            </div>
        );
    }

    const isClosed = ticket.status === "closed";
    const canReopen = ticket.status === "resolved";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <TicketStatusBadge status={ticket.status} />
                        {ticket.category && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {ticket.category.name}
                            </span>
                        )}
                    </div>
                    <h1 className="text-lg font-bold text-[#0a3b41] truncate">{ticket.title}</h1>
                </div>
                {canReopen && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleReopen}
                        isLoading={reopenMutation.isPending}
                        LeadingIcon={<RotateCcw />}
                    >
                        재오픈
                    </Button>
                )}
            </div>

            {/* Ticket Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-sm text-gray-500">
                    <span>접수일: {dayjs(ticket.createdAt).format("YYYY.MM.DD HH:mm")}</span>
                    {ticket.resolvedAt && (
                        <span className="ml-4">해결일: {dayjs(ticket.resolvedAt).format("YYYY.MM.DD HH:mm")}</span>
                    )}
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.content}</p>
                </div>
            </div>

            {/* Message Thread */}
            <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-200 overflow-hidden">
                <MessageList messages={messages} currentUserId={currentUserId} isLoading={false} />
                <MessageInput onSend={handleSend} isSending={sendMessageMutation.isPending} disabled={isClosed} />
            </div>
        </div>
    );
}
