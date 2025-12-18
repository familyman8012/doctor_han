"use client";

import Modal from "./Modal";
import { cn } from "@/components/utils";

interface AlertModalProps {
    isOpen?: boolean;
    title?: string;
    content?: string;
    onClose?: () => void;
    className?: string;
}

const AlertModal = ({ isOpen, title, content, onClose, className }: AlertModalProps) => {
    return (
        <Modal
            isOpen={!!isOpen}
            onClose={() => onClose?.()}
            onFormSubmit={() => onClose?.()}
            showCancelButton={false}
            showCloseButton={false}
        >
            <div
                className={cn(
                    "flex flex-col items-center justify-center",
                    "p-6 -m-6 mb-0",
                    "border-b border-gray-200",
                    className,
                )}
            >
                {title && (
                    <h4 className="text-center text-base leading-relaxed font-semibold text-[#0a3b41]">{title}</h4>
                )}
                {content && (
                    <p className="text-sm leading-normal font-normal text-[#5a6376] whitespace-pre-wrap">{content}</p>
                )}
            </div>
        </Modal>
    );
};

export default AlertModal;
