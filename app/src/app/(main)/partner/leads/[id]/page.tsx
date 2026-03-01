"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dayjs from "dayjs";
import { ArrowLeft, User, Phone, Mail, Clock, FileText, MessageSquare } from "lucide-react";
import { leadsApi } from "@/api-client/leads";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { Badge, type BadgeColor } from "@/components/ui/Badge/Badge";
import { Tabs } from "@/components/ui/Tab/Tab";
import { useIsAuthenticated, useUserRole, useAuthStore, useUser } from "@/stores/auth";
import { StatusChangeModal } from "./components/StatusChangeModal";
import { LeadStatusHistory } from "./components/StatusHistory";
import { LeadAttachments } from "./components/Attachments";
import { MessagesTab } from "./components/MessagesTab";
import type { LeadStatus, LeadReportReason } from "@/lib/schema/lead";

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

const CHARGE_STATUS_CONFIG: Record<string, { label: string; color: BadgeColor }> = {
    charged: { label: "과금됨", color: "primary" },
    pending: { label: "보류", color: "warning" },
    refunded: { label: "환불됨", color: "info" },
    waived: { label: "면제", color: "neutral" },
    failed: { label: "실패", color: "error" },
};

const REPORT_REASON_OPTIONS: { value: LeadReportReason; label: string }[] = [
    { value: "wrong_contact", label: "잘못된 연락처" },
    { value: "test_inquiry", label: "테스트 문의" },
    { value: "competitor", label: "경쟁사 문의" },
    { value: "inappropriate", label: "부적절한 내용" },
    { value: "other", label: "기타" },
];

