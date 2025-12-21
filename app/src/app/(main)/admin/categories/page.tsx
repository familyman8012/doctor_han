"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronRight, FolderTree, GripVertical } from "lucide-react";
import dayjs from "dayjs";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/Button";
import { Badge } from "@/components/ui/Badge/Badge";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import type { CategoryView } from "@/lib/schema/category";
import { CategoryFormModal } from "./components/FormModal";

interface CategoryNode extends CategoryView {
    children: CategoryNode[];
}

export default function AdminCategoriesPage() {
    const queryClient = useQueryClient();
    const [formModal, setFormModal] = useState<{
        mode: "create" | "edit";
        parentId?: string | null;
        category?: CategoryView;
    } | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const { data, isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: adminApi.getCategories,
    });

    const deleteMutation = useMutation({
        mutationFn: adminApi.deleteCategory,
        onSuccess: () => {
            toast.success("카테고리가 삭제되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });

    const categories = data?.data?.items ?? [];

    // 트리 구조로 변환
    const categoryTree = useMemo(() => {
        const map = new Map<string, CategoryNode>();
        const roots: CategoryNode[] = [];

        // 먼저 모든 카테고리를 맵에 등록
        categories.forEach((cat) => {
            map.set(cat.id, { ...cat, children: [] });
        });

        // 부모-자식 관계 설정
        categories.forEach((cat) => {
            const node = map.get(cat.id)!;
            if (cat.parentId && map.has(cat.parentId)) {
                map.get(cat.parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        });

        // 정렬
        const sortNodes = (nodes: CategoryNode[]) => {
            nodes.sort((a, b) => a.sortOrder - b.sortOrder);
            nodes.forEach((node) => sortNodes(node.children));
        };
        sortNodes(roots);

        return roots;
    }, [categories]);

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`"${name}" 카테고리를 삭제하시겠습니까?\n하위 카테고리가 있다면 함께 삭제됩니다.`)) {
            deleteMutation.mutate(id);
        }
    };

    const renderCategory = (node: CategoryNode, level: number = 0) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);

        return (
            <div key={node.id}>
                <div
                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                    style={{ paddingLeft: `${16 + level * 24}px` }}
                >
                    {/* 확장 버튼 */}
                    <button
                        type="button"
                        onClick={() => hasChildren && toggleExpand(node.id)}
                        className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                            hasChildren ? "hover:bg-gray-200 cursor-pointer" : "cursor-default"
                        }`}
                    >
                        {hasChildren && (
                            <ChevronRight
                                className={`w-4 h-4 text-gray-400 transition-transform ${
                                    isExpanded ? "rotate-90" : ""
                                }`}
                            />
                        )}
                    </button>

                    {/* 카테고리 정보 */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                        <FolderTree className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-[#0a3b41] truncate">{node.name}</span>
                                <Badge color="neutral" size="xs">{node.slug}</Badge>
                                {!node.isActive && (
                                    <Badge color="warning" size="xs">비활성</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 정렬 순서 */}
                    <div className="text-xs text-gray-400 shrink-0">
                        순서: {node.sortOrder}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => setFormModal({ mode: "create", parentId: node.id })}
                            LeadingIcon={<Plus />}
                        >
                            하위 추가
                        </Button>
                        <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => setFormModal({ mode: "edit", category: node })}
                            IconOnly={<Pencil />}
                        />
                        <Button
                            variant="danger"
                            size="xs"
                            onClick={() => handleDelete(node.id, node.name)}
                            IconOnly={<Trash2 />}
                            disabled={deleteMutation.isPending}
                        />
                    </div>
                </div>

                {/* 하위 카테고리 */}
                {hasChildren && isExpanded && (
                    <div>
                        {node.children.map((child) => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[#0a3b41]">카테고리 관리</h1>
                    <p className="text-sm text-gray-500 mt-1">서비스 카테고리를 관리합니다.</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setFormModal({ mode: "create", parentId: null })}
                    LeadingIcon={<Plus />}
                >
                    카테고리 추가
                </Button>
            </div>

            {/* 카테고리 트리 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : categoryTree.length === 0 ? (
                    <Empty
                        title="카테고리가 없습니다"
                        description="첫 카테고리를 추가해보세요."
                    />
                ) : (
                    <div>
                        {/* 헤더 */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
                            <div className="w-5" />
                            <div className="flex-1">카테고리</div>
                            <div className="w-16 text-center">순서</div>
                            <div className="w-48" />
                        </div>

                        {/* 카테고리 목록 */}
                        {categoryTree.map((node) => renderCategory(node))}
                    </div>
                )}
            </div>

            {/* 통계 */}
            <div className="text-sm text-gray-500 text-center">
                총 <span className="font-medium text-[#0a3b41]">{categories.length}</span>개의 카테고리
            </div>

            {/* 카테고리 폼 모달 */}
            {formModal && (
                <CategoryFormModal
                    isOpen={!!formModal}
                    mode={formModal.mode}
                    parentId={formModal.parentId}
                    category={formModal.category}
                    categories={categories}
                    onClose={() => setFormModal(null)}
                />
            )}
        </div>
    );
}
