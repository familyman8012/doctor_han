"use client";

import { useMutation } from "@tanstack/react-query";
import { X, Download } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/Button/Button";
import { Badge } from "@/components/ui/Badge/Badge";
import type { AdminDoctorVerificationListItem, AdminVendorVerificationListItem } from "@/lib/schema/admin";
import type { FileSignedDownloadResponse } from "@/lib/schema/file";
import type { VerificationStatus } from "@/lib/schema/verification";
import api from "@/api-client/client";

type VerificationListItem = AdminDoctorVerificationListItem | AdminVendorVerificationListItem;

interface VerificationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: VerificationListItem;
}

export function VerificationDetailModal({ isOpen, onClose, item }: VerificationDetailModalProps) {
    const { verification, user, type } = item;

    const downloadMutation = useMutation({
        mutationFn: async (fileId: string) => {
            const res = await api.get<FileSignedDownloadResponse>("/api/files/signed-download", {
                params: { fileId },
            });
            return res.data.data;
        },
        onSuccess: ({ signedUrl }) => {
            window.open(signedUrl, "_blank");
        },
    });

    const getStatusBadge = (status: VerificationStatus) => {
        switch (status) {
            case "pending":
                return <Badge color="warning">대기중</Badge>;
            case "approved":
                return <Badge color="success">승인됨</Badge>;
            case "rejected":
                return <Badge color="error">반려됨</Badge>;
        }
    };

    const handleDownloadFile = (fileId: string) => {
        downloadMutation.mutate(fileId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                    <h2 className="text-lg font-semibold text-[#0a3b41]">
                        {type === "doctor" ? "한의사 인증 상세" : "업체 인증 상세"}
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
                <div className="p-5">
                    <div className="space-y-5">
                        {/* 상태 */}
                        <div className="flex items-center gap-3">
                            {getStatusBadge(verification.status)}
                            <span className="text-sm text-gray-500">
                                신청일: {dayjs(verification.createdAt).format("YYYY.MM.DD HH:mm")}
                            </span>
                        </div>

                        {/* 신청자 정보 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">신청자 정보</h3>
                            <dl className="space-y-2 text-sm">
                                <div className="flex">
                                    <dt className="w-24 text-gray-500">이름</dt>
                                    <dd className="text-[#0a3b41]">{user.displayName ?? "-"}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-24 text-gray-500">이메일</dt>
                                    <dd className="text-[#0a3b41]">{user.email ?? "-"}</dd>
                                </div>
                                <div className="flex">
                                    <dt className="w-24 text-gray-500">연락처</dt>
                                    <dd className="text-[#0a3b41]">{user.phone ?? "-"}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* 인증 정보 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                                {type === "doctor" ? "한의사 정보" : "업체 정보"}
                            </h3>
                            <dl className="space-y-2 text-sm">
                                {type === "doctor" && "licenseNo" in verification && (
                                    <>
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">면허번호</dt>
                                            <dd className="text-[#0a3b41]">{verification.licenseNo}</dd>
                                        </div>
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">이름</dt>
                                            <dd className="text-[#0a3b41]">{verification.fullName}</dd>
                                        </div>
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">생년월일</dt>
                                            <dd className="text-[#0a3b41]">{verification.birthDate ?? "-"}</dd>
                                        </div>
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">병원명</dt>
                                            <dd className="text-[#0a3b41]">{verification.clinicName ?? "-"}</dd>
                                        </div>
                                        {verification.licenseFileId && (
                                            <div className="flex items-center pt-2">
                                                <dt className="w-24 text-gray-500">면허증</dt>
                                                <dd>
                                                    <Button
                                                        variant="secondary"
                                                        size="xs"
                                                        onClick={() => handleDownloadFile(verification.licenseFileId!)}
                                                        isLoading={downloadMutation.isPending}
                                                        LeadingIcon={<Download />}
                                                    >
                                                        파일 보기
                                                    </Button>
                                                </dd>
                                            </div>
                                        )}
                                    </>
                                )}
                                {type === "vendor" && "businessNo" in verification && (
                                    <>
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">사업자번호</dt>
                                            <dd className="text-[#0a3b41]">{verification.businessNo}</dd>
                                        </div>
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">회사명</dt>
                                            <dd className="text-[#0a3b41]">{verification.companyName}</dd>
                                        </div>
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">담당자명</dt>
                                            <dd className="text-[#0a3b41]">{verification.contactName ?? "-"}</dd>
                                        </div>
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">담당자 연락처</dt>
                                            <dd className="text-[#0a3b41]">{verification.contactPhone ?? "-"}</dd>
                                        </div>
                                        <div className="flex">
                                            <dt className="w-24 text-gray-500">담당자 이메일</dt>
                                            <dd className="text-[#0a3b41]">{verification.contactEmail ?? "-"}</dd>
                                        </div>
                                        {verification.businessLicenseFileId && (
                                            <div className="flex items-center pt-2">
                                                <dt className="w-24 text-gray-500">사업자등록증</dt>
                                                <dd>
                                                    <Button
                                                        variant="secondary"
                                                        size="xs"
                                                        onClick={() =>
                                                            handleDownloadFile(verification.businessLicenseFileId!)
                                                        }
                                                        isLoading={downloadMutation.isPending}
                                                        LeadingIcon={<Download />}
                                                    >
                                                        파일 보기
                                                    </Button>
                                                </dd>
                                            </div>
                                        )}
                                    </>
                                )}
                            </dl>
                        </div>

                        {/* 반려 사유 */}
                        {verification.status === "rejected" && verification.rejectReason && (
                            <div className="bg-red-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-red-700 mb-2">반려 사유</h3>
                                <p className="text-sm text-red-600">{verification.rejectReason}</p>
                                {verification.reviewedAt && (
                                    <p className="text-xs text-red-400 mt-2">
                                        반려일: {dayjs(verification.reviewedAt).format("YYYY.MM.DD HH:mm")}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 승인 정보 */}
                        {verification.status === "approved" && verification.reviewedAt && (
                            <div className="bg-green-50 rounded-lg p-4">
                                <p className="text-sm text-green-600">
                                    승인일: {dayjs(verification.reviewedAt).format("YYYY.MM.DD HH:mm")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end px-5 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
                    <Button variant="secondary" onClick={onClose}>
                        닫기
                    </Button>
                </div>
            </div>
        </div>
    );
}