export default function PartnerLeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const leadId = params.id as string;
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const user = useUser();
    const { isInitialized } = useAuthStore();
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState<LeadReportReason | "">("");
    const [reportDetail, setReportDetail] = useState("");

    // 리드 상세 조회
    const { data, isLoading, isError } = useQuery({
        queryKey: ["lead", leadId],
        queryFn: () => leadsApi.getDetail(leadId),
        enabled: isAuthenticated,
    });

    // 메시지 요약 (unreadCount 포함)
    const { data: messagesData } = useQuery({
        queryKey: ["lead-messages-unread", leadId],
        queryFn: () => leadsApi.getMessages(leadId, { page: 1, pageSize: 1 }),
        enabled: isAuthenticated && !!leadId,
        staleTime: 30000,
        refetchInterval: 30000,
    });

    const unreadCount = messagesData?.data?.unreadCount ?? 0;

    // 상태 변경 mutation
    const updateStatusMutation = useMutation({
        mutationFn: (status: LeadStatus) => leadsApi.updateStatus(leadId, status),
        onSuccess: () => {
            toast.success("상태가 변경되었습니다");
            queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            setShowStatusModal(false);
        },
    });

    // 허위 리드 신고 mutation
    const reportLeadMutation = useMutation({
        mutationFn: () =>
            leadsApi.reportLead(leadId, {
                reason: reportReason as LeadReportReason,
                detail: reportDetail || undefined,
            }),
        onSuccess: () => {
            toast.success("신고가 접수되었습니다");
            setShowReportModal(false);
            setReportReason("");
            setReportDetail("");
        },
    });

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

    if (role !== "vendor") {
        router.replace("/");
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
    const canChangeStatus = !["canceled", "closed"].includes(lead.status);

    const tabs = [
        { title: "상세정보" },
        { title: "대화", label: unreadCount > 0 ? String(unreadCount) : undefined },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/partner/leads" className="hover:text-[#0a3b41] flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    받은 리드함
                </Link>
            </nav>

            {/* 헤더 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <Badge color={statusConfig.color} size="md">{statusConfig.label}</Badge>
                        {lead.serviceName && (
                            <p className="text-gray-500 mt-2">{lead.serviceName}</p>
                        )}
                    </div>
                    {canChangeStatus && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowStatusModal(true)}
                        >
                            상태 변경
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
                    id="partner-lead-detail-tabs"
                    tabs={tabs}
                    activeTabIndex={activeTabIndex}
                    onTabChange={setActiveTabIndex}
                    className="px-4"
                />

                {/* 탭 컨텐츠 */}
                <div className="p-6">
                    {activeTabIndex === 0 && (
                        <div className="space-y-6">
                            {/* 고객 정보 */}
                            <div>
                                <h2 className="text-lg font-bold text-[#0a3b41] mb-4">고객 정보</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#62e3d5]/10 flex items-center justify-center">
                                            <User className="w-5 h-5 text-[#0a3b41]" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">이름</p>
                                            <p className="text-[#0a3b41] font-medium">{lead.contactName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">연락처</p>
                                            <a
                                                href={`tel:${lead.contactPhone}`}
                                                className="text-[#0a3b41] font-medium hover:text-[#62e3d5]"
                                            >
                                                {lead.contactPhone}
                                            </a>
                                        </div>
                                    </div>
                                    {lead.contactEmail && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Mail className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">이메일</p>
                                                <a
                                                    href={`mailto:${lead.contactEmail}`}
                                                    className="text-[#0a3b41] font-medium hover:text-[#62e3d5]"
                                                >
                                                    {lead.contactEmail}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {lead.preferredChannel && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <MessageSquare className="w-4 h-4 text-gray-500" />
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

                            {/* 과금 정보 */}
                            {lead.charge && (
                                <div>
                                    <h2 className="text-lg font-bold text-[#0a3b41] mb-4">과금 정보</h2>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">상태</span>
                                            <Badge
                                                color={CHARGE_STATUS_CONFIG[lead.charge.status]?.color ?? "neutral"}
                                                size="sm"
                                            >
                                                {CHARGE_STATUS_CONFIG[lead.charge.status]?.label ?? lead.charge.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">총 과금액</span>
                                            <span className="font-semibold text-[#0a3b41]">
                                                {lead.charge.totalAmount.toLocaleString()}원
                                            </span>
                                        </div>
                                        {lead.charge.priceBreakdown.length > 0 && (
                                            <div className="border-t border-gray-200 pt-3">
                                                <p className="text-xs text-gray-400 mb-2">서비스별 내역</p>
                                                {lead.charge.priceBreakdown.map((item) => (
                                                    <div
                                                        key={item.categoryId}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <span className="text-gray-600">{item.categoryName}</span>
                                                        <span className="text-gray-800">
                                                            {item.price.toLocaleString()}원
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {lead.charge.isDuplicate && (
                                            <p className="text-xs text-amber-600">
                                                30일 이내 중복 문의로 과금이 면제되었습니다
                                            </p>
                                        )}
                                        {lead.charge.status === "refunded" && lead.charge.refundedAt && (
                                            <p className="text-xs text-blue-600">
                                                환불됨 ({dayjs(lead.charge.refundedAt).format("YYYY.MM.DD")})
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 문의 내용 */}
                            <div>
                                <h2 className="text-lg font-bold text-[#0a3b41] mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    문의 내용
                                </h2>
                                <p className="text-gray-700 whitespace-pre-wrap">{lead.content}</p>
                            </div>

                            {/* 첨부파일 */}
                            {lead.attachments.length > 0 && (
                                <LeadAttachments attachments={lead.attachments} />
                            )}

                            {/* 상태 이력 */}
                            {lead.statusHistory.length > 0 && (
                                <LeadStatusHistory history={lead.statusHistory} />
                            )}

                            {/* 허위 리드 신고 */}
                            <div className="pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(true)}
                                    className="text-sm text-red-500 hover:text-red-600 underline"
                                >
                                    허위 리드 신고
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTabIndex === 1 && user?.id && (
                        <MessagesTab leadId={leadId} currentUserId={user.id} />
                    )}
                </div>
            </div>

            {/* 상태 변경 모달 */}
            {showStatusModal && (
                <StatusChangeModal
                    currentStatus={lead.status}
                    isLoading={updateStatusMutation.isPending}
                    onClose={() => setShowStatusModal(false)}
                    onConfirm={(status) => updateStatusMutation.mutate(status)}
                />
            )}

            {/* 허위 리드 신고 모달 */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
                        <h3 className="text-lg font-bold text-[#0a3b41]">허위 리드 신고</h3>
                        <div>
                            <label className="block text-sm font-medium text-[#0a3b41] mb-1.5">
                                사유
                            </label>
                            <select
                                className="w-full h-[38px] px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#62e3d5]"
                                value={reportReason}
                                onChange={(e) =>
                                    setReportReason(e.target.value as LeadReportReason | "")
                                }
                            >
                                <option value="">선택해주세요</option>
                                {REPORT_REASON_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#0a3b41] mb-1.5">
                                상세 내용 (선택)
                            </label>
                            <textarea
                                className="w-full min-h-[80px] px-3 py-2 text-sm border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-[#62e3d5]"
                                placeholder="신고 사유를 구체적으로 작성해주세요"
                                value={reportDetail}
                                onChange={(e) => setReportDetail(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    setShowReportModal(false);
                                    setReportReason("");
                                    setReportDetail("");
                                }}
                            >
                                취소
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                disabled={!reportReason || reportLeadMutation.isPending}
                                isLoading={reportLeadMutation.isPending}
                                onClick={() => reportLeadMutation.mutate()}
                            >
                                신고하기
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
