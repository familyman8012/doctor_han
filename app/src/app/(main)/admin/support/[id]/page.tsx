"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dayjs from "dayjs";
import { ArrowLeft, ChevronDown, ChevronUp, User, Mail, Clock } from "lucide-react";
import { adminApi } from "@/api-client/admin";
import { useProfile } from "@/stores/auth";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { TicketStatusBadge } from "@/app/(main)/mypage/support/components/TicketStatusBadge";
import { MessageList } from "@/app/(main)/mypage/support/components/MessageList";
import { MessageInput } from "@/app/(main)/mypage/support/components/MessageInput";
import { SlaStatusBadge } from "../components/SlaStatusBadge";
import type { SupportTicketStatus } from "@/lib/schema/support";

const STATUS_CHANGE_OPTIONS: { value: "in_progress" | "resolved" | "closed"; label: string }[] = [
    { value: "in_progress", label: "처리중" },
    { value: "resolved", label: "해결" },
    { value: "closed", label: "종료" },
];

export default function AdminSupportDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const profile = useProfile();
    const currentUserId = profile?.id ?? "";

    const [showStatusHistory, setShowStatusHistory] = useState(false);
    const [statusNote, setStatusNote] = useState("");

    // 티켓 상세 조회
    const { data, isLoading } = useQuery({
        queryKey: ["admin", "support", "ticket", params.id],
        queryFn: () => adminApi.getSupportTicket(params.id),
        refetchInterval: 30000,
    });

    const ticket = data?.data?.ticket;
    const messages = data?.data?.messages ?? [];
    const statusHistory = data?.data?.statusHistory ?? [];

    // 메시지 발송 mutation
    const sendMessageMutation = useMutation({
        mutationFn: (content: string) => adminApi.sendSupportMessage(params.id, { content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "support", "ticket", params.id] });
            queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
        },
        onError: () => {
            toast.error("메시지 전송에 실패했습니다.");
        },
    });

    // 상태 변경 mutation
    const changeStatusMutation = useMutation({
        mutationFn: (status: "in_progress" | "resolved" | "closed") =>
            adminApi.changeSupportTicketStatus(params.id, {
                status,
                note: statusNote || undefined,
            }),
        onSuccess: () => {
            toast.success("상태가 변경되었습니다.");
            setStatusNote("");
            queryClient.invalidateQueries({ queryKey: ["admin", "support", "ticket", params.id] });
            queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
        },
        onError: () => {
            toast.error("상태 변경에 실패했습니다.");
        },
    });

    const handleSend = (content: string) => {
        sendMessageMutation.mutate(content);
    };

    const handleStatusChange = (status: "in_progress" | "resolved" | "closed") => {
        changeStatusMutation.mutate(status);
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

    const canChangeStatus = ticket.status !== "closed";
    const isClosed = ticket.status === "closed";
    const inputPlaceholder = isClosed ? "종료된 문의입니다" : "메시지를 입력하세요...";

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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <TicketStatusBadge status={ticket.status} />
                        <SlaStatusBadge status={ticket.slaStatus} />
                        {ticket.category && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {ticket.category.name}
                            </span>
                        )}
                    </div>
                    <h1 className="text-lg font-bold text-[#0a3b41] truncate">{ticket.title}</h1>
                </div>
            </div>

            {/* Ticket Info + User Info + Status Change */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-[#62e3d5]/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-[#62e3d5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#0a3b41]">{ticket.user.displayName}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            {ticket.user.email && (
                                <span className="flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5" />
                                    {ticket.user.email}
                                </span>
                            )}
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{ticket.user.role}</span>
                        </div>
                    </div>
                </div>

                {/* Ticket Dates */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        접수: {dayjs(ticket.createdAt).format("YYYY.MM.DD HH:mm")}
                    </span>
                    <span>
                        최초 응답 SLA: {dayjs(ticket.slaFirstResponseDue).format("YYYY.MM.DD HH:mm")}
                        {ticket.firstResponseAt && (
                            <span className="text-green-600 ml-1">
                                (완료: {dayjs(ticket.firstResponseAt).format("MM.DD HH:mm")})
                            </span>
                        )}
                    </span>
                    <span>해결 SLA: {dayjs(ticket.slaResolutionDue).format("YYYY.MM.DD HH:mm")}</span>
                    {ticket.resolvedAt && (
                        <span className="text-green-600">해결: {dayjs(ticket.resolvedAt).format("YYYY.MM.DD HH:mm")}</span>
                    )}
                </div>

                {/* Original Content */}
                <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.content}</p>
                </div>

                {/* Status Change */}
                {canChangeStatus && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-100">
                        <input
                            type="text"
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="상태 변경 메모 (선택)"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62e3d5]"
                            maxLength={500}
                        />
                        <div className="flex gap-2">
                            {STATUS_CHANGE_OPTIONS.filter((opt) => opt.value !== ticket.status).map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant={opt.value === "closed" ? "danger" : "secondary"}
                                    size="sm"
                                    onClick={() => handleStatusChange(opt.value)}
                                    isLoading={changeStatusMutation.isPending}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Message Thread */}
            <div className="flex flex-col h-[400px] bg-white rounded-xl border border-gray-200 overflow-hidden">
                <MessageList messages={messages} currentUserId={currentUserId} isLoading={false} />
                <MessageInput
                    onSend={handleSend}
                    isSending={sendMessageMutation.isPending}
                    disabled={isClosed}
                    placeholder={inputPlaceholder}
                />
            </div>

            {/* Status History */}
            {statusHistory.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowStatusHistory(!showStatusHistory)}
                        className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors"
                    >
                        <span className="font-medium text-[#0a3b41]">상태 변경 이력 ({statusHistory.length})</span>
                        {showStatusHistory ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </button>
                    {showStatusHistory && (
                        <div className="border-t border-gray-100">
                            <ul className="divide-y divide-gray-100">
                                {statusHistory.map((history) => (
                                    <li key={history.id} className="p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-gray-400">
                                                {dayjs(history.createdAt).format("YYYY.MM.DD HH:mm")}
                                            </span>
                                            {history.fromStatus && (
                                                <>
                                                    <TicketStatusBadge
                                                        status={history.fromStatus as SupportTicketStatus}
                                                        size="xs"
                                                    />
                                                    <span className="text-gray-400">→</span>
                                                </>
                                            )}
                                            <TicketStatusBadge status={history.toStatus} size="xs" />
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            변경자: {history.changedByUser?.displayName ?? "시스템"}
                                        </p>
                                        {history.note && <p className="text-sm text-gray-500 mt-1">{history.note}</p>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
