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
import { Toggle } from "@/components/ui/Toggle/Toggle";
import type { HelpCategoryView, HelpCategoryCreateBody, HelpCategoryPatchBody } from "@/lib/schema/help-center";

interface CategoryFormModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    category?: HelpCategoryView;
    onClose: () => void;
}

interface FormData {
    name: string;
    slug: string;
    displayOrder: number;
    isActive: boolean;
}

export function CategoryFormModal({
    isOpen,
    mode,
    category,
    onClose,
}: CategoryFormModalProps) {
    const queryClient = useQueryClient();

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            name: "",
            slug: "",
            displayOrder: 0,
            isActive: true,
        },
    });

    const name = watch("name");

    // Auto-generate slug from name (create mode only)
    useEffect(() => {
        if (mode === "create" && name) {
            const slug = name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-+|-+$/g, "");
            setValue("slug", slug);
        }
    }, [name, mode, setValue]);

    // Initialize form on edit mode
    useEffect(() => {
        if (mode === "edit" && category) {
            reset({
                name: category.name,
                slug: category.slug,
                displayOrder: category.displayOrder,
                isActive: category.isActive,
            });
        } else if (mode === "create") {
            reset({
                name: "",
                slug: "",
                displayOrder: 0,
                isActive: true,
            });
        }
    }, [mode, category, reset]);

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
        mutationFn: (data: HelpCategoryCreateBody) => helpCenterApi.createCategory(data),
        onSuccess: () => {
            toast.success("카테고리가 생성되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin-help-categories"] });
            onClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: HelpCategoryPatchBody }) =>
            helpCenterApi.updateCategory(id, data),
        onSuccess: () => {
            toast.success("카테고리가 수정되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["admin-help-categories"] });
            onClose();
        },
    });

    const onSubmit = (data: FormData) => {
        if (mode === "create") {
            createMutation.mutate({
                name: data.name,
                slug: data.slug,
                displayOrder: data.displayOrder,
                isActive: data.isActive,
            });
        } else if (category) {
            updateMutation.mutate({
                id: category.id,
                data: {
                    name: data.name,
                    slug: data.slug,
                    displayOrder: data.displayOrder,
                    isActive: data.isActive,
                },
            });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-[#0a3b41]">
                        {mode === "create" ? "카테고리 추가" : "카테고리 수정"}
                    </h2>
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
                        {/* Name */}
                        <div>
                            <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                카테고리명 <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="category-name"
                                {...register("name", { required: "카테고리명을 입력해주세요." })}
                                placeholder="카테고리명"
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Slug */}
                        <div>
                            <label htmlFor="category-slug" className="block text-sm font-medium text-gray-700 mb-1.5">
                                슬러그 <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="category-slug"
                                {...register("slug", {
                                    required: "슬러그를 입력해주세요.",
                                    pattern: {
                                        value: /^[a-z0-9-]+$/,
                                        message: "영문 소문자, 숫자, 하이픈만 사용 가능합니다.",
                                    },
                                })}
                                placeholder="category-slug"
                            />
                            {errors.slug && (
                                <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                                고유 식별자입니다. 영문 소문자, 숫자, 하이픈만 사용하세요.
                            </p>
                        </div>

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

                        {/* Is Active */}
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-medium text-gray-700">활성화</p>
                                <p className="text-xs text-gray-400">비활성화 시 노출되지 않습니다.</p>
                            </div>
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <Toggle
                                        checked={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
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
