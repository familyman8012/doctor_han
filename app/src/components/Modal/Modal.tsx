"use client";

import { type FC, type ReactNode, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { useLayoutEffect } from "react";
import Portal from "./Portal";
import { cn } from "@/components/utils";

const modalOpenQueue: string[] = [];

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string | ReactNode;
    onFormSubmit?: () => void;
    onCancel?: () => void;
    disabledFormSubmit?: boolean;
    submitButtonText?: string;
    cancelButtonText?: string;
    showCloseButton?: boolean;
    showCancelButton?: boolean;
    children?: ReactNode;
    showButtons?: boolean;
    className?: string;
    overlayClassName?: string;
    contentClassName?: string;
    bodyClassName?: string;
    align?: "left" | "center";
    closeOnSubmit?: boolean;
}

const Modal: FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    onFormSubmit,
    onCancel,
    disabledFormSubmit,
    submitButtonText = "확인",
    cancelButtonText = "취소",
    showCloseButton = false,
    showCancelButton = true,
    showButtons = true,
    className,
    overlayClassName,
    contentClassName,
    bodyClassName,
    align = "left",
    children,
    closeOnSubmit = true,
}) => {
    // modal open queue 데이터를 통해서 body 스크롤 제어
    useLayoutEffect(() => {
        const uuid = Math.random().toString(36).substr(2, 9);
        if (isOpen) {
            modalOpenQueue.push(uuid);
            document.body.style.overflow = "hidden";
        }
        return () => {
            modalOpenQueue.splice(modalOpenQueue.indexOf(uuid), 1);
            if (modalOpenQueue.length === 0) {
                document.body.style.overflow = "";
            }
        };
    }, [isOpen]);

    const handleCancel = useCallback(() => {
        onCancel?.();
        onClose();
    }, [onCancel, onClose]);

    const handleSubmit = useCallback(() => {
        onFormSubmit?.();
        if (closeOnSubmit) {
            onClose();
        }
    }, [onFormSubmit, onClose, closeOnSubmit]);

    const modalContent = (
        <>
            {/* Dimmed Background */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className={cn(overlayClassName)}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 999998,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)'
                }}
            />

            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    "-translate-x-1/2 -translate-y-1/2",
                    "min-w-[360px] w-fit max-h-full",
                    "bg-white rounded-[10px] overflow-y-auto",
                    "shadow-xl",
                    className,
                )}
                style={{
                    position: 'fixed',
                    left: '50%',
                    top: '50%',
                    zIndex: 999999,
                }}
            >
                {/* Header & Content Container */}
                <div
                    className={cn(
                        "flex flex-col items-center p-6",
                        align === "left" ? "text-left" : "text-center",
                        contentClassName,
                    )}
                >
                    {title && (
                        <div
                            className={cn(
                                "w-full mb-4",
                                (showCloseButton || align === "left") && "flex items-center",
                                align === "left" && "text-left",
                            )}
                        >
                            {typeof title === "string" ? (
                                <h2 className="text-[#0a3b41] text-lg font-semibold leading-tight flex-1">
                                    {title}
                                </h2>
                            ) : (
                                <div className="flex-1">{title}</div>
                            )}
                            {showCloseButton && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="ml-auto p-1 hover:bg-gray-100 rounded-md transition-all duration-150"
                                    aria-label="닫기"
                                >
                                    <X size={20} className="text-[#5a6376]" />
                                </button>
                            )}
                        </div>
                    )}
                    <div className={cn("w-full", bodyClassName)}>{children}</div>
                </div>

                {/* Button Container */}
                {showButtons && (
                    <div className="px-6 pb-6 flex gap-3 justify-center">
                        {showCancelButton && (
                            <Button
                                variant="ghostSecondary"
                                onClick={handleCancel}
                                className="flex-1 h-[38px] text-sm leading-tight rounded-md"
                            >
                                {cancelButtonText}
                            </Button>
                        )}
                        <Button
                            type="button"
                            disabled={disabledFormSubmit}
                            onClick={handleSubmit}
                            className="flex-1 h-[38px] text-sm leading-tight rounded-md bg-[#62e3d5] hover:bg-[#4dd4c5] border-[#62e3d5]"
                        >
                            {submitButtonText}
                        </Button>
                    </div>
                )}
            </motion.div>
        </>
    );

    return (
        <Portal>
            <AnimatePresence>{isOpen && modalContent}</AnimatePresence>
        </Portal>
    );
};

export default Modal;
