"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { cn } from "@/components/utils";
import { useIsAuthenticated, useUserRole } from "@/stores/auth";
import { RequireApproval } from "@/components/widgets/RequireApproval";
import type { VendorDetail } from "@/lib/schema/vendor";

interface MobileCtaBarProps {
    vendor: VendorDetail;
    isFavorited: boolean;
    onFavoriteClick: () => void;
}

export function MobileCtaBar({ vendor, isFavorited, onFavoriteClick }: MobileCtaBarProps) {
    const isAuthenticated = useIsAuthenticated();
    const role = useUserRole();

    const canInquire = isAuthenticated && role === "doctor";

    return (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-gray-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-3">
                {/* Left: price + favorite */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onFavoriteClick}
                        className="flex-shrink-0 p-1"
                    >
                        <Heart
                            className={cn(
                                "w-6 h-6 transition-colors",
                                isFavorited
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-400",
                            )}
                        />
                    </button>
                    <span className="text-sm text-gray-500 truncate">가격 문의</span>
                </div>

                {/* Right: CTA */}
                {canInquire ? (
                    <RequireApproval message="면허 인증 완료 후 문의할 수 있습니다.">
                        <Link href={`/vendors/${vendor.id}/inquiry`}>
                            <Button variant="primary" size="md">
                                문의하기
                            </Button>
                        </Link>
                    </RequireApproval>
                ) : !isAuthenticated ? (
                    <Link href="/login">
                        <Button variant="primary" size="md">
                            로그인하고 문의하기
                        </Button>
                    </Link>
                ) : (
                    <Button variant="primary" size="md" disabled>
                        문의 불가
                    </Button>
                )}
            </div>
        </div>
    );
}
