"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { adsApi } from "@/api-client/ads";
import type { AdCampaignStatus } from "@/lib/schema/ad";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { cn } from "@/components/utils";

const STATUS_LABELS: Record<string, string> = {
    draft: "초안",
    pending: "대기",
    active: "활성",
    paused: "일시중지",
    completed: "완료",
    canceled: "취소",
};

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    paused: "bg-orange-100 text-orange-800",
    completed: "bg-blue-100 text-blue-800",
    canceled: "bg-red-100 text-red-800",
};

export default function CampaignDetailPage() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [editingName, setEditingName] = useState(false);
    const [name, setName] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "ads", "campaign", id],
        queryFn: () => adsApi.getAdminCampaign(id),
        enabled: !!id,
    });

    const campaign = data?.data?.campaign;
    const creatives = data?.data?.creatives ?? [];
    const slot = data?.data?.slot;

    const statusMutation = useMutation({
        mutationFn: (status: AdCampaignStatus) =>
            adsApi.updateAdminCampaign(id, { status }),
        onSuccess: () => {
            toast.success("상태가 변경되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin", "ads", "campaign", id] });
        },
        onError: () => {
            toast.error("상태 변경에 실패했습니다.");
        },
    });

    const nameMutation = useMutation({
        mutationFn: (advertiserName: string) =>
            adsApi.updateAdminCampaign(id, { advertiserName }),
        onSuccess: () => {
            toast.success("광고주명이 변경되었습니다.");
            setEditingName(false);
            queryClient.invalidateQueries({ queryKey: ["admin", "ads", "campaign", id] });
        },
        onError: () => {
            toast.error("변경에 실패했습니다.");
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!campaign) {
        return <Empty title="캠페인을 찾을 수 없습니다" description="존재하지 않거나 삭제된 캠페인입니다." />;
    }

    const ctr = campaign.totalImpressions > 0
        ? ((campaign.totalClicks / campaign.totalImpressions) * 100).toFixed(2)
        : "0.00";

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/admin/ads/campaigns" className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-[#0a3b41]">캠페인 상세</h1>
            </div>

            {/* Campaign info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        {editingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#62e3d5]"
                                />
                                <button onClick={() => nameMutation.mutate(name)} className="text-sm text-[#62e3d5]">저장</button>
                                <button onClick={() => setEditingName(false)} className="text-sm text-gray-400">취소</button>
                            </div>
                        ) : (
                            <h2
                                className="text-xl font-bold text-[#0a3b41] cursor-pointer hover:underline"
                                onClick={() => { setName(campaign.advertiserName); setEditingName(true); }}
                            >
                                {campaign.advertiserName}
                            </h2>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                            슬롯: {slot?.name ?? "알 수 없음"} ({slot?.position})
                        </p>
                    </div>
                    <span className={cn("px-3 py-1 text-sm font-medium rounded-full", STATUS_COLORS[campaign.status])}>
                        {STATUS_LABELS[campaign.status]}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-gray-500">기간</p>
                        <p className="text-sm font-medium">
                            {new Date(campaign.startsAt).toLocaleDateString("ko-KR")} ~{" "}
                            {new Date(campaign.endsAt).toLocaleDateString("ko-KR")}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">월 광고비</p>
                        <p className="text-sm font-medium">{campaign.monthlyPrice.toLocaleString()}원</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">총 노출수</p>
                        <p className="text-sm font-medium">{campaign.totalImpressions.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">총 클릭수 (CTR)</p>
                        <p className="text-sm font-medium">{campaign.totalClicks.toLocaleString()} ({ctr}%)</p>
                    </div>
                </div>

                {/* Status change buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {campaign.status !== "active" && campaign.status !== "completed" && campaign.status !== "canceled" && (
                        <button
                            onClick={() => statusMutation.mutate("active")}
                            disabled={statusMutation.isPending}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                        >
                            활성화
                        </button>
                    )}
                    {campaign.status === "active" && (
                        <button
                            onClick={() => statusMutation.mutate("paused")}
                            disabled={statusMutation.isPending}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50"
                        >
                            일시중지
                        </button>
                    )}
                    {campaign.status !== "completed" && campaign.status !== "canceled" && (
                        <button
                            onClick={() => statusMutation.mutate("completed")}
                            disabled={statusMutation.isPending}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                        >
                            완료 처리
                        </button>
                    )}
                </div>
            </div>

            {/* Creatives */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#0a3b41]">크리에이티브 ({creatives.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {creatives.map((creative) => (
                        <div key={creative.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {creative.imageUrl && (
                                <img
                                    src={creative.imageUrl}
                                    alt={creative.title}
                                    className="w-full h-40 object-cover"
                                />
                            )}
                            <div className="p-4 space-y-1">
                                <p className="font-medium text-[#0a3b41]">{creative.title}</p>
                                <a
                                    href={creative.clickUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-500 hover:underline truncate block"
                                >
                                    {creative.clickUrl}
                                </a>
                                <p className="text-xs text-gray-400">
                                    {creative.isActive ? "활성" : "비활성"} | {creative.type}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
