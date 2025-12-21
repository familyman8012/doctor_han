"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import api from "@/api-client/client";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";
import type { VendorDetail } from "@/lib/schema/vendor";
import { InquiryForm } from "./components/InquiryForm";

export default function VendorInquiryPage() {
    const params = useParams();
    const router = useRouter();
    const vendorId = params.id as string;
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();

    // 업체 상세 조회
    const { data: vendorData, isLoading, isError } = useQuery({
        queryKey: ["vendor", vendorId],
        queryFn: async () => {
            const response = await api.get<{ data: { vendor: VendorDetail } }>(
                `/api/vendors/${vendorId}`
            );
            return response.data.data;
        },
    });

    // 권한 체크: 로그인한 한의사만 접근 가능
    if (!isAuthenticated) {
        router.replace("/login");
        return null;
    }

    if (role !== "doctor") {
        router.replace(`/vendors/${vendorId}`);
        return null;
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (isError || !vendorData?.vendor) {
        return (
            <div className="py-20">
                <Empty
                    title="업체를 찾을 수 없습니다"
                    description="요청하신 업체 정보가 존재하지 않습니다"
                />
            </div>
        );
    }

    const vendor = vendorData.vendor;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* 브레드크럼 */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <Link href={`/vendors/${vendor.id}`} className="hover:text-[#0a3b41] flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    업체 상세
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#0a3b41] font-medium">문의하기</span>
            </nav>

            {/* 헤더 */}
            <div className="bg-gradient-to-br from-[#0a3b41] to-[#155a62] rounded-xl p-6">
                <h1 className="text-xl font-bold text-white mb-2">
                    {vendor.name}에 문의하기
                </h1>
                <p className="text-gray-300 text-sm">
                    아래 양식을 작성하시면 업체에서 직접 연락드립니다
                </p>
            </div>

            {/* 문의 폼 */}
            <InquiryForm vendor={vendor} />
        </div>
    );
}
