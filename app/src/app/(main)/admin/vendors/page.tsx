"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Building2, Star, MapPin, ExternalLink } from "lucide-react";
import dayjs from "dayjs";
import Link from "next/link";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { Badge } from "@/components/ui/Badge/Badge";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";
import type { VendorStatus } from "@/lib/schema/vendor";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: VendorStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "active", label: "활성" },
    { value: "draft", label: "초안" },
    { value: "inactive", label: "비활성" },
    { value: "banned", label: "정지" },
];

export default function AdminVendorsPage() {
    const [status, setStatus] = useState<VendorStatus | "all">("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "vendors", status, search, page],
        queryFn: () =>
            adminApi.getVendors({
                status: status === "all" ? undefined : status,
                q: search || undefined,
                page,
                pageSize: PAGE_SIZE,
            }),
    });

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    const getStatusBadge = (status: VendorStatus) => {
        switch (status) {
            case "active":
                return <Badge color="success" size="sm">활성</Badge>;
            case "draft":
                return <Badge color="warning" size="sm">초안</Badge>;
            case "inactive":
                return <Badge color="neutral" size="sm">비활성</Badge>;
            case "banned":
                return <Badge color="error" size="sm">정지</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">업체 관리</h1>
                <p className="text-sm text-gray-500 mt-1">등록된 업체를 조회하고 관리합니다.</p>
            </div>

            {/* 필터 영역 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                {/* 상태 필터 + 검색 */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((opt) => (
                            <Button
                                key={opt.value}
                                variant={status === opt.value ? "listActive" : "list"}
                                size="sm"
                                onClick={() => {
                                    setStatus(opt.value);
                                    setPage(1);
                                }}
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                    <div className="flex-1 max-w-xs">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="업체명, 소개로 검색"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 목록 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : items.length === 0 ? (
                    <Empty title="업체가 없습니다" description="조건에 맞는 업체가 없습니다." />
                ) : (
                    <>
                        {/* 테이블 헤더 - 데스크탑 */}
                        <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
                            <div>업체</div>
                            <div>카테고리</div>
                            <div>상태</div>
                            <div>평점</div>
                            <div>등록일</div>
                            <div></div>
                        </div>

                        {/* 목록 */}
                        <div className="divide-y divide-gray-100">
                            {items.map((vendor) => (
                                <div
                                    key={vendor.id}
                                    className="p-4 hover:bg-gray-50 transition-colors"
                                >
                                    {/* 모바일 레이아웃 */}
                                    <div className="lg:hidden space-y-2">
                                        <div className="flex items-center justify-between">
                                            {getStatusBadge(vendor.status)}
                                            <span className="text-xs text-gray-400">
                                                {dayjs(vendor.createdAt).format("YYYY.MM.DD")}
                                            </span>
                                        </div>
                                        <p className="font-medium text-[#0a3b41]">{vendor.name}</p>
                                        {vendor.summary && (
                                            <p className="text-sm text-gray-500 line-clamp-1">{vendor.summary}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            {vendor.ratingAvg && (
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                    {vendor.ratingAvg.toFixed(1)}
                                                    <span className="text-gray-400">({vendor.reviewCount})</span>
                                                </span>
                                            )}
                                            {vendor.regionPrimary && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {vendor.regionPrimary}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {vendor.categories.slice(0, 3).map((cat) => (
                                                <Badge key={cat.id} color="neutral" size="xs">
                                                    {cat.name}
                                                </Badge>
                                            ))}
                                            {vendor.categories.length > 3 && (
                                                <Badge color="neutral" size="xs">
                                                    +{vendor.categories.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* 데스크탑 레이아웃 */}
                                    <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 items-center">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                    <Building2 className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-[#0a3b41] truncate">
                                                        {vendor.name}
                                                    </p>
                                                    {vendor.summary && (
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {vendor.summary}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {vendor.categories.slice(0, 2).map((cat) => (
                                                <Badge key={cat.id} color="neutral" size="xs">
                                                    {cat.name}
                                                </Badge>
                                            ))}
                                            {vendor.categories.length > 2 && (
                                                <Badge color="neutral" size="xs">
                                                    +{vendor.categories.length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                        <div>{getStatusBadge(vendor.status)}</div>
                                        <div className="text-sm">
                                            {vendor.ratingAvg ? (
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                    {vendor.ratingAvg.toFixed(1)}
                                                    <span className="text-gray-400">({vendor.reviewCount})</span>
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {dayjs(vendor.createdAt).format("YYYY.MM.DD")}
                                        </div>
                                        <div>
                                            <Link href={`/vendors/${vendor.id}`} target="_blank">
                                                <Button
                                                    variant="secondary"
                                                    size="xs"
                                                    IconOnly={<ExternalLink />}
                                                />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* 페이지네이션 */}
                {total > PAGE_SIZE && (
                    <div className="border-t border-gray-100 py-4">
                        <Pagination
                            pageInfo={[page, PAGE_SIZE]}
                            totalCount={total}
                            handlePageChange={setPage}
                        />
                    </div>
                )}
            </div>

            {/* 통계 */}
            <div className="text-sm text-gray-500 text-center">
                총 <span className="font-medium text-[#0a3b41]">{total}</span>개의 업체
            </div>
        </div>
    );
}
