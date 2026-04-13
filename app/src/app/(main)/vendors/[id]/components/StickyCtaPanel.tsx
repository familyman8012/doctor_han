"use client";

import Link from "next/link";
import { Heart, Share2, FileText, Zap } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button/button";
import { Badge } from "@/components/ui/Badge/Badge";
import { cn } from "@/components/utils";
import api from "@/api-client/client";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";
import { formatPrice } from "@/lib/utils/format";
import type { VendorDetail } from "@/lib/schema/vendor";

interface StickyCtaPanelProps {
    vendor: VendorDetail;
    isFavorited: boolean;
}

export function StickyCtaPanel({ vendor, isFavorited }: StickyCtaPanelProps) {
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();
    const queryClient = useQueryClient();

    const canInquire = isAuthenticated && role === "doctor";

    const favoriteMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post<{ data: { vendorId: string; isFavorited: boolean } }>("/api/favorites/toggle", {
                vendorId: vendor.id,
            });
            return response.data.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
            queryClient.invalidateQueries({ queryKey: ["vendor", vendor.id] });
            toast.success(data.isFavorited ? "찜 목록에 추가되었습니다" : "찜 목록에서 삭제되었습니다");
        },
    });

    const handleFavoriteClick = () => {
        if (!isAuthenticated) {
            toast.error("로그인이 필요합니다");
            return;
        }
        if (role !== "doctor") {
            toast.error("한의사 회원만 찜할 수 있습니다");
            return;
        }
        favoriteMutation.mutate();
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("링크가 복사되었습니다");
        } catch {
            toast.error("링크 복사에 실패했습니다");
        }
    };

    const hasFastResponse = vendor.badges.some((b) => b.type === "fast_response");

    return (
        <div className="sticky top-24 hidden lg:block space-y-4">
            {/* Card 1 - Price */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">가격 정보</h3>
                {vendor.servicePrices && vendor.servicePrices.length > 0 ? (
                    <ul className="space-y-2">
                        {vendor.servicePrices.map((sp) => (
                            <li key={sp.id} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                    {sp.category?.name ?? "기타"}
                                </span>
                                <span className="text-lg font-bold text-content-primary">
                                    {sp.price.toLocaleString()}원
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-2xl font-bold text-content-primary">
                        {formatPrice(vendor.priceMin, vendor.priceMax)}
                    </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                    * 정확한 가격은 문의를 통해 확인해 주세요.
                </p>
            </div>

            {/* Card 2 - CTA */}
            <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">
                    서비스가 마음에 드시나요?
                </h3>
                <p className="text-gray-300 mb-4">
                    지금 바로 문의하고 견적을 받아보세요
                </p>
                {canInquire ? (
                    <Link href={`/vendors/${vendor.id}/inquiry`} className="block w-full">
                        <Button
                            variant="secondary"
                            size="lg"
                            LeadingIcon={<FileText className="w-5 h-5" />}
                            className="w-full bg-primary text-content-primary hover:bg-primary-700"
                        >
                            문의하기
                        </Button>
                    </Link>
                ) : !isAuthenticated ? (
                    <Link href="/login" className="block w-full">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="w-full bg-primary text-content-primary hover:bg-primary-700"
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

            {/* Card 3 - Actions */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                    <Button
                        variant={isFavorited ? "danger" : "ghostSecondary"}
                        size="md"
                        onClick={handleFavoriteClick}
                        isLoading={favoriteMutation.isPending}
                        LeadingIcon={
                            <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
                        }
                    >
                        {isFavorited ? "찜 해제" : "찜하기"}
                    </Button>
                    <Button
                        variant="ghostSecondary"
                        size="md"
                        onClick={handleShare}
                        LeadingIcon={<Share2 className="w-5 h-5" />}
                    >
                        공유
                    </Button>
                </div>
                {hasFastResponse && (
                    <div className="mt-3 flex justify-center">
                        <Badge color="info" size="sm" LeadingIcon={<Zap />}>
                            빠른 응답
                        </Badge>
                    </div>
                )}
            </div>
        </div>
    );
}
