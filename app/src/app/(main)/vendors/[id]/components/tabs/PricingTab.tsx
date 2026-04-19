"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import type { VendorDetail } from "@/lib/schema/vendor";

interface PricingTabProps {
    vendor: VendorDetail;
}

export function PricingTab({ vendor }: PricingTabProps) {
    const servicePrices = vendor.servicePrices ?? [];

    return (
        <div>
            <h2 className="text-xl font-bold text-content-primary mb-4">가격 정보</h2>

            {servicePrices.length > 0 ? (
                <div className="space-y-3">
                    {servicePrices.map((sp) => (
                        <div
                            key={sp.id}
                            className="bg-white rounded-lg border border-gray-100 p-4 flex items-center justify-between"
                        >
                            <span className="text-gray-700">
                                {sp.category?.name ?? "서비스"}
                            </span>
                            <span className="font-bold text-lg text-content-primary">
                                {sp.price.toLocaleString()}원
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-100 p-6 text-center">
                    <p className="text-lg text-gray-500">가격 문의</p>
                    <p className="text-xs text-gray-400 mt-1">
                        문의를 통해 맞춤 견적을 안내해 드립니다
                    </p>
                </div>
            )}

            <p className="text-sm text-gray-500 mt-4">
                * 정확한 견적은 문의를 통해 확인해 주세요.
            </p>

            <div className="mt-6">
                <Link href={`/vendors/${vendor.id}/inquiry`}>
                    <Button
                        variant="primary"
                        size="lg"
                        LeadingIcon={<FileText className="w-5 h-5" />}
                        className="w-full"
                    >
                        견적 문의하기
                    </Button>
                </Link>
            </div>
        </div>
    );
}
