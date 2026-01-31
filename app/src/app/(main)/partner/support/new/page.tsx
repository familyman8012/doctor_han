"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Search, ExternalLink, MessageCircle } from "lucide-react";
import { supportApi } from "@/api-client/support";
import { helpCenterApi } from "@/api-client/help-center";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import type { HelpArticleView } from "@/lib/schema/help-center";

type Step = "search" | "form";

export default function PartnerSupportNewPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [step, setStep] = useState<Step>("search");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    // FAQ 카테고리 조회
    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ["help", "categories"],
        queryFn: () => helpCenterApi.getPublicCategories(),
    });

    // FAQ 검색
    const { data: articlesData, isLoading: articlesLoading } = useQuery({
        queryKey: ["help", "articles", searchQuery],
        queryFn: () =>
            helpCenterApi.getPublicArticles({
                q: searchQuery || undefined,
                pageSize: 10,
            }),
        enabled: searchQuery.length >= 2,
    });

    // 티켓 생성 mutation
    const createMutation = useMutation({
        mutationFn: () =>
            supportApi.create({
                categoryId: selectedCategoryId,
                title,
                content,
            }),
        onSuccess: (data) => {
            toast.success("문의가 접수되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
            router.push(`/partner/support/${data.data.ticket.id}`);
        },
        onError: () => {
            toast.error("문의 접수에 실패했습니다.");
        },
    });

    const categories = categoriesData?.data?.items ?? [];
    const articles = articlesData?.data?.items ?? [];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategoryId || !title.trim() || !content.trim()) {
            toast.error("모든 필드를 입력해주세요.");
            return;
        }
        createMutation.mutate();
    };

    const handleNotResolved = () => {
        setStep("form");
    };

    const handleBack = () => {
        if (step === "form") {
            setStep("search");
        } else {
            router.back();
        }
    };

    if (categoriesLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-[#0a3b41]">
                        {step === "search" ? "FAQ 검색" : "새 문의 작성"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {step === "search"
                            ? "먼저 FAQ에서 답변을 찾아보세요."
                            : "아래 양식을 작성하여 문의를 등록하세요."}
                    </p>
                </div>
            </div>

            {step === "search" ? (
                <div className="space-y-6">
                    {/* Search Form */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="궁금한 내용을 검색하세요..."
                                    className="pl-10"
                                />
                            </div>
                        </form>
                    </div>

                    {/* Search Results */}
                    {searchQuery.length >= 2 && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-100">
                                <h2 className="font-medium text-[#0a3b41]">검색 결과</h2>
                            </div>
                            {articlesLoading ? (
                                <div className="flex justify-center py-10">
                                    <Spinner size="md" />
                                </div>
                            ) : articles.length === 0 ? (
                                <Empty title="검색 결과가 없습니다" description="다른 검색어로 시도해보세요." />
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {articles.map((article: HelpArticleView) => (
                                        <li key={article.id}>
                                            <a
                                                href={`/help/articles/${article.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[#0a3b41] truncate">{article.title}</p>
                                                    {article.category && (
                                                        <span className="text-xs text-gray-500">
                                                            {article.category.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Not Resolved Button */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 mb-4">FAQ로 해결되지 않았나요?</p>
                        <Button onClick={handleNotResolved} LeadingIcon={<MessageCircle />}>
                            1:1 문의하기
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                    {/* Category */}
                    <div className="space-y-2">
                        <label htmlFor="category" className="plain">
                            문의 유형
                        </label>
                        <select
                            id="category"
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="plain w-full"
                            required
                        >
                            <option value="">선택하세요</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <label htmlFor="title" className="plain">
                            제목
                        </label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="문의 제목을 입력하세요"
                            maxLength={100}
                            required
                        />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <label htmlFor="content" className="plain">
                            내용
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                            placeholder="문의 내용을 상세하게 작성해주세요"
                            rows={6}
                            maxLength={2000}
                            required
                            className="plain w-full"
                        />
                        <p className="text-xs text-gray-400 text-right">{content.length}/2000</p>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={handleBack}>
                            취소
                        </Button>
                        <Button type="submit" isLoading={createMutation.isPending}>
                            문의 등록
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
