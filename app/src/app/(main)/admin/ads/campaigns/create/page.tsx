"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { adsApi } from "@/api-client/ads";
import type { AdminCampaignCreateBody } from "@/lib/schema/ad";

interface CreativeInput {
    title: string;
    imageUrl: string;
    clickUrl: string;
}

export default function CreateCampaignPage() {
    const router = useRouter();
    const [adSlotId, setAdSlotId] = useState("");
    const [advertiserName, setAdvertiserName] = useState("");
    const [vendorId, setVendorId] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [monthlyPrice, setMonthlyPrice] = useState("");
    const [creatives, setCreatives] = useState<CreativeInput[]>([
        { title: "", imageUrl: "", clickUrl: "" },
    ]);

    const mutation = useMutation({
        mutationFn: (body: AdminCampaignCreateBody) => adsApi.createAdminCampaign(body),
        onSuccess: (res) => {
            toast.success("캠페인이 생성되었습니다.");
            router.push(`/admin/ads/campaigns/${res.data.campaign.id}`);
        },
        onError: () => {
            toast.error("캠페인 생성에 실패했습니다.");
        },
    });

    const addCreative = () => {
        setCreatives([...creatives, { title: "", imageUrl: "", clickUrl: "" }]);
    };

    const removeCreative = (index: number) => {
        setCreatives(creatives.filter((_, i) => i !== index));
    };

    const updateCreative = (index: number, field: keyof CreativeInput, value: string) => {
        setCreatives(creatives.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            adSlotId,
            advertiserName,
            ...(vendorId ? { vendorId } : {}),
            startsAt: new Date(startsAt).toISOString(),
            endsAt: new Date(endsAt).toISOString(),
            monthlyPrice: Number(monthlyPrice),
            creatives: creatives.map((c) => ({
                type: "image" as const,
                title: c.title,
                imageUrl: c.imageUrl || undefined,
                clickUrl: c.clickUrl,
            })),
        });
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <Link href="/admin/ads/campaigns" className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-content-primary">캠페인 생성</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-semibold text-content-primary">기본 정보</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">슬롯 ID</label>
                        <input
                            type="text"
                            value={adSlotId}
                            onChange={(e) => setAdSlotId(e.target.value)}
                            placeholder="슬롯 UUID"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-gray-400 mt-1">메인 또는 서브 배너 슬롯의 ID</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">광고주명</label>
                        <input
                            type="text"
                            value={advertiserName}
                            onChange={(e) => setAdvertiserName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">업체 ID (선택)</label>
                        <input
                            type="text"
                            value={vendorId}
                            onChange={(e) => setVendorId(e.target.value)}
                            placeholder="연결할 업체 UUID (선택)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                            <input
                                type="date"
                                value={startsAt}
                                onChange={(e) => setStartsAt(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                            <input
                                type="date"
                                value={endsAt}
                                onChange={(e) => setEndsAt(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">월 광고비 (원)</label>
                        <input
                            type="number"
                            value={monthlyPrice}
                            onChange={(e) => setMonthlyPrice(e.target.value)}
                            min={0}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-content-primary">크리에이티브</h2>
                        <button type="button" onClick={addCreative} className="flex items-center gap-1 text-sm text-primary hover:text-content-primary">
                            <Plus className="w-4 h-4" />
                            추가
                        </button>
                    </div>

                    {creatives.map((creative, index) => (
                        <div key={index} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">소재 #{index + 1}</span>
                                {creatives.length > 1 && (
                                    <button type="button" onClick={() => removeCreative(index)}>
                                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                value={creative.title}
                                onChange={(e) => updateCreative(index, "title", e.target.value)}
                                placeholder="제목"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <input
                                type="url"
                                value={creative.imageUrl}
                                onChange={(e) => updateCreative(index, "imageUrl", e.target.value)}
                                placeholder="이미지 URL (선택)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <input
                                type="url"
                                value={creative.clickUrl}
                                onChange={(e) => updateCreative(index, "clickUrl", e.target.value)}
                                placeholder="클릭 URL"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full py-3 text-sm font-medium text-white bg-primary-900 hover:bg-primary-900/90 rounded-lg transition-colors disabled:opacity-50"
                >
                    {mutation.isPending ? "생성 중..." : "캠페인 생성"}
                </button>
            </form>
        </div>
    );
}
