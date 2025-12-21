"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";
import type { VendorDetail } from "@/lib/schema/vendor";

interface VendorInfoProps {
    vendor: VendorDetail;
}

export function VendorInfo({ vendor }: VendorInfoProps) {
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();

    const canInquire = isAuthenticated && role === "doctor";

    return (
        <div className="space-y-6">
            {/* 서비스 설명 */}
            {vendor.description && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-[#0a3b41] mb-4">서비스 소개</h2>
                    <div className="prose prose-gray max-w-none">
                        <p className="text-gray-600 whitespace-pre-wrap">
                            {vendor.description}
                        </p>
                    </div>
                </div>
            )}

            {/* 가격 정보 */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-[#0a3b41] mb-4">가격 정보</h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600">기본 가격</span>
                        <span className="font-bold text-[#0a3b41]">
                            {formatPrice(vendor.priceMin, vendor.priceMax)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        * 정확한 가격은 문의를 통해 확인해 주세요.
                    </p>
                </div>
            </div>

            {/* 문의하기 CTA */}
            <div className="bg-gradient-to-br from-[#0a3b41] to-[#155a62] rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">
                    서비스가 마음에 드시나요?
                </h3>
                <p className="text-gray-300 mb-4">
                    지금 바로 문의하고 견적을 받아보세요
                </p>
                {canInquire ? (
                    <Link href={`/vendors/${vendor.id}/inquiry`}>
                        <Button
                            variant="secondary"
                            size="lg"
                            LeadingIcon={<FileText className="w-5 h-5" />}
                            className="bg-[#62e3d5] text-[#0a3b41] hover:bg-[#4dd4c5]"
                        >
                            문의하기
                        </Button>
                    </Link>
                ) : !isAuthenticated ? (
                    <Link href="/login">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="bg-[#62e3d5] text-[#0a3b41] hover:bg-[#4dd4c5]"
                        >
                            로그인하고 문의하기
                        </Button>
                    </Link>
                ) : (
                    <p className="text-sm text-gray-400">
                        한의사 회원만 문의할 수 있습니다
                    </p>
                )}
            </div>
        </div>
    );
}

function formatPrice(min: number | null, max: number | null) {
    if (min === null && max === null) return "가격 문의";
    if (min === null) return `~${max?.toLocaleString()}원`;
    if (max === null) return `${min.toLocaleString()}원~`;
    if (min === max) return `${min.toLocaleString()}원`;
    return `${min.toLocaleString()}~${max.toLocaleString()}원`;
}
