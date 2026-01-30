"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { Search, ChevronDown, ChevronUp, Pin, Clock } from "lucide-react";
import Link from "next/link";
import { helpCenterApi } from "@/api-client/help-center";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Badge } from "@/components/ui/Badge/Badge";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";
import { cn } from "@/components/utils";
import { formatDateKo } from "@/lib/utils/date";
import type { HelpArticleView, HelpCategoryView } from "@/lib/schema/help-center";

type TabType = "faq" | "notice";

export default function HelpCenterPage() {
    const [tab, setTab] = useQueryState("tab", { defaultValue: "faq" });
    const [category, setCategory] = useQueryState("category", { defaultValue: "" });
    const [q, setQ] = useQueryState("q", { defaultValue: "" });
    const [page, setPage] = useQueryState("page", {
        defaultValue: "1",
        parse: (v) => v || "1",
    });

    const [searchInput, setSearchInput] = useState(q);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const currentTab = (tab === "notice" ? "notice" : "faq") as TabType;
    const currentPage = parseInt(page, 10) || 1;

    // Fetch categories for FAQ filter
    const { data: categoriesData } = useQuery({
        queryKey: ["help-categories"],
        queryFn: helpCenterApi.getPublicCategories,
    });

    const categories = categoriesData?.data?.items ?? [];

    // Fetch articles
    const { data: articlesData, isLoading } = useQuery({
        queryKey: ["help-articles", { type: currentTab, categoryId: category || undefined, q: q || undefined, page: currentPage }],
        queryFn: () =>
            helpCenterApi.getPublicArticles({
                type: currentTab,
                categoryId: category || undefined,
                q: q || undefined,
                page: currentPage,
                pageSize: 10,
            }),
    });

    const articles = articlesData?.data?.items ?? [];
    const total = articlesData?.data?.total ?? 0;
    const pageSize = articlesData?.data?.pageSize ?? 10;

    // Sync searchInput with q param when URL changes (e.g., browser back/forward)
    useEffect(() => {
        setSearchInput(q);
    }, [q]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setQ(searchInput);
        setPage("1");
    };

    const handleTabChange = (newTab: TabType) => {
        setTab(newTab);
        setCategory("");
        setQ("");
        setSearchInput("");
        setPage("1");
        setExpandedId(null);
    };

    const handleCategoryChange = (categoryId: string) => {
        setCategory(categoryId);
        setPage("1");
    };

    const toggleFaq = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#0a3b41] mb-2">헬프센터</h1>
                <p className="text-gray-500">궁금한 점이 있으신가요? 자주 묻는 질문과 공지사항을 확인해보세요.</p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-6">
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => handleTabChange("faq")}
                        className={cn(
                            "px-6 py-2 text-sm font-medium rounded-md transition-all",
                            currentTab === "faq"
                                ? "bg-white text-[#0a3b41] shadow-sm"
                                : "text-gray-600 hover:text-[#0a3b41]"
                        )}
                    >
                        FAQ
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange("notice")}
                        className={cn(
                            "px-6 py-2 text-sm font-medium rounded-md transition-all",
                            currentTab === "notice"
                                ? "bg-white text-[#0a3b41] shadow-sm"
                                : "text-gray-600 hover:text-[#0a3b41]"
                        )}
                    >
                        공지사항
                    </button>
                </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder={currentTab === "faq" ? "질문을 검색해보세요" : "공지사항을 검색해보세요"}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button type="submit" variant="primary">
                        검색
                    </Button>
                </div>
            </form>

            {/* Category Filter (FAQ only) */}
            {currentTab === "faq" && categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        type="button"
                        onClick={() => handleCategoryChange("")}
                        className={cn(
                            "px-3 py-1.5 text-sm rounded-full border transition-colors",
                            !category
                                ? "bg-[#0a3b41] text-white border-[#0a3b41]"
                                : "text-gray-600 border-gray-300 hover:border-[#0a3b41] hover:text-[#0a3b41]"
                        )}
                    >
                        전체
                    </button>
                    {categories.map((cat: HelpCategoryView) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategoryChange(cat.id)}
                            className={cn(
                                "px-3 py-1.5 text-sm rounded-full border transition-colors",
                                category === cat.id
                                    ? "bg-[#0a3b41] text-white border-[#0a3b41]"
                                    : "text-gray-600 border-gray-300 hover:border-[#0a3b41] hover:text-[#0a3b41]"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : articles.length === 0 ? (
                    <Empty
                        title={q ? "검색 결과가 없습니다" : currentTab === "faq" ? "FAQ가 없습니다" : "공지사항이 없습니다"}
                        description={q ? "다른 검색어로 다시 시도해보세요." : undefined}
                    />
                ) : currentTab === "faq" ? (
                    // FAQ Accordion
                    <div className="divide-y divide-gray-100">
                        {articles.map((article: HelpArticleView) => {
                            const isExpanded = expandedId === article.id;
                            const headingId = `faq-heading-${article.id}`;
                            const panelId = `faq-panel-${article.id}`;
                            return (
                                <div key={article.id}>
                                    <button
                                        id={headingId}
                                        type="button"
                                        onClick={() => toggleFaq(article.id)}
                                        aria-expanded={isExpanded}
                                        aria-controls={panelId}
                                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className="text-[#62e3d5] font-semibold shrink-0">Q.</span>
                                            <span className="font-medium text-[#0a3b41] truncate">{article.title}</span>
                                            {article.category && (
                                                <Badge color="neutral" size="xs" className="shrink-0">
                                                    {article.category.name}
                                                </Badge>
                                            )}
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                                        )}
                                    </button>
                                    {isExpanded && (
                                        <div
                                            id={panelId}
                                            role="region"
                                            aria-labelledby={headingId}
                                            className="px-5 pb-4"
                                        >
                                            <div className="pl-8 text-gray-600 whitespace-pre-wrap">{article.content}</div>
                                            <div className="pl-8 mt-3">
                                                <Link
                                                    href={`/help/faq/${article.id}`}
                                                    className="text-sm text-[#62e3d5] hover:underline"
                                                >
                                                    상세 페이지 보기
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // Notice List
                    <div className="divide-y divide-gray-100">
                        {articles.map((article: HelpArticleView) => (
                            <Link
                                key={article.id}
                                href={`/help/notice/${article.id}`}
                                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {article.isPinned && (
                                        <Pin className="w-4 h-4 text-[#62e3d5] shrink-0" />
                                    )}
                                    <span className={cn(
                                        "font-medium truncate",
                                        article.isPinned ? "text-[#0a3b41]" : "text-gray-700"
                                    )}>
                                        {article.title}
                                    </span>
                                    {article.isPinned && (
                                        <Badge color="primary" size="xs" className="shrink-0">
                                            고정
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-400 shrink-0">
                                    <Clock className="w-4 h-4" />
                                    {formatDateKo(article.createdAt)}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {total > pageSize && (
                <div className="mt-6 flex justify-center">
                    <Pagination
                        pageInfo={[currentPage, pageSize]}
                        totalCount={total}
                        handlePageChange={(p: number) => setPage(String(p))}
                    />
                </div>
            )}
        </div>
    );
}
