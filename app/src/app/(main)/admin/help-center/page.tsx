"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Pin } from "lucide-react";
import { helpCenterApi } from "@/api-client/help-center";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Badge } from "@/components/ui/Badge/Badge";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";
import { cn } from "@/components/utils";
import type { HelpArticleView, HelpCategoryView, HelpArticleType } from "@/lib/schema/help-center";
import { ArticleFormModal } from "./components/ArticleFormModal";
import { CategoryFormModal } from "./components/CategoryFormModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";

type TabType = "faq" | "notice" | "categories";

export default function AdminHelpCenterPage() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useQueryState("tab", { defaultValue: "faq" });
    const [q, setQ] = useQueryState("q", { defaultValue: "" });
    const [page, setPage] = useQueryState("page", {
        defaultValue: "1",
        parse: (v) => v || "1",
    });

    const [searchInput, setSearchInput] = useState(q);
    const currentTab = (["faq", "notice", "categories"].includes(tab) ? tab : "faq") as TabType;
    const currentPage = parseInt(page, 10) || 1;

    // Modal states
    const [articleModal, setArticleModal] = useState<{
        mode: "create" | "edit";
        type: HelpArticleType;
        article?: HelpArticleView;
    } | null>(null);
    const [categoryModal, setCategoryModal] = useState<{
        mode: "create" | "edit";
        category?: HelpCategoryView;
    } | null>(null);
    const [deleteModal, setDeleteModal] = useState<{
        type: "article" | "category";
        id: string;
        name: string;
    } | null>(null);

    // Fetch categories
    const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
        queryKey: ["admin-help-categories"],
        queryFn: helpCenterApi.getAdminCategories,
    });

    const categories = categoriesData?.data?.items ?? [];

    // Fetch articles
    const { data: articlesData, isLoading: articlesLoading } = useQuery({
        queryKey: ["admin-help-articles", { type: currentTab !== "categories" ? currentTab : undefined, q: q || undefined, page: currentPage }],
        queryFn: () =>
            helpCenterApi.getAdminArticles({
                type: currentTab !== "categories" ? (currentTab as HelpArticleType) : undefined,
                q: q || undefined,
                page: currentPage,
                pageSize: 20,
            }),
        enabled: currentTab !== "categories",
    });

    const articles = articlesData?.data?.items ?? [];
    const total = articlesData?.data?.total ?? 0;
    const pageSize = articlesData?.data?.pageSize ?? 20;

    // Delete mutations
    const deleteArticleMutation = useMutation({
        mutationFn: helpCenterApi.deleteArticle,
        onSuccess: () => {
            toast.success("문서가 삭제되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin-help-articles"] });
            setDeleteModal(null);
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: helpCenterApi.deleteCategory,
        onSuccess: () => {
            toast.success("카테고리가 삭제되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin-help-categories"] });
            setDeleteModal(null);
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setQ(searchInput);
        setPage("1");
    };

    const handleTabChange = (newTab: TabType) => {
        setTab(newTab);
        setQ("");
        setSearchInput("");
        setPage("1");
    };

    const handleDelete = () => {
        if (!deleteModal) return;
        if (deleteModal.type === "article") {
            deleteArticleMutation.mutate(deleteModal.id);
        } else {
            deleteCategoryMutation.mutate(deleteModal.id);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    const isLoading = currentTab === "categories" ? categoriesLoading : articlesLoading;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[#0a3b41]">헬프센터 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">FAQ, 공지사항을 관리합니다.</p>
                </div>
                {currentTab !== "categories" ? (
                    <Button
                        variant="primary"
                        onClick={() => setArticleModal({ mode: "create", type: currentTab as HelpArticleType })}
                        LeadingIcon={<Plus />}
                    >
                        {currentTab === "faq" ? "FAQ 추가" : "공지사항 추가"}
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        onClick={() => setCategoryModal({ mode: "create" })}
                        LeadingIcon={<Plus />}
                    >
                        카테고리 추가
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex gap-6">
                    {[
                        { key: "faq", label: "FAQ" },
                        { key: "notice", label: "공지사항" },
                        { key: "categories", label: "카테고리" },
                    ].map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => handleTabChange(item.key as TabType)}
                            className={cn(
                                "pb-3 text-sm font-medium border-b-2 transition-colors",
                                currentTab === item.key
                                    ? "text-[#0a3b41] border-[#62e3d5]"
                                    : "text-gray-500 border-transparent hover:text-[#0a3b41]"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search (for articles only) */}
            {currentTab !== "categories" && (
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="제목 또는 내용 검색"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" variant="secondary">
                        검색
                    </Button>
                </form>
            )}

            {/* Content */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : currentTab === "categories" ? (
                    // Categories Table
                    categories.length === 0 ? (
                        <Empty
                            title="카테고리가 없습니다"
                            description="첫 카테고리를 추가해보세요."
                        />
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">이름</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">슬러그</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">순서</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">상태</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {categories.map((category: HelpCategoryView) => (
                                    <tr key={category.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-[#0a3b41]">{category.name}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge color="neutral" size="xs">{category.slug}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-500">
                                            {category.displayOrder}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {category.isActive ? (
                                                <Badge color="success" size="xs">활성</Badge>
                                            ) : (
                                                <Badge color="warning" size="xs">비활성</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="secondary"
                                                    size="xs"
                                                    onClick={() => setCategoryModal({ mode: "edit", category })}
                                                    IconOnly={<Pencil />}
                                                />
                                                <Button
                                                    variant="danger"
                                                    size="xs"
                                                    onClick={() => setDeleteModal({ type: "category", id: category.id, name: category.name })}
                                                    IconOnly={<Trash2 />}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    // Articles Table
                    articles.length === 0 ? (
                        <Empty
                            title={q ? "검색 결과가 없습니다" : currentTab === "faq" ? "FAQ가 없습니다" : "공지사항이 없습니다"}
                            description={q ? "다른 검색어로 다시 시도해보세요." : "첫 문서를 추가해보세요."}
                        />
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">제목</th>
                                    {currentTab === "faq" && (
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">카테고리</th>
                                    )}
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">공개</th>
                                    {currentTab === "notice" && (
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">고정</th>
                                    )}
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">순서</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">생성일</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {articles.map((article: HelpArticleView) => (
                                    <tr key={article.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-[#0a3b41] line-clamp-1">{article.title}</span>
                                        </td>
                                        {currentTab === "faq" && (
                                            <td className="px-4 py-3">
                                                {article.category ? (
                                                    <Badge color="neutral" size="xs">{article.category.name}</Badge>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-center">
                                            {article.isPublished ? (
                                                <Eye className="w-4 h-4 text-green-500 mx-auto" />
                                            ) : (
                                                <EyeOff className="w-4 h-4 text-gray-400 mx-auto" />
                                            )}
                                        </td>
                                        {currentTab === "notice" && (
                                            <td className="px-4 py-3 text-center">
                                                {article.isPinned ? (
                                                    <Pin className="w-4 h-4 text-[#62e3d5] mx-auto" />
                                                ) : (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-center text-sm text-gray-500">
                                            {article.displayOrder}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {formatDate(article.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="secondary"
                                                    size="xs"
                                                    onClick={() => setArticleModal({ mode: "edit", type: article.type, article })}
                                                    IconOnly={<Pencil />}
                                                />
                                                <Button
                                                    variant="danger"
                                                    size="xs"
                                                    onClick={() => setDeleteModal({ type: "article", id: article.id, name: article.title })}
                                                    IconOnly={<Trash2 />}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>

            {/* Pagination (for articles only) */}
            {currentTab !== "categories" && total > pageSize && (
                <div className="flex justify-center">
                    <Pagination
                        pageInfo={[currentPage, pageSize]}
                        totalCount={total}
                        handlePageChange={(p: number) => setPage(String(p))}
                    />
                </div>
            )}

            {/* Stats */}
            <div className="text-sm text-gray-500 text-center">
                {currentTab === "categories" ? (
                    <>총 <span className="font-medium text-[#0a3b41]">{categories.length}</span>개의 카테고리</>
                ) : (
                    <>총 <span className="font-medium text-[#0a3b41]">{total}</span>개의 {currentTab === "faq" ? "FAQ" : "공지사항"}</>
                )}
            </div>

            {/* Modals */}
            {articleModal && (
                <ArticleFormModal
                    isOpen={!!articleModal}
                    mode={articleModal.mode}
                    type={articleModal.type}
                    article={articleModal.article}
                    categories={categories}
                    onClose={() => setArticleModal(null)}
                />
            )}

            {categoryModal && (
                <CategoryFormModal
                    isOpen={!!categoryModal}
                    mode={categoryModal.mode}
                    category={categoryModal.category}
                    onClose={() => setCategoryModal(null)}
                />
            )}

            {deleteModal && (
                <DeleteConfirmModal
                    isOpen={!!deleteModal}
                    title={deleteModal.type === "article" ? "문서 삭제" : "카테고리 삭제"}
                    message={`"${deleteModal.name}"을(를) 삭제하시겠습니까?${deleteModal.type === "category" ? "\n해당 카테고리를 사용하는 FAQ가 있으면 삭제할 수 없습니다." : ""}`}
                    isLoading={deleteArticleMutation.isPending || deleteCategoryMutation.isPending}
                    onConfirm={handleDelete}
                    onClose={() => setDeleteModal(null)}
                />
            )}
        </div>
    );
}
