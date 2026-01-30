"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button/button";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "primary" | "danger";
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "확인",
    cancelText = "취소",
    variant = "primary",
    isLoading = false,
}: ConfirmModalProps) {
    const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
                onKeyDown={handleBackdropKeyDown}
                role="button"
                tabIndex={0}
                aria-label="모달 닫기"
            />

            {/* Modal */}
            <div
                className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-xl mx-4"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-description"
            >
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            variant === "danger" ? "bg-red-100" : "bg-[#62e3d5]/20"
                        }`}>
                            <AlertTriangle className={`w-5 h-5 ${
                                variant === "danger" ? "text-red-600" : "text-[#0a3b41]"
                            }`} />
                        </div>
                        <h2 id="confirm-modal-title" className="text-lg font-semibold text-[#0a3b41]">
                            {title}
                        </h2>
                    </div>
                    <p id="confirm-modal-description" className="text-sm text-gray-600">
                        {message}
                    </p>
                </div>
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === "danger" ? "danger" : "primary"}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
