"use client";

import { useCallback, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button/button";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export function DeleteConfirmModal({
    isOpen,
    title,
    message,
    isLoading,
    onConfirm,
    onClose,
}: DeleteConfirmModalProps) {
    // Escape key handler
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isLoading) {
                onClose();
            }
        },
        [onClose, isLoading]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={isLoading ? undefined : onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-semibold text-[#0a3b41]">{title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        aria-label="닫기"
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5">
                    <p className="text-gray-600 whitespace-pre-wrap">{message}</p>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                        취소
                    </Button>
                    <Button type="button" variant="danger" onClick={onConfirm} isLoading={isLoading}>
                        삭제
                    </Button>
                </div>
            </div>
        </div>
    );
}
