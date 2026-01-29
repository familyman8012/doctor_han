"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dayjs from "dayjs";
import { AlertTriangle, Shield, Ban, Clock, XCircle, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { Badge } from "@/components/ui/Badge/Badge";
import { adminApi } from "@/api-client/admin";
import type { SanctionView, SanctionType, SanctionStatus } from "@/lib/schema/report";

interface SanctionHistoryPanelProps {
    sanctions: SanctionView[];
}

const SANCTION_TYPE_LABELS: Record<SanctionType, string> = {
    warning: "경고",
    suspension: "일시정지",
    permanent_ban: "영구정지",
};

const SANCTION_TYPE_ICONS: Record<SanctionType, typeof AlertTriangle> = {
    warning: AlertTriangle,
    suspension: Clock,
    permanent_ban: Ban,
};

const SANCTION_TYPE_COLORS: Record<SanctionType, "warning" | "orange" | "error"> = {
    warning: "warning",
    suspension: "orange",
    permanent_ban: "error",
};

export function SanctionHistoryPanel({ sanctions }: SanctionHistoryPanelProps) {
    const queryClient = useQueryClient();
    const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
    const [revokeReason, setRevokeReason] = useState("");

    const revokeMutation = useMutation({
        mutationFn: (sanctionId: string) => adminApi.revokeSanction(sanctionId, { reason: revokeReason }),
        onSuccess: () => {
            toast.success("제재가 해제되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "report"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "sanctions"] });
            setRevokeTarget(null);
            setRevokeReason("");
        },
    });

    const handleRevoke = (e: React.FormEvent) => {
        e.preventDefault();
        if (!revokeTarget || !revokeReason.trim()) return;
        revokeMutation.mutate(revokeTarget);
    };

    const getStatusBadge = (status: SanctionStatus) => {
        switch (status) {
            case "active":
                return (
                    <Badge color="error" size="xs">
                        <Shield className="w-3 h-3 mr-1" />
                        활성
                    </Badge>
                );
            case "expired":
                return (
                    <Badge color="neutral" size="xs">
                        <Clock className="w-3 h-3 mr-1" />
                        만료
                    </Badge>
                );
            case "revoked":
                return (
                    <Badge color="info" size="xs">
                        <Undo2 className="w-3 h-3 mr-1" />
                        해제됨
                    </Badge>
                );
        }
    };

    return (
        <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-700 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                제재 이력 ({sanctions.length}건)
            </h3>
            <div className="space-y-3">
                {sanctions.map((sanction) => {
                    const Icon = SANCTION_TYPE_ICONS[sanction.sanctionType];
                    const isActive = sanction.status === "active";

                    return (
                        <div key={sanction.id} className="bg-white rounded-lg p-3 border border-red-200">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge color={SANCTION_TYPE_COLORS[sanction.sanctionType]} size="xs">
                                            <Icon className="w-3 h-3 mr-1" />
                                            {SANCTION_TYPE_LABELS[sanction.sanctionType]}
                                        </Badge>
                                        {getStatusBadge(sanction.status)}
                                        {sanction.durationDays && (
                                            <span className="text-xs text-gray-500">
                                                {sanction.durationDays}일
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-700">{sanction.reason}</p>
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span>부과: {dayjs(sanction.startsAt).format("YYYY.MM.DD")}</span>
                                        {sanction.endsAt && (
                                            <span className="ml-2">
                                                만료: {dayjs(sanction.endsAt).format("YYYY.MM.DD")}
                                            </span>
                                        )}
                                        <span className="ml-2">by {sanction.createdBy.displayName}</span>
                                    </div>
                                    {sanction.status === "revoked" && sanction.revokedBy && (
                                        <div className="text-xs text-blue-600 mt-1">
                                            해제: {dayjs(sanction.revokedAt).format("YYYY.MM.DD")} by {sanction.revokedBy.displayName}
                                            {sanction.revokeReason && (
                                                <span className="ml-1">- {sanction.revokeReason}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {isActive && (
                                    <Button
                                        variant="secondary"
                                        size="xs"
                                        onClick={() => setRevokeTarget(sanction.id)}
                                        LeadingIcon={<Undo2 />}
                                    >
                                        해제
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Revoke Modal */}
            {revokeTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setRevokeTarget(null)} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl mx-4">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-[#0a3b41]">제재 해제</h2>
                            <button
                                type="button"
                                onClick={() => setRevokeTarget(null)}
                                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <XCircle className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleRevoke}>
                            <div className="p-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2">해제 사유</label>
                                <textarea
                                    value={revokeReason}
                                    onChange={(e) => setRevokeReason(e.target.value)}
                                    placeholder="제재 해제 사유를 입력해주세요"
                                    className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#62e3d5] focus:border-transparent"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                                <Button type="button" variant="secondary" onClick={() => setRevokeTarget(null)}>
                                    취소
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={revokeMutation.isPending}
                                    disabled={!revokeReason.trim()}
                                >
                                    해제하기
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
