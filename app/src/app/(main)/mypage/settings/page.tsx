"use client";

import { SocialAccountLinking } from "@/components/auth/SocialAccountLinking";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-[#0a3b41]">계정 설정</h2>
                <p className="text-sm text-gray-500 mt-1">소셜 계정 연결 및 계정 관리</p>
            </div>

            <SocialAccountLinking returnUrl="/mypage/settings" />
        </div>
    );
}
