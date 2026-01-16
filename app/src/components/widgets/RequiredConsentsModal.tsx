"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { TERMS_URLS } from "@/lib/constants/terms";

interface RequiredConsentsModalProps {
    currentTermsVersion: string;
    currentPrivacyVersion: string;
    isLoading?: boolean;
    onAgree: () => void;
    onLogout: () => void;
}

export function RequiredConsentsModal({
    currentTermsVersion,
    currentPrivacyVersion,
    isLoading,
    onAgree,
    onLogout,
}: RequiredConsentsModalProps) {
    const [requiredChecked, setRequiredChecked] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
                <div className="bg-gradient-to-r from-[#62e3d5] to-[#4bc7b9] p-6 text-white">
                    <h2 className="text-xl font-bold">약관 동의가 필요합니다</h2>
                    <p className="text-white/90 mt-1 text-sm">
                        서비스 이용을 위해 아래 약관에 동의해주세요.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-3">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#62e3d5] focus:ring-[#62e3d5]"
                                checked={requiredChecked}
                                onChange={(e) => setRequiredChecked(e.target.checked)}
                            />
                            <span className="text-sm text-gray-700">
                                <span className="text-red-500">(필수)</span>{" "}
                                <a
                                    href={TERMS_URLS.terms}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#0a3b41] underline hover:text-[#62e3d5] inline-flex items-center gap-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    이용약관(버전 {currentTermsVersion})
                                    <ExternalLink className="h-3 w-3" />
                                </a>{" "}
                                및{" "}
                                <a
                                    href={TERMS_URLS.privacy}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#0a3b41] underline hover:text-[#62e3d5] inline-flex items-center gap-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    개인정보처리방침(버전 {currentPrivacyVersion})
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                                에 동의합니다
                            </span>
                        </label>

                        <p className="text-xs text-gray-400">
                            * 동의하지 않으면 서비스 이용이 제한됩니다.
                        </p>
                    </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={onLogout}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        로그아웃
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={onAgree}
                        className="flex-1"
                        disabled={!requiredChecked || isLoading}
                        isLoading={isLoading}
                    >
                        동의하고 계속
                    </Button>
                </div>
            </div>
        </div>
    );
}

