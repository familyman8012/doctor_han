"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/components/utils";
import { SOCIAL_PROVIDERS, type SocialProviderId } from "@/lib/constants/oauth";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

interface SocialLoginButtonsProps {
    mode: "login" | "signup" | "link";
    returnUrl?: string;
}

export function SocialLoginButtons({ mode, returnUrl = "/" }: SocialLoginButtonsProps) {
    const [loadingProvider, setLoadingProvider] = useState<SocialProviderId | null>(null);

    useEffect(() => {
        const resetLoading = () => setLoadingProvider(null);
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") resetLoading();
        };

        window.addEventListener("pageshow", resetLoading);
        window.addEventListener("pagehide", resetLoading);
        window.addEventListener("focus", resetLoading);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("pageshow", resetLoading);
            window.removeEventListener("pagehide", resetLoading);
            window.removeEventListener("focus", resetLoading);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const loadingLabel = (() => {
        switch (mode) {
            case "login":
                return "로그인 중...";
            case "signup":
                return "로그인 중...";
            case "link":
                return "연결 중...";
        }
    })();

    const handleSocialLogin = async (providerId: SocialProviderId) => {
        setLoadingProvider(providerId);
        try {
            const supabase = getSupabaseBrowserClient();
            const redirectTo = `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}&mode=${mode}`;

            if (mode === "link") {
                const { error } = await supabase.auth.linkIdentity({
                    provider: providerId,
                    options: { redirectTo },
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: providerId,
                    options: { redirectTo },
                });
                if (error) throw error;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "소셜 로그인에 실패했습니다";
            toast.error(message);
            setLoadingProvider(null);
        }
    };

    const getButtonLabel = (providerName: string) => {
        switch (mode) {
            case "login":
                return `${providerName}로 로그인`;
            case "signup":
                return `${providerName}로 시작하기`;
            case "link":
                return `${providerName} 연결하기`;
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {SOCIAL_PROVIDERS.map((provider) => (
                <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleSocialLogin(provider.id)}
                    disabled={loadingProvider !== null}
                    className={cn(
                        "flex items-center justify-center gap-2 w-full h-12 rounded-lg font-medium transition-colors",
                        provider.bgColor,
                        provider.textColor,
                        provider.hoverBgColor,
                        "border" in provider && provider.border && "border border-gray-300",
                        loadingProvider === provider.id && "opacity-70 cursor-wait",
                        loadingProvider !== null && loadingProvider !== provider.id && "opacity-50"
                    )}
                >
                    <ProviderIcon providerId={provider.id} />
                    {loadingProvider === provider.id ? loadingLabel : getButtonLabel(provider.name)}
                </button>
            ))}
        </div>
    );
}

function ProviderIcon({ providerId }: { providerId: SocialProviderId }) {
    if (providerId === "kakao") {
        return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.74 6.72-.21.78-.76 2.82-.87 3.26-.14.55.2.54.42.39.18-.12 2.84-1.93 3.99-2.71.56.08 1.14.12 1.72.12 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
        );
    }
    if (providerId === "google") {
        return (
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
            </svg>
        );
    }
    return null;
}
