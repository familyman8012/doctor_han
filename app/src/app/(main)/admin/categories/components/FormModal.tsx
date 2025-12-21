"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { InputNumber } from "@/components/ui/InputNumber";
import { Select } from "@/components/ui/Select/Select";
import { Toggle } from "@/components/ui/Toggle/Toggle";
import type { CategoryView } from "@/lib/schema/category";
import type { AdminCategoryCreateBody, AdminCategoryPatchBody } from "@/lib/schema/admin";

interface CategoryFormModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    parentId?: string | null;
    category?: CategoryView;
    categories: CategoryView[];
    onClose: () => void;
}

interface FormData {
    name: string;
    slug: string;
    parentId: string | null;
    sortOrder: number;
    isActive: boolean;
}

export function CategoryFormModal({
    isOpen,
    mode,
    parentId,
    category,
    categories,
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
            parentId: parentId ?? null,
            sortOrder: 0,
            isActive: true,
        },
    });

    const name = watch("name");

    // 슬러그 자동 생성
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

    // 편집 모드일 때 초기값 설정
    useEffect(() => {
        if (mode === "edit" && category) {
            reset({
                name: category.name,
                slug: category.slug,
                parentId: category.parentId,
                sortOrder: category.sortOrder,
                isActive: category.isActive,
            });
        } else if (mode === "create") {
            reset({
                name: "",
                slug: "",
                parentId: parentId ?? null,
                sortOrder: 0,
                isActive: true,
            });
        }
    }, [mode, category, parentId, reset]);

    const createMutation = useMutation({
        mutationFn: (data: AdminCategoryCreateBody) => adminApi.createCategory(data),
        onSuccess: () => {
            toast.success("카테고리가 생성되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            onClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: AdminCategoryPatchBody }) =>
            adminApi.updateCategory(id, data),
        onSuccess: () => {
            toast.success("카테고리가 수정되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            onClose();
        },
    });

    const onSubmit = (data: FormData) => {
        if (mode === "create") {
            createMutation.mutate({
                name: data.name,
                slug: data.slug,
                parentId: data.parentId || null,
                sortOrder: data.sortOrder,
                isActive: data.isActive,
            });
        } else if (category) {
            updateMutation.mutate({
                id: category.id,
                data: {
                    name: data.name,
                    slug: data.slug,
                    parentId: data.parentId,
                    sortOrder: data.sortOrder,
                    isActive: data.isActive,
                },
            });
        }
    };

    // 자기 자신과 하위 카테고리를 부모로 선택할 수 없도록 필터링
    const getAvailableParents = () => {
        if (mode === "create") {
            return categories;
        }
        if (!category) return categories;

        const excludeIds = new Set<string>();
        excludeIds.add(category.id);

        // 하위 카테고리 ID 수집
        const collectChildren = (parentId: string) => {
            categories.forEach((cat) => {
                if (cat.parentId === parentId) {
                    excludeIds.add(cat.id);
                    collectChildren(cat.id);
                }
            });
        };
        collectChildren(category.id);

        return categories.filter((cat) => !excludeIds.has(cat.id));
    };

    const availableParents = getAvailableParents();
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
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="p-5 space-y-4">
                        {/* 카테고리명 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                카테고리명 <span className="text-red-500">*</span>
                            </label>
                            <Input
                                {...register("name", { required: "카테고리명을 입력해주세요." })}
                                placeholder="카테고리명"
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        {/* 슬러그 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                슬러그 <span className="text-red-500">*</span>
                            </label>
                            <Input
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
                                URL에 사용됩니다. 영문 소문자, 숫자, 하이픈만 사용하세요.
                            </p>
                        </div>

                        {/* 상위 카테고리 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                상위 카테고리
                            </label>
                            <Controller
                                name="parentId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value ?? ""}
                                        onChange={(e) => field.onChange(e.target.value || null)}
                                    >
                                        <option value="">없음 (최상위)</option>
                                        {availableParents.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.depth > 0 ? "└ ".repeat(cat.depth) : ""}
                                                {cat.name}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            />
                        </div>

                        {/* 정렬 순서 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                정렬 순서
                            </label>
                            <Controller
                                name="sortOrder"
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
                            {errors.sortOrder && (
                                <p className="text-xs text-red-500 mt-1">{errors.sortOrder.message}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                                숫자가 작을수록 먼저 표시됩니다.
                            </p>
                        </div>

                        {/* 활성화 */}
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
