"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button/Button";

interface RejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    isLoading: boolean;
}

export function RejectModal({ isOpen, onClose, onSubmit, isLoading }: RejectModalProps) {
    const [reason, setReason] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;
        onSubmit(reason.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-[#0a3b41]">인증 반려</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="p-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">반려 사유</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="반려 사유를 입력해주세요"
                            className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#62e3d5] focus:border-transparent"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            반려 사유는 신청자에게 전달됩니다.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            취소
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            isLoading={isLoading}
                            disabled={!reason.trim()}
                        >
                            반려하기
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
