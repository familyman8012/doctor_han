"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Stethoscope, Building2, Shield } from "lucide-react";
import dayjs from "dayjs";
import { adminApi } from "@/api-client/admin";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { Badge } from "@/components/ui/Badge/Badge";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Empty } from "@/components/ui/Empty/Empty";
import Pagination from "@/components/widgets/Pagination/Pagination";
import type { ProfileRole, ProfileStatus } from "@/lib/schema/profile";

const PAGE_SIZE = 20;

const ROLE_OPTIONS: { value: ProfileRole | "all"; label: string; icon: typeof User }[] = [
    { value: "all", label: "전체", icon: User },
    { value: "doctor", label: "한의사", icon: Stethoscope },
    { value: "vendor", label: "업체", icon: Building2 },
    { value: "admin", label: "관리자", icon: Shield },
];

const STATUS_OPTIONS: { value: ProfileStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "active", label: "활성" },
    { value: "inactive", label: "비활성" },
    { value: "banned", label: "정지" },
];

export default function AdminUsersPage() {
    const [role, setRole] = useState<ProfileRole | "all">("all");
    const [status, setStatus] = useState<ProfileStatus | "all">("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["admin", "users", role, status, search, page],
        queryFn: () =>
            adminApi.getUsers({
                role: role === "all" ? undefined : role,
                status: status === "all" ? undefined : status,
                q: search || undefined,
                page,
                pageSize: PAGE_SIZE,
            }),
    });

    const items = data?.data?.items ?? [];
    const total = data?.data?.total ?? 0;

    const getRoleBadge = (role: ProfileRole) => {
        switch (role) {
            case "doctor":
                return (
                    <Badge color="info" size="sm">
                        <Stethoscope className="w-3 h-3 mr-1" />
                        한의사
                    </Badge>
                );
            case "vendor":
                return (
                    <Badge color="purple" size="sm">
                        <Building2 className="w-3 h-3 mr-1" />
                        업체
                    </Badge>
                );
            case "admin":
                return (
                    <Badge color="error" size="sm">
                        <Shield className="w-3 h-3 mr-1" />
                        관리자
                    </Badge>
                );
        }
    };

    const getStatusBadge = (status: ProfileStatus) => {
        switch (status) {
            case "active":
                return <Badge color="success" size="xs">활성</Badge>;
            case "inactive":
                return <Badge color="neutral" size="xs">비활성</Badge>;
            case "banned":
                return <Badge color="error" size="xs">정지</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-xl font-bold text-[#0a3b41]">사용자 관리</h1>
                <p className="text-sm text-gray-500 mt-1">전체 사용자를 조회하고 관리합니다.</p>
            </div>

            {/* 필터 영역 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                {/* 역할 필터 */}
                <div className="flex gap-2 flex-wrap">
                    {ROLE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                            <Button
                                key={opt.value}
                                variant={role === opt.value ? "listActive" : "list"}
                                size="sm"
                                onClick={() => {
                                    setRole(opt.value);
                                    setPage(1);
                                }}
                                LeadingIcon={<Icon />}
                            >
                                {opt.label}
                            </Button>
                        );
                    })}
                </div>

                {/* 상태 필터 + 검색 */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((opt) => (
                            <Button
                                key={opt.value}
                                variant={status === opt.value ? "listActive" : "list"}
                                size="xs"
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
                                placeholder="이름, 이메일, 연락처로 검색"
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
                    <Empty title="사용자가 없습니다" description="조건에 맞는 사용자가 없습니다." />
                ) : (
                    <>
                        {/* 테이블 헤더 - 데스크탑 */}
                        <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
                            <div>사용자</div>
                            <div>역할</div>
                            <div>상태</div>
                            <div>연락처</div>
                            <div>가입일</div>
                        </div>

                        {/* 목록 */}
                        <div className="divide-y divide-gray-100">
                            {items.map((user) => (
                                <div
                                    key={user.id}
                                    className="p-4 hover:bg-gray-50 transition-colors"
                                >
                                    {/* 모바일 레이아웃 */}
                                    <div className="lg:hidden space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getRoleBadge(user.role)}
                                                {getStatusBadge(user.status)}
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {dayjs(user.createdAt).format("YYYY.MM.DD")}
                                            </span>
                                        </div>
                                        <p className="font-medium text-[#0a3b41]">
                                            {user.displayName ?? "이름 없음"}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {user.email ?? "-"} {user.phone && `/ ${user.phone}`}
                                        </p>
                                    </div>

                                    {/* 데스크탑 레이아웃 */}
                                    <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                {user.avatarUrl ? (
                                                    <img
                                                        src={user.avatarUrl}
                                                        alt=""
                                                        className="w-9 h-9 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-[#0a3b41] truncate">
                                                    {user.displayName ?? "이름 없음"}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {user.email ?? "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <div>{getRoleBadge(user.role)}</div>
                                        <div>{getStatusBadge(user.status)}</div>
                                        <div className="text-sm text-gray-600">{user.phone ?? "-"}</div>
                                        <div className="text-sm text-gray-500">
                                            {dayjs(user.createdAt).format("YYYY.MM.DD")}
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
                총 <span className="font-medium text-[#0a3b41]">{total}</span>명의 사용자
            </div>
        </div>
    );
}
