"use client";

import Link from "next/link";
import { CheckCircle, Circle, Clock, AlertCircle, ChevronRight } from "lucide-react";
import type { ProfileCompletion, ChecklistItemStatus } from "@/lib/schema/profile";

interface ProfileCompletionBannerProps {
    completion: ProfileCompletion;
}

function getStatusIcon(status: ChecklistItemStatus) {
    switch (status) {
        case "completed":
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        case "waiting":
            return <Clock className="w-5 h-5 text-yellow-500" />;
        case "not_applicable":
            return <AlertCircle className="w-5 h-5 text-gray-300" />;
        default:
            return <Circle className="w-5 h-5 text-gray-300" />;
    }
}

function getStatusText(status: ChecklistItemStatus): string | null {
    switch (status) {
        case "waiting":
            return "심사 중";
        case "not_applicable":
            return "해당 없음";
        default:
            return null;
    }
}

export function ProfileCompletionBanner({ completion }: ProfileCompletionBannerProps) {
    const { score, checklist } = completion;

    // 100% 완료 시 배너 숨김
    if (score === 100) return null;

    // 진행 상태에 따른 색상
    const progressColor = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-[#62e3d5]";

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* 헤더 */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#0a3b41]">프로필 완성도</h3>
                    <span className="text-2xl font-bold text-[#0a3b41]">{score}%</span>
                </div>
                {/* 진행바 */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${progressColor} transition-all duration-300`}
                        style={{ width: `${score}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    프로필을 완성하면 더 많은 기능을 이용할 수 있습니다
                </p>
            </div>

            {/* 체크리스트 */}
            <ul className="divide-y divide-gray-100">
                {checklist.map((item) => {
                    const statusText = getStatusText(item.status);
                    const isClickable = item.status === "pending" && item.href;

                    const content = (
                        <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                            {getStatusIcon(item.status)}
                            <span className={`flex-1 text-sm ${item.completed ? "text-gray-400 line-through" : "text-[#0a3b41]"}`}>
                                {item.label}
                            </span>
                            {statusText && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                    {statusText}
                                </span>
                            )}
                            {isClickable && (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                    );

                    if (isClickable && item.href) {
                        return (
                            <li key={item.key}>
                                <Link href={item.href}>
                                    {content}
                                </Link>
                            </li>
                        );
                    }

                    return <li key={item.key}>{content}</li>;
                })}
            </ul>
        </div>
    );
}
