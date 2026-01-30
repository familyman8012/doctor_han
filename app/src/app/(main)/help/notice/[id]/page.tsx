"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pin, Clock } from "lucide-react";
import { helpCenterApi } from "@/api-client/help-center";
import { Button } from "@/components/ui/Button/button";
import { Badge } from "@/components/ui/Badge/Badge";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { formatDateKo } from "@/lib/utils/date";

export default function NoticeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const rawId = params.id;
    const id = typeof rawId === "string" ? rawId : undefined;

    const { data, isLoading, error } = useQuery({
        queryKey: ["help-article", id],
        queryFn: () => helpCenterApi.getPublicArticle(id!),
        enabled: !!id,
    });

    const article = data?.data?.article;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[#0a3b41] mb-2">공지사항을 찾을 수 없습니다</h1>
                    <p className="text-gray-500 mb-6">요청하신 공지사항이 존재하지 않거나 삭제되었습니다.</p>
                    <Button variant="secondary" onClick={() => router.push("/help?tab=notice")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        목록으로 돌아가기
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Back Button */}
            <Button
                variant="secondary"
                onClick={() => router.push("/help?tab=notice")}
                className="mb-6"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                목록으로 돌아가기
            </Button>

            {/* Article */}
            <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        {article.isPinned && (
                            <>
                                <Pin className="w-4 h-4 text-[#62e3d5]" />
                                <Badge color="primary" size="sm">
                                    고정 공지
                                </Badge>
                            </>
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-[#0a3b41] mb-3">{article.title}</h1>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateKo(article.createdAt)}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {article.content}
                    </div>
                </div>
            </article>
        </div>
    );
}
