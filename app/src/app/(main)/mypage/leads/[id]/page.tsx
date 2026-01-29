"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dayjs from "dayjs";
import { ArrowLeft, Building2, Phone, Mail, Clock, FileText, XCircle } from "lucide-react";
import { leadsApi } from "@/api-client/leads";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Badge, type BadgeColor } from "@/components/ui/Badge/Badge";
import { Tabs } from "@/components/ui/Tab/Tab";
import { useIsAuthenticated, useUserRole, useAuthStore, useUser } from "@/stores/auth";
import { LeadStatusHistory } from "./components/StatusHistory";
import { LeadAttachments } from "./components/Attachments";
import { MessagesTab } from "./components/MessagesTab";
import type { LeadStatus } from "@/lib/schema/lead";

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

const CHANNEL_LABELS: Record<string, string> = {
    phone: "전화",
    email: "이메일",
    kakao: "카카오톡",
    sms: "문자",
};

const TIME_LABELS: Record<string, string> = {
    morning: "오전 (09:00~12:00)",
    afternoon: "오후 (12:00~18:00)",
    evening: "저녁 (18:00~21:00)",
    anytime: "상관없음",
};

export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const leadId = params.id as string;
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const user = useUser();
    const { isInitialized } = useAuthStore();
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    // 리드 상세 조회
    const { data, isLoading, isError } = useQuery({
        queryKey: ["lead", leadId],
        queryFn: () => leadsApi.getDetail(leadId),
        enabled: isAuthenticated,
    });

    // 안 읽은 메시지 수 조회
    const { data: messagesData } = useQuery({
        queryKey: ["lead-messages", leadId],
        queryFn: () => leadsApi.getMessages(leadId, { pageSize: 50 }),
        enabled: isAuthenticated && !!leadId,
        staleTime: 30000,
    });

    const userId = user?.id;
    const unreadCount = useMemo(() => {
        if (!messagesData?.data?.items || !userId) return 0;
        return messagesData.data.items.filter(
            (m) => m.senderId !== userId && !m.readAt,
        ).length;
    }, [messagesData, userId]);

    // 문의 취소 mutation
    const cancelMutation = useMutation({
        mutationFn: () => leadsApi.updateStatus(leadId, "canceled"),
        onSuccess: () => {
            toast.success("문의가 취소되었습니다");
            queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });

    const handleCancel = () => {
        if (!confirm("정말로 이 문의를 취소하시겠습니까?")) return;
        cancelMutation.mutate();
    };

    // 로딩 중
    if (!isInitialized) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    // 권한 체크
    if (!isAuthenticated) {
        router.replace("/login");
        return null;
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isError || !data?.data?.lead) {
        return (
            <div className="py-20">
                <Empty
                    title="문의를 찾을 수 없습니다"
                    description="요청하신 문의 정보가 존재하지 않습니다"
                />
            </div>
        );
    }

    const lead = data.data.lead;
    const statusConfig = STATUS_CONFIG[lead.status];
    const canCancel = role === "doctor" && !["canceled", "closed", "contracted"].includes(lead.status);

    const tabs = [
        { title: "상세정보" },
        { title: "대화", label: unreadCount > 0 ? String(unreadCount) : undefined },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/mypage/leads" className="hover:text-[#0a3b41] flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    내 문의함
                </Link>
            </nav>

            {/* 헤더 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <Badge color={statusConfig.color} size="md">{statusConfig.label}</Badge>
                        <h1 className="text-xl font-bold text-[#0a3b41] mt-2 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            {lead.vendor?.name ?? "업체 정보 없음"}
                        </h1>
                        {lead.serviceName && (
                            <p className="text-gray-500 mt-1">{lead.serviceName}</p>
                        )}
                    </div>
                    {canCancel && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleCancel}
                            isLoading={cancelMutation.isPending}
                            LeadingIcon={<XCircle className="w-4 h-4" />}
                        >
                            문의 취소
                        </Button>
                    )}
                </div>

                <p className="text-xs text-gray-400">
                    {dayjs(lead.createdAt).format("YYYY년 MM월 DD일 HH:mm")} 접수
                </p>
            </div>

            {/* 탭 */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <Tabs
                    id="lead-detail-tabs"
                    tabs={tabs}
                    activeTabIndex={activeTabIndex}
                    onTabChange={setActiveTabIndex}
                    className="px-4"
                />

                {/* 탭 컨텐츠 */}
                <div className="p-6">
                    {activeTabIndex === 0 && (
                        <div className="space-y-6">
                            {/* 문의 내용 */}
                            <div>
                                <h2 className="text-lg font-bold text-[#0a3b41] mb-4">문의 내용</h2>
                                <p className="text-gray-700 whitespace-pre-wrap">{lead.content}</p>
                            </div>

                            {/* 연락처 정보 */}
                            <div>
                                <h2 className="text-lg font-bold text-[#0a3b41] mb-4">연락처 정보</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">연락처</p>
                                            <p className="text-[#0a3b41] font-medium">{lead.contactPhone}</p>
                                        </div>
                                    </div>
                                    {lead.contactEmail && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">이메일</p>
                                                <p className="text-[#0a3b41] font-medium">{lead.contactEmail}</p>
                                            </div>
                                        </div>
                                    )}
                                    {lead.preferredChannel && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">선호 연락 방법</p>
                                                <p className="text-[#0a3b41] font-medium">
                                                    {CHANNEL_LABELS[lead.preferredChannel] ?? lead.preferredChannel}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {lead.preferredTime && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">선호 연락 시간</p>
                                                <p className="text-[#0a3b41] font-medium">
                                                    {TIME_LABELS[lead.preferredTime] ?? lead.preferredTime}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 첨부파일 */}
                            {lead.attachments.length > 0 && (
                                <LeadAttachments attachments={lead.attachments} />
                            )}

                            {/* 상태 이력 */}
                            {lead.statusHistory.length > 0 && (
                                <LeadStatusHistory history={lead.statusHistory} />
                            )}
                        </div>
                    )}

                    {activeTabIndex === 1 && user?.id && (
                        <MessagesTab leadId={leadId} currentUserId={user.id} />
                    )}
                </div>
            </div>
        </div>
    );
}
