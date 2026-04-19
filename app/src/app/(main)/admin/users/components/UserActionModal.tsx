"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert, Ban, UserX, CheckCircle2, Trash2, X } from "lucide-react";
import dayjs from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Badge } from "@/components/ui/Badge/Badge";
import type { ProfileView } from "@/lib/schema/profile";
import type { AdminUserStatusPatchBody } from "@/lib/schema/admin";
import { toast } from "sonner";

type ActionMode =
    | "none"
    | "suspend"
    | "ban"
    | "inactive"
    | "restore"
    | "delete";

const SUSPEND_PRESETS = [
    { days: 7, label: "7일" },
    { days: 30, label: "30일" },
    { days: 90, label: "90일" },
];

interface Props {
    user: ProfileView;
    isOpen: boolean;
    onClose: () => void;
}

export function UserActionModal({ user, isOpen, onClose }: Props) {
    const qc = useQueryClient();
    const [mode, setMode] = useState<ActionMode>("none");
    const [reason, setReason] = useState("");
    const [suspendDays, setSuspendDays] = useState<number>(7);
    const [confirmEmail, setConfirmEmail] = useState("");

    const resetForm = useCallback(() => {
        setMode("none");
        setReason("");
        setSuspendDays(7);
        setConfirmEmail("");
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        },
        [handleClose],
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    const statusMutation = useMutation({
        mutationFn: (body: AdminUserStatusPatchBody) => adminApi.updateUserStatus(user.id, body),
        onSuccess: () => {
            toast.success("상태가 변경되었습니다.");
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
            handleClose();
        },
        onError: (err: unknown) => {
            const message = err instanceof Error ? err.message : "상태 변경에 실패했습니다.";
            toast.error(message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => adminApi.deleteUser(user.id, { reason, confirmEmail }),
        onSuccess: () => {
            toast.success("유저가 삭제되었습니다.");
            qc.invalidateQueries({ queryKey: ["admin", "users"] });
            handleClose();
        },
        onError: (err: unknown) => {
            const message = err instanceof Error ? err.message : "삭제에 실패했습니다.";
            toast.error(message);
        },
    });

    if (!isOpen) return null;

    const isPending = statusMutation.isPending || deleteMutation.isPending;

    const submit = () => {
        if (mode === "suspend") {
            if (!reason.trim()) return toast.error("사유를 입력해주세요.");
            const until = dayjs().add(suspendDays, "day").toISOString();
            statusMutation.mutate({ status: "suspended", suspendedUntil: until, reason });
            return;
        }
        if (mode === "ban") {
            if (!reason.trim()) return toast.error("사유를 입력해주세요.");
            statusMutation.mutate({ status: "banned", reason });
            return;
        }
        if (mode === "inactive") {
            if (!reason.trim()) return toast.error("사유를 입력해주세요.");
            statusMutation.mutate({ status: "inactive", reason });
            return;
        }
        if (mode === "restore") {
            statusMutation.mutate({ status: "active", reason: reason.trim() || undefined });
            return;
        }
        if (mode === "delete") {
            if (!reason.trim()) return toast.error("사유를 입력해주세요.");
            if (!confirmEmail.trim()) return toast.error("확인용 이메일을 입력해주세요.");
            deleteMutation.mutate();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50"
                onClick={isPending ? undefined : handleClose}
            />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                    <h2 className="text-lg font-semibold text-content-primary">유저 상태 관리</h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isPending}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
                        aria-label="닫기"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* User Info */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-content-primary">
                                {user.displayName ?? "이름 없음"}
                            </div>
                            <div className="text-sm text-gray-500">{user.email ?? "-"}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <StatusBadge status={user.status} />
                            {user.suspendedUntil && (
                                <span className="text-xs text-gray-500">
                                    해제 예정: {dayjs(user.suspendedUntil).format("YYYY.MM.DD HH:mm")}
                                </span>
                            )}
                        </div>
                    </div>
                    {user.statusReason && (
                        <div className="mt-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <span className="text-gray-400">현재 사유:</span> {user.statusReason}
                        </div>
                    )}
                </div>

                {/* Action chooser */}
                {mode === "none" && (
                    <div className="p-5 space-y-2">
                        {user.status !== "active" && (
                            <ActionRow
                                icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                                title="정상 복구"
                                desc="정지/탈퇴 상태를 해제하고 active로 되돌립니다."
                                onClick={() => setMode("restore")}
                            />
                        )}
                        {user.status !== "suspended" && (
                            <ActionRow
                                icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                                title="임시정지"
                                desc="지정한 기간 동안 로그인을 차단합니다. 기간 만료 시 자동 복구."
                                onClick={() => setMode("suspend")}
                            />
                        )}
                        {user.status !== "banned" && (
                            <ActionRow
                                icon={<Ban className="w-5 h-5 text-red-600" />}
                                title="영구정지"
                                desc="무기한 로그인 차단. 관리자가 수동으로만 해제 가능."
                                onClick={() => setMode("ban")}
                            />
                        )}
                        {user.status !== "inactive" && (
                            <ActionRow
                                icon={<UserX className="w-5 h-5 text-gray-600" />}
                                title="탈퇴 처리"
                                desc="계정을 탈퇴 상태로 전환합니다. 데이터는 보존됩니다."
                                onClick={() => setMode("inactive")}
                            />
                        )}
                        <ActionRow
                            icon={<Trash2 className="w-5 h-5 text-red-700" />}
                            title="완전 삭제"
                            desc="auth 계정과 프로필을 물리 삭제합니다. 복구 불가. 거래 이력이 있으면 실패할 수 있습니다."
                            onClick={() => setMode("delete")}
                            danger
                        />
                    </div>
                )}

                {/* Forms */}
                {mode !== "none" && (
                    <div className="p-5 space-y-4">
                        <button
                            type="button"
                            onClick={() => setMode("none")}
                            className="text-xs text-gray-500 hover:text-content-primary cursor-pointer"
                        >
                            ← 다른 액션 선택
                        </button>

                        {mode === "suspend" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-content-primary mb-2">
                                        정지 기간
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {SUSPEND_PRESETS.map((p) => (
                                            <Button
                                                key={p.days}
                                                size="sm"
                                                variant={suspendDays === p.days ? "primary" : "secondary"}
                                                onClick={() => setSuspendDays(p.days)}
                                            >
                                                {p.label}
                                            </Button>
                                        ))}
                                        <div className="flex items-center gap-1 ml-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                max={365}
                                                value={suspendDays}
                                                onChange={(e) => setSuspendDays(Number(e.target.value))}
                                                className="w-20"
                                            />
                                            <span className="text-sm text-gray-500">일</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        해제 예정일: {dayjs().add(suspendDays, "day").format("YYYY.MM.DD HH:mm")}
                                    </p>
                                </div>
                            </>
                        )}

                        {mode !== "delete" && (
                            <div>
                                <label className="block text-sm font-medium text-content-primary mb-2">
                                    사유{mode !== "restore" && <span className="text-red-500"> *</span>}
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                    placeholder={
                                        mode === "restore"
                                            ? "복구 메모 (선택)"
                                            : "사유는 유저에게도 표시됩니다"
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                />
                            </div>
                        )}

                        {mode === "delete" && (
                            <div className="space-y-4">
                                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-800">
                                        <p className="font-medium">이 작업은 되돌릴 수 없습니다.</p>
                                        <p className="mt-1 text-xs">
                                            거래 이력(리드/리뷰)이 있는 유저는 삭제에 실패합니다. 그 경우 &ldquo;탈퇴 처리&rdquo;를 사용하세요.
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-content-primary mb-2">
                                        사유 <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        placeholder="감사 로그에 기록됩니다"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-content-primary mb-2">
                                        확인용 이메일 <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">
                                        대상 유저의 이메일({user.email ?? "-"})을 정확히 입력해주세요.
                                    </p>
                                    <Input
                                        type="email"
                                        value={confirmEmail}
                                        onChange={(e) => setConfirmEmail(e.target.value)}
                                        placeholder={user.email ?? ""}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                {mode !== "none" && (
                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                        <Button variant="secondary" onClick={handleClose} disabled={isPending}>
                            취소
                        </Button>
                        <Button
                            variant={mode === "delete" || mode === "ban" ? "danger" : "primary"}
                            onClick={submit}
                            isLoading={isPending}
                        >
                            {mode === "suspend" && "임시정지 적용"}
                            {mode === "ban" && "영구정지 적용"}
                            {mode === "inactive" && "탈퇴 처리"}
                            {mode === "restore" && "정상 복구"}
                            {mode === "delete" && "완전 삭제"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ActionRow({
    icon,
    title,
    desc,
    onClick,
    danger,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                danger
                    ? "border-red-200 hover:bg-red-50"
                    : "border-gray-200 hover:bg-gray-50"
            }`}
        >
            <div className="shrink-0 mt-0.5">{icon}</div>
            <div className="min-w-0">
                <div className="font-medium text-content-primary">{title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
            </div>
        </button>
    );
}

function StatusBadge({ status }: { status: ProfileView["status"] }) {
    switch (status) {
        case "active":
            return <Badge color="success" size="xs">활성</Badge>;
        case "suspended":
            return <Badge color="warning" size="xs">임시정지</Badge>;
        case "banned":
            return <Badge color="error" size="xs">영구정지</Badge>;
        case "inactive":
            return <Badge color="neutral" size="xs">탈퇴</Badge>;
    }
}
