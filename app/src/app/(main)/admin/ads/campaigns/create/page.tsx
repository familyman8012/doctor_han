"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { adsApi } from "@/api-client/ads";
import { adminApi } from "@/api-client/admin";
import api from "@/api-client/client";
import { Select, type IOption } from "@/components/ui/Select/Select";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";
import type { FileSignedUploadResponse } from "@/lib/schema/file";
import type { AdminCampaignCreateBody } from "@/lib/schema/ad";

interface CreativeInput {
    title: string;
    imageUrl: string;
    clickUrl: string;
}

export default function CreateCampaignPage() {
    const router = useRouter();

    const { data: slotsData } = useQuery({
        queryKey: ["admin", "ad-slots"],
        queryFn: () => adsApi.getAdminSlots(),
    });
    const slots = slotsData?.data?.items ?? [];

    const { data: vendorsData } = useQuery({
        queryKey: ["admin", "vendors-all"],
        queryFn: () => adminApi.getVendors({ status: "active", pageSize: 100 }),
    });
    const vendors = vendorsData?.data?.items ?? [];

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

    const handleImageUpload = async (index: number, file: File) => {
        try {
            const signedRes = await api.post<FileSignedUploadResponse>("/api/files/signed-upload", {
                purpose: "product_image",
                fileName: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
            });
            const { file: fileRecord, upload } = signedRes.data.data;
            const supabase = getSupabaseBrowserClient();
            const { error } = await supabase.storage
                .from(upload.bucket)
                .uploadToSignedUrl(upload.path, upload.token, file);
            if (error) throw error;
            const imageUrl = `/api/files/open?fileId=${fileRecord.id}`;
            updateCreative(index, "imageUrl", imageUrl);
            toast.success("이미지가 업로드되었습니다.");
        } catch {
            toast.error("이미지 업로드에 실패했습니다.");
        }
    };

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
                        <label className="block text-sm font-medium text-gray-700 mb-1">광고 슬롯</label>
                        <Select
                            options={[
                                { value: "", label: "슬롯을 선택하세요" },
                                ...slots.map((slot) => ({
                                    value: slot.id,
                                    label: `${slot.name} (${slot.position})`,
                                })),
                            ]}
                            value={adSlotId}
                            onChange={(opt) => {
                                if (!opt || Array.isArray(opt)) return setAdSlotId("");
                                setAdSlotId(String(opt.value));
                            }}
                            isSearchable
                        />
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">연결 업체 (선택)</label>
                        <Select
                            options={[
                                { value: "", label: "업체 없음" },
                                ...vendors.map((v) => ({
                                    value: v.id,
                                    label: v.name,
                                })),
                            ]}
                            value={vendorId}
                            onChange={(opt) => {
                                if (!opt || Array.isArray(opt)) return setVendorId("");
                                setVendorId(String(opt.value));
                            }}
                            isSearchable
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
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">배너 이미지</label>
                                {creative.imageUrl ? (
                                    <div className="relative group">
                                        <img
                                            src={creative.imageUrl}
                                            alt="배너 미리보기"
                                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => updateCreative(index, "imageUrl", "")}
                                            className="absolute top-1 right-1 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                        <span className="text-xs text-gray-500">클릭하여 이미지 업로드</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleImageUpload(index, file);
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
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
