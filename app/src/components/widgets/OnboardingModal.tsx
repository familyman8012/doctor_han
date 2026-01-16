"use client";

import { useRouter } from "next/navigation";
import { X, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { useProfile, useProfileCompletion } from "@/stores/auth";

interface OnboardingStep {
    key: string;
    label: string;
    href: string;
    required: boolean;
}

const DOCTOR_STEPS: OnboardingStep[] = [
    { key: "profile_created", label: "프로필 작성", href: "/mypage", required: true },
    { key: "verification_submitted", label: "면허 인증 제출", href: "/verification/doctor", required: true },
    { key: "first_lead_created", label: "첫 문의 생성", href: "/vendors", required: false },
];

const VENDOR_STEPS: OnboardingStep[] = [
    { key: "profile_created", label: "프로필 작성", href: "/partner", required: true },
    { key: "vendor_info_added", label: "업체 정보 등록", href: "/partner", required: false },
    { key: "verification_submitted", label: "사업자 인증 제출", href: "/verification/vendor", required: true },
    { key: "portfolio_added", label: "포트폴리오 추가", href: "/partner/portfolios", required: false },
];

interface OnboardingModalProps {
    onClose: () => void;
    onSkip: () => void;
}

export function OnboardingModal({ onClose, onSkip }: OnboardingModalProps) {
    const router = useRouter();
    const profile = useProfile();
    const completion = useProfileCompletion();
    const role = profile?.role;

    const steps = role === "vendor" ? VENDOR_STEPS : DOCTOR_STEPS;
    const requiredSteps = steps.filter(s => s.required);
    const firstIncompleteRequiredStep =
        requiredSteps.find((step) => {
            const item = completion?.checklist.find((check) => check.key === step.key);
            return !item?.completed;
        }) ?? requiredSteps[0];

    const handleStart = () => {
        onClose();
        if (firstIncompleteRequiredStep) {
            router.push(firstIncompleteRequiredStep.href);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
                {/* 헤더 */}
                <div className="relative bg-gradient-to-r from-[#62e3d5] to-[#4bc7b9] p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <h2 className="text-xl font-bold">환영합니다!</h2>
                    <p className="text-white/90 mt-1 text-sm">
                        메디허브를 최대한 활용하기 위해 아래 단계를 완료해주세요
                    </p>
                </div>

                {/* 스텝 목록 */}
                <div className="p-6">
                    <div className="space-y-3">
                        {steps.map((step, index) => (
                            <div
                                key={step.label}
                                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                            >
                                <div className="w-6 h-6 rounded-full bg-[#62e3d5]/20 text-[#0a3b41] flex items-center justify-center text-sm font-medium">
                                    {index + 1}
                                </div>
                                <span className="flex-1 text-[#0a3b41]">
                                    {step.label}
                                    {step.required && (
                                        <span className="text-red-500 ml-1">*</span>
                                    )}
                                </span>
                                <CheckCircle className="w-5 h-5 text-gray-300" />
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-gray-400 mt-4">
                        <span className="text-red-500">*</span> 표시된 항목은 필수입니다
                    </p>
                </div>

                {/* 버튼 */}
                <div className="px-6 pb-6 flex gap-3">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={onSkip}
                        className="flex-1"
                    >
                        나중에 하기
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleStart}
                        className="flex-1"
                        TrailingIcon={<ArrowRight className="w-4 h-4" />}
                    >
                        시작하기
                    </Button>
                </div>
            </div>
        </div>
    );
}
