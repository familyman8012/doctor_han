"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NextImage from "next/image";
import { FolderOpen, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import { PortfolioCreateModal } from "./components/PortfolioCreateModal";
import { toast } from "sonner";
import type { VendorDetail, VendorPortfolio } from "@/lib/schema/vendor";

export default function PartnerPortfoliosPage() {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // 내 업체 정보 조회 (포트폴리오 포함)
    const { data: vendorData, isLoading } = useQuery({
        queryKey: ["vendor", "me"],
        queryFn: async () => {
            const res = await api.get<{ data: { vendor: VendorDetail | null } }>("/api/vendors/me");
            return res.data.data.vendor;
        },
    });

    // 포트폴리오 삭제
    const deleteMutation = useMutation({
        mutationFn: async (portfolioId: string) => {
            await api.delete(`/api/vendors/me/portfolio/${portfolioId}`);
        },
        onSuccess: () => {
            toast.success("포트폴리오가 삭제되었습니다");
            queryClient.invalidateQueries({ queryKey: ["vendor", "me"] });
        },
    });

    const handleDelete = (portfolioId: string) => {
        if (confirm("포트폴리오를 삭제하시겠습니까?")) {
            deleteMutation.mutate(portfolioId);
        }
    };

    const portfolios = vendorData?.portfolios ?? [];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    // 업체 프로필이 없는 경우
    if (!vendorData) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0a3b41] flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-[#62e3d5]" />
                        포트폴리오
                    </h1>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 py-16">
                    <Empty
                        Icon={<FolderOpen className="w-8 h-8" />}
                        title="업체 프로필을 먼저 등록해주세요"
                        description="포트폴리오를 등록하려면 업체 프로필이 필요합니다"
                    />
                    <div className="flex justify-center mt-6">
                        <Button
                            variant="primary"
                            onClick={() => window.location.href = "/partner"}
                        >
                            업체 프로필 등록하기
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0a3b41] flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-[#62e3d5]" />
                        포트폴리오
                    </h1>
                    <p className="text-gray-500 mt-1">총 {portfolios.length}개의 포트폴리오</p>
                </div>
                <Button
                    variant="primary"
                    LeadingIcon={<Plus />}
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    포트폴리오 추가
                </Button>
            </div>

            {/* 포트폴리오 목록 */}
            {portfolios.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 py-16">
                    <Empty
                        Icon={<FolderOpen className="w-8 h-8" />}
                        title="등록된 포트폴리오가 없습니다"
                        description="작업 사례를 포트폴리오로 등록해보세요"
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {portfolios.map((portfolio) => (
                        <PortfolioCard
                            key={portfolio.id}
                            portfolio={portfolio}
                            onDelete={() => handleDelete(portfolio.id)}
                            isDeleting={deleteMutation.isPending}
                        />
                    ))}
                </div>
            )}

            {/* 생성 모달 */}
            {isCreateModalOpen && (
                <PortfolioCreateModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        queryClient.invalidateQueries({ queryKey: ["vendor", "me"] });
                    }}
                />
            )}
        </div>
    );
}

function PortfolioCard({
    portfolio,
    onDelete,
    isDeleting,
}: {
    portfolio: VendorPortfolio;
    onDelete: () => void;
    isDeleting: boolean;
}) {
    const firstAsset = portfolio.assets?.[0];
    const assetCount = portfolio.assets?.length ?? 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
            {/* 썸네일 */}
            <div className="relative aspect-video bg-gray-100">
                {firstAsset?.fileId ? (
                    <NextImage
                        src={`/api/files/open?fileId=${firstAsset.fileId}`}
                        alt={portfolio.title ?? "포트폴리오"}
                        fill
                        className="object-cover"
                    />
                ) : firstAsset?.url ? (
                    <NextImage
                        src={firstAsset.url}
                        alt={portfolio.title ?? "포트폴리오"}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                )}

                {/* 이미지 개수 표시 */}
                {assetCount > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs">
                        +{assetCount - 1}
                    </div>
                )}

                {/* 삭제 버튼 */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    disabled={isDeleting}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* 정보 */}
            <div className="p-4">
                <h3 className="font-semibold text-[#0a3b41] truncate">
                    {portfolio.title ?? "제목 없음"}
                </h3>
                {portfolio.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {portfolio.description}
                    </p>
                )}
            </div>
        </div>
    );
}
