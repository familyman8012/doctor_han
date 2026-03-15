"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Send } from "lucide-react";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import type { ProductDetail } from "@/lib/schema/product";

interface ProductInquiryFormProps {
    product: ProductDetail;
}

interface FormData {
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    content: string;
}

const PREFERRED_CHANNELS = [
    { value: "", label: "선택해주세요" },
    { value: "phone", label: "전화" },
    { value: "email", label: "이메일" },
    { value: "kakao", label: "카카오톡" },
    { value: "sms", label: "문자" },
];

export function ProductInquiryForm({ product }: ProductInquiryFormProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [preferredChannel, setPreferredChannel] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>();

    const mutation = useMutation({
        mutationFn: async (data: FormData) => {
            return api.post("/api/leads", {
                vendorId: product.vendorId,
                productId: product.id,
                categoryIds: [product.categoryId],
                serviceName: product.title,
                contactName: data.contactName,
                contactPhone: data.contactPhone,
                contactEmail: data.contactEmail || null,
                preferredChannel: preferredChannel || null,
                content: data.content,
            });
        },
        onSuccess: () => {
            toast.success("문의가 접수되었습니다");
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            router.push(`/products/${product.id}`);
        },
        onError: () => {
            toast.error("문의 접수에 실패했습니다. 다시 시도해 주세요.");
        },
    });

    return (
        <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
        >
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <Input
                    {...register("contactName", { required: "이름을 입력해 주세요" })}
                    placeholder="홍길동"
                />
                {errors.contactName && (
                    <p className="text-xs text-red-500 mt-1">{errors.contactName.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                <Input
                    {...register("contactPhone", { required: "연락처를 입력해 주세요" })}
                    placeholder="010-0000-0000"
                />
                {errors.contactPhone && (
                    <p className="text-xs text-red-500 mt-1">{errors.contactPhone.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <Input
                    {...register("contactEmail")}
                    type="email"
                    placeholder="example@email.com"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">선호 연락 방법</label>
                <select
                    value={preferredChannel}
                    onChange={(e) => setPreferredChannel(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    {PREFERRED_CHANNELS.map((ch) => (
                        <option key={ch.value} value={ch.value}>
                            {ch.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">문의 내용 *</label>
                <textarea
                    {...register("content", { required: "문의 내용을 입력해 주세요" })}
                    rows={5}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="문의하실 내용을 자유롭게 작성해 주세요"
                />
                {errors.content && (
                    <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>
                )}
            </div>

            <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full"
            >
                <Send className="w-4 h-4 mr-2" />
                {mutation.isPending ? "접수 중..." : "문의하기"}
            </Button>
        </form>
    );
}
