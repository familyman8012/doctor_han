"use client";

import { useCallback, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { helpCenterApi } from "@/api-client/help-center";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { InputNumber } from "@/components/ui/InputNumber";
import { Select, type IOption } from "@/components/ui/Select/Select";
import { Toggle } from "@/components/ui/Toggle/Toggle";
import type { HelpArticleView, HelpCategoryView, HelpArticleType, HelpArticleCreateBody, HelpArticlePatchBody } from "@/lib/schema/help-center";

interface ArticleFormModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    type: HelpArticleType;
    article?: HelpArticleView;
    categories: HelpCategoryView[];
    onClose: () => void;
}

interface FormData {
    title: string;
    content: string;
    categoryId: string | null;
    isPublished: boolean;
    isPinned: boolean;
    displayOrder: number;
}

export function ArticleFormModal({
    isOpen,
    mode,
    type,
    article,
    categories,
    onClose,
}: ArticleFormModalProps) {
    const queryClient = useQueryClient();

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            title: "",
            content: "",
            categoryId: null,
            isPublished: false,
            isPinned: false,
            displayOrder: 0,
        },
    });

    // Initialize form on edit mode
    useEffect(() => {
        if (mode === "edit" && article) {
            reset({
                title: article.title,
                content: article.content,
                categoryId: article.categoryId ?? null,
                isPublished: article.isPublished,
                isPinned: article.isPinned,
                displayOrder: article.displayOrder,
            });
        } else if (mode === "create") {
            reset({
                title: "",
                content: "",
                categoryId: null,
                isPublished: false,
                isPinned: false,
                displayOrder: 0,
            });
        }
    }, [mode, article, reset]);

    // Escape key handler
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    const createMutation = useMutation({
        mutationFn: (data: HelpArticleCreateBody) => helpCenterApi.createArticle(data),
        onSuccess: () => {
            toast.success(type === "faq" ? "FAQ가 생성되었습니다." : "공지사항이 생성되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin-help-articles"] });
            onClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: HelpArticlePatchBody }) =>
            helpCenterApi.updateArticle(id, data),
        onSuccess: () => {
            toast.success(type === "faq" ? "FAQ가 수정되었습니다." : "공지사항이 수정되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin-help-articles"] });
            onClose();
        },
    });

    const onSubmit = (data: FormData) => {
        if (mode === "create") {
            createMutation.mutate({
                type,
                title: data.title,
                content: data.content,
                categoryId: type === "faq" ? (data.categoryId || null) : null,
                isPublished: data.isPublished,
                isPinned: type === "notice" ? data.isPinned : false,
                displayOrder: data.displayOrder,
            });
        } else if (article) {
            updateMutation.mutate({
                id: article.id,
                data: {
                    title: data.title,
                    content: data.content,
                    categoryId: type === "faq" ? (data.categoryId || null) : undefined,
                    isPublished: data.isPublished,
                    isPinned: type === "notice" ? data.isPinned : undefined,
                    displayOrder: data.displayOrder,
                },
            });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    if (!isOpen) return null;

    const categoryOptions: IOption[] = [
        { value: "", label: "카테고리 선택 (선택사항)" },
        ...categories.map((cat) => ({
            value: cat.id,
            label: cat.name,
        })),
    ];

    const title = type === "faq"
        ? (mode === "create" ? "FAQ 추가" : "FAQ 수정")
        : (mode === "create" ? "공지사항 추가" : "공지사항 수정");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                    <h2 className="text-lg font-semibold text-[#0a3b41]">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="닫기"
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="p-5 space-y-4">
                        {/* Title */}
                        <div>
                            <label htmlFor="article-title" className="block text-sm font-medium text-gray-700 mb-1.5">
                                {type === "faq" ? "질문" : "제목"} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="article-title"
                                {...register("title", { required: type === "faq" ? "질문을 입력해주세요." : "제목을 입력해주세요." })}
                                placeholder={type === "faq" ? "자주 묻는 질문을 입력하세요" : "공지사항 제목을 입력하세요"}
                            />
                            {errors.title && (
                                <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Content */}
                        <div>
                            <label htmlFor="article-content" className="block text-sm font-medium text-gray-700 mb-1.5">
                                {type === "faq" ? "답변" : "내용"} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="article-content"
                                {...register("content", { required: type === "faq" ? "답변을 입력해주세요." : "내용을 입력해주세요." })}
                                className="plain"
                                placeholder={type === "faq" ? "답변을 입력하세요" : "공지사항 내용을 입력하세요"}
                                rows={6}
                            />
                            {errors.content && (
                                <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>
                            )}
                        </div>

                        {/* Category (FAQ only) */}
                        {type === "faq" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    카테고리
                                </label>
                                <Controller
                                    name="categoryId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            options={categoryOptions}
                                            value={field.value ?? ""}
                                            onChange={(option) => {
                                                if (!option || Array.isArray(option)) {
                                                    field.onChange(null);
                                                    return;
                                                }
                                                const nextValue = option.value === "" ? null : option.value;
                                                field.onChange(nextValue);
                                            }}
                                            isSearchable={false}
                                        />
                                    )}
                                />
                            </div>
                        )}

                        {/* Display Order */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                표시 순서
                            </label>
                            <Controller
                                name="displayOrder"
                                control={control}
                                rules={{ min: { value: 0, message: "0 이상이어야 합니다." } }}
                                render={({ field }) => (
                                    <InputNumber
                                        value={field.value}
                                        onValueChange={(value) => field.onChange(value ?? 0)}
                                        mode="integer"
                                        min={0}
                                        placeholder="0"
                                    />
                                )}
                            />
                            {errors.displayOrder && (
                                <p className="text-xs text-red-500 mt-1">{errors.displayOrder.message}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                                숫자가 작을수록 먼저 표시됩니다.
                            </p>
                        </div>

                        {/* Is Published */}
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-medium text-gray-700">공개</p>
                                <p className="text-xs text-gray-400">비공개 시 사용자에게 노출되지 않습니다.</p>
                            </div>
                            <Controller
                                name="isPublished"
                                control={control}
                                render={({ field }) => (
                                    <Toggle
                                        checked={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </div>

                        {/* Is Pinned (Notice only) */}
                        {type === "notice" && (
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">상단 고정</p>
                                    <p className="text-xs text-gray-400">고정 시 목록 상단에 표시됩니다.</p>
                                </div>
                                <Controller
                                    name="isPinned"
                                    control={control}
                                    render={({ field }) => (
                                        <Toggle
                                            checked={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            취소
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isLoading}>
                            {mode === "create" ? "추가" : "저장"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
