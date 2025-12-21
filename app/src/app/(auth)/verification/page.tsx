"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { useAuthStore, useUserRole } from "@/stores/auth";
import { Spinner } from "@/components/ui/Spinner/Spinner";

export default function VerificationPage() {
    const router = useRouter();
    const { user, profile, doctorVerification, vendorVerification, isLoading, isInitialized } = useAuthStore();
    const role = useUserRole();

    useEffect(() => {
        if (!isInitialized || isLoading) return;

        // 로그인 안 됨
        if (!user) {
            router.replace("/login");
            return;
        }

        // 프로필 없음 - 온보딩 필요
        if (!profile) {
            router.replace("/signup");
            return;
        }

        // 역할에 따른 검증 상태 확인
        if (role === "admin") {
            router.replace("/admin");
            return;
        }

        // 승인된 경우 홈으로
        if (role === "doctor" && doctorVerification?.status === "approved") {
            router.replace("/");
            return;
        }
        if (role === "vendor" && vendorVerification?.status === "approved") {
            router.replace("/partner");
            return;
        }

        // 검증 정보 없음 - 검증 신청 페이지로
        if (role === "doctor" && !doctorVerification) {
            router.replace("/verification/doctor");
            return;
        }
        if (role === "vendor" && !vendorVerification) {
            router.replace("/verification/vendor");
            return;
        }
    }, [user, profile, role, doctorVerification, vendorVerification, isLoading, isInitialized, router]);

    if (!isInitialized || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    const verification = role === "doctor" ? doctorVerification : vendorVerification;

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                {verification?.status === "pending" && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h1 className="text-xl font-bold text-[#0a3b41] mb-2">승인 대기 중</h1>
                        <p className="text-gray-500 mb-6">
                            제출하신 정보를 검토하고 있습니다.
                            <br />
                            승인까지 1-2 영업일이 소요될 수 있습니다.
                        </p>
                        <Link href="/">
                            <Button variant="ghostSecondary" size="md">
                                홈으로 돌아가기
                            </Button>
                        </Link>
                    </>
                )}

                {verification?.status === "rejected" && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-xl font-bold text-[#0a3b41] mb-2">승인 반려</h1>
                        {verification.rejectReason && (
                            <div className="bg-red-50 rounded-lg p-4 mb-4 text-left">
                                <p className="text-sm font-medium text-red-800 mb-1">반려 사유</p>
                                <p className="text-sm text-red-600">{verification.rejectReason}</p>
                            </div>
                        )}
                        <p className="text-gray-500 mb-6">
                            정보를 수정하여 다시 제출해주세요.
                        </p>
                        <Link href={role === "doctor" ? "/verification/doctor" : "/verification/vendor"}>
                            <Button variant="primary" size="md" TrailingIcon={<ArrowRight />}>
                                다시 신청하기
                            </Button>
                        </Link>
                    </>
                )}

                {verification?.status === "approved" && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-xl font-bold text-[#0a3b41] mb-2">승인 완료</h1>
                        <p className="text-gray-500 mb-6">
                            축하합니다! 이제 모든 기능을 이용하실 수 있습니다.
                        </p>
                        <Link href={role === "vendor" ? "/partner" : "/"}>
                            <Button variant="primary" size="md" TrailingIcon={<ArrowRight />}>
                                {role === "vendor" ? "파트너센터 가기" : "시작하기"}
                            </Button>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
