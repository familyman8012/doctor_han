"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { cn } from "@/components/utils";
import { SOCIAL_PROVIDERS, type SocialProviderId } from "@/lib/constants/oauth";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

interface SocialAccountLinkingProps {
    returnUrl: string;
}

function mapLinkError(message: string): string {
    if (message === "no_code") return "소셜 인증에 실패했습니다. 다시 시도해주세요.";
    if (message === "auth_failed") return "인증에 실패했습니다. 다시 로그인해주세요.";
    if (message.toLowerCase().includes("manual linking")) {
        return "계정 연결이 아직 활성화되지 않았습니다. Supabase Auth 설정에서 Manual linking을 활성화해주세요.";
    }
    return message;
}

export function SocialAccountLinking({ returnUrl }: SocialAccountLinkingProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoading, isConnected, getIdentity, refetch } = useSocialAccounts();
    const [linkingProvider, setLinkingProvider] = useState<SocialProviderId | null>(null);

    useEffect(() => {
        const linked = searchParams.get("linked");
        const linkError = searchParams.get("linkError");

        if (!linked && !linkError) return;

        if (linkError) {
            toast.error(mapLinkError(linkError));
        } else {
            toast.success("계정이 연결되었습니다");
        }

        refetch();
        router.replace(returnUrl);
    }, [refetch, returnUrl, router, searchParams]);

    const handleLink = async (providerId: SocialProviderId) => {
        setLinkingProvider(providerId);
        try {
            const supabase = getSupabaseBrowserClient();
            const callbackUrl = new URL("/auth/callback", window.location.origin);
            callbackUrl.searchParams.set("returnUrl", returnUrl);
            callbackUrl.searchParams.set("mode", "link");

            const { error } = await supabase.auth.linkIdentity({
                provider: providerId,
                options: { redirectTo: callbackUrl.toString() },
            });

            if (error) throw error;
        } catch (error) {
            const message = error instanceof Error ? error.message : "계정 연결에 실패했습니다";
            toast.error(message);
            setLinkingProvider(null);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#0a3b41] mb-4">소셜 계정 연결</h3>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Spinner size="md" />
                </div>
            ) : (
                <div className="space-y-4">
                    {SOCIAL_PROVIDERS.map((provider) => {
                        const connected = isConnected(provider.id);
                        const identity = getIdentity(provider.id);
                        const identityEmail = identity?.identity_data?.email as string | undefined;

                        return (
                            <div
                                key={provider.id}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-lg border",
                                    connected ? "border-[#62e3d5] bg-[#62e3d5]/5" : "border-gray-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "flex items-center justify-center w-10 h-10 rounded-full",
                                            provider.bgColor,
                                            provider.textColor,
                                            "border" in provider && provider.border && "border border-gray-200"
                                        )}
                                    >
                                        <ProviderIcon providerId={provider.id} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-[#0a3b41]">{provider.name}</p>
                                        {connected ? (
                                            <p className="text-sm text-gray-500">{identityEmail ?? "연결됨"}</p>
                                        ) : (
                                            <p className="text-sm text-gray-400">연결되지 않음</p>
                                        )}
                                    </div>
                                </div>

                                {connected ? (
                                    <span className="text-sm text-[#62e3d5] font-medium flex items-center gap-1">
                                        <Link2 className="w-4 h-4" />
                                        연결됨
                                    </span>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleLink(provider.id)}
                                        disabled={linkingProvider !== null}
                                        isLoading={linkingProvider === provider.id}
                                    >
                                        <Link2 className="w-4 h-4 mr-1" />
                                        연결하기
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="text-xs text-gray-400 mt-4">
                * 소셜 계정을 연결하면 해당 계정으로도 로그인할 수 있습니다.
            </p>
        </div>
    );
}

function ProviderIcon({ providerId }: { providerId: SocialProviderId }) {
    if (providerId === "kakao") {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.74 6.72-.21.78-.76 2.82-.87 3.26-.14.55.2.54.42.39.18-.12 2.84-1.93 3.99-2.71.56.08 1.14.12 1.72.12 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
        );
    }
    if (providerId === "google") {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24">
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
