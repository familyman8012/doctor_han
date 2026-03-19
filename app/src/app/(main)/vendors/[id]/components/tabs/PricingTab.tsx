"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { formatPrice } from "@/lib/utils/format";
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
                    <p className="text-sm text-gray-500 mb-1">기본 가격</p>
                    <p className="text-2xl font-bold text-content-primary">
                        {formatPrice(vendor.priceMin, vendor.priceMax)}
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
