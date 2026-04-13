"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Plus, Trash2, Pencil, Image as ImageIcon, X } from "lucide-react";
import { Input } from "@/components/ui/Input/Input";
import { ImageLightbox } from "@/app/(main)/vendors/[id]/components/gallery/ImageLightbox";
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
                    <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-primary" />
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
                    <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 text-primary" />
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
    const queryClient = useQueryClient();
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(portfolio.title ?? "");
    const [editDescription, setEditDescription] = useState(portfolio.description ?? "");
    const [editTags, setEditTags] = useState<string[]>(portfolio.tags ?? []);
    const [editTagInput, setEditTagInput] = useState("");

    const editMutation = useMutation({
        mutationFn: async () => {
            await api.patch(`/api/vendors/me/portfolio/${portfolio.id}`, {
                title: editTitle.trim(),
                description: editDescription.trim() || null,
                tags: editTags,
            });
        },
        onSuccess: () => {
            toast.success("포트폴리오가 수정되었습니다");
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ["vendor", "me"] });
        },
        onError: () => {
            toast.error("수정에 실패했습니다");
        },
    });
    const firstAsset = portfolio.assets?.[0];
    const assetCount = portfolio.assets?.length ?? 0;

    const imageUrls = (portfolio.assets ?? [])
        .map((a) => ({
            url: a.fileId ? `/api/files/open?fileId=${a.fileId}` : a.url ?? "",
            alt: portfolio.title ?? "포트폴리오",
        }))
        .filter((img) => img.url);

    const thumbnailSrc = firstAsset?.fileId
        ? `/api/files/open?fileId=${firstAsset.fileId}`
        : firstAsset?.url ?? null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
            {/* 썸네일 — 클릭 시 라이트박스 */}
            <div
                className="relative aspect-video bg-gray-100 cursor-pointer"
                onClick={() => imageUrls.length > 0 && setLightboxIndex(0)}
            >
                {thumbnailSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={thumbnailSrc}
                        alt={portfolio.title ?? "포트폴리오"}
                        className="absolute inset-0 w-full h-full object-cover"
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

                {/* 수정/삭제 버튼 */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        className="w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-400 hover:text-primary hover:bg-white transition-colors"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        disabled={isDeleting}
                        className="w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 정보 */}
            <div className="p-4">
                <h3 className="font-semibold text-content-primary truncate">
                    {portfolio.title ?? "제목 없음"}
                </h3>
                {portfolio.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {portfolio.description}
                    </p>
                )}
            </div>

            {/* 라이트박스 */}
            {lightboxIndex !== null && imageUrls.length > 0 && (
                <ImageLightbox
                    images={imageUrls}
                    currentIndex={lightboxIndex}
                    onIndexChange={setLightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}

            {/* 수정 모달 */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-content-primary">포트폴리오 수정</h2>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">제목</label>
                                <Input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="포트폴리오 제목"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">설명</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    placeholder="설명"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    태그 <span className="text-gray-400 font-normal">(최대 10개)</span>
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {editTags.map((tag) => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary text-xs font-medium">
                                            {tag}
                                            <button type="button" onClick={() => setEditTags((prev) => prev.filter((t) => t !== tag))} className="hover:text-red-500">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                {editTags.length < 10 && (
                                    <Input
                                        value={editTagInput}
                                        onChange={(e) => setEditTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === ",") {
                                                e.preventDefault();
                                                const value = editTagInput.trim().replace(/,/g, "");
                                                if (value && !editTags.includes(value)) {
                                                    setEditTags((prev) => [...prev, value]);
                                                }
                                                setEditTagInput("");
                                            }
                                        }}
                                        placeholder="태그 입력 후 Enter"
                                    />
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="secondary" onClick={() => setIsEditing(false)}>취소</Button>
                                <Button
                                    variant="primary"
                                    onClick={() => editMutation.mutate()}
                                    isLoading={editMutation.isPending}
                                    disabled={!editTitle.trim() || editMutation.isPending}
                                >
                                    저장
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
