"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Hammer } from "lucide-react";
import { biddingApi } from "@/api-client/bidding";
import { useIsAuthenticated, useAuthStore } from "@/stores/auth";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import type { BidProjectCreateBody } from "@/lib/schema/bidding";

export default function InteriorCreatePage() {
    const router = useRouter();
    const isAuthenticated = useIsAuthenticated();
    const { isInitialized } = useAuthStore();

    const [form, setForm] = useState<BidProjectCreateBody>({
        title: "",
        location: "",
        budgetMin: 0,
        budgetMax: 0,
        spaceSize: null,
        schedule: null,
        requirements: null,
    });

    const createMutation = useMutation({
        mutationFn: (payload: BidProjectCreateBody) => biddingApi.create(payload),
        onSuccess: (res) => {
            const projectId = res.data?.project?.id;
            if (projectId) {
                router.push(`/interior/${projectId}`);
            } else {
                router.push("/interior");
            }
        },
    });

    if (!isInitialized) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        router.replace("/login");
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(form);
    };

    const updateField = <K extends keyof BidProjectCreateBody>(
        key: K,
        value: BidProjectCreateBody[K],
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-content-primary flex items-center gap-2">
                    <Hammer className="w-6 h-6 text-primary" />
                    프로젝트 등록
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                    {/* 제목 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            프로젝트 제목 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => updateField("title", e.target.value)}
                            placeholder="예: 강남 치과 인테리어 리모델링"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    {/* 위치 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            위치 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={(e) => updateField("location", e.target.value)}
                            placeholder="예: 서울 강남구"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    {/* 예산 (백만원 단위 입력) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                예산 최소 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                                <input
                                    type="number"
                                    value={form.budgetMin ? form.budgetMin / 1_000_000 : ""}
                                    onChange={(e) => updateField("budgetMin", Number(e.target.value) * 1_000_000)}
                                    placeholder="30"
                                    className="w-20 px-4 py-2.5 text-sm text-right border-none focus:outline-none focus:ring-0"
                                    min={0}
                                    step={1}
                                    required
                                />
                                <span className="text-sm text-gray-400 pr-4 select-none">,000,000 원</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                예산 최대 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                                <input
                                    type="number"
                                    value={form.budgetMax ? form.budgetMax / 1_000_000 : ""}
                                    onChange={(e) => updateField("budgetMax", Number(e.target.value) * 1_000_000)}
                                    placeholder="50"
                                    className="w-20 px-4 py-2.5 text-sm text-right border-none focus:outline-none focus:ring-0"
                                    min={0}
                                    step={1}
                                    required
                                />
                                <span className="text-sm text-gray-400 pr-4 select-none">,000,000 원</span>
                            </div>
                        </div>
                    </div>

                    {/* 공간 크기 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            공간 크기
                        </label>
                        <input
                            type="text"
                            value={form.spaceSize ?? ""}
                            onChange={(e) => updateField("spaceSize", e.target.value || null)}
                            placeholder="예: 30평"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* 일정 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            희망 일정
                        </label>
                        <input
                            type="text"
                            value={form.schedule ?? ""}
                            onChange={(e) => updateField("schedule", e.target.value || null)}
                            placeholder="예: 2026년 4월 착공, 6월 완공 희망"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* 요구사항 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            세부 요구사항
                        </label>
                        <textarea
                            value={form.requirements ?? ""}
                            onChange={(e) => updateField("requirements", e.target.value || null)}
                            placeholder="인테리어에 대한 구체적인 요구사항을 입력해주세요"
                            rows={5}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                    </div>
                </div>

                {/* 제출 */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="flex-1 py-3 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-900/90 transition-colors disabled:opacity-50"
                    >
                        {createMutation.isPending ? "등록 중..." : "프로젝트 등록"}
                    </button>
                </div>

                {createMutation.isError && (
                    <p className="text-sm text-red-500 text-center">
                        등록에 실패했습니다. 다시 시도해주세요.
                    </p>
                )}
            </form>
        </div>
    );
}
