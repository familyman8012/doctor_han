"use client";

import { useCallback, useEffect } from "react";
import { useConfirmModalStore } from "@/stores/confirmModalStore";
import Modal from "./Modal";

const ConfirmModal = () => {
    const {
        isOpen,
        title,
        content,
        submitButtonText,
        cancelButtonText,
        showCloseButton,
        showCancelButton,
        showButtons,
        onFormSubmit,
        onCancel,
        onClose,
        closeModal,
    } = useConfirmModalStore();

    const handleClose = useCallback(() => {
        if (typeof onClose === "function") {
            onClose();
        } else {
            closeModal();
        }
    }, [onClose, closeModal]);

    const handleCancel = useCallback(() => {
        if (typeof onCancel === "function") {
            onCancel();
        } else {
            closeModal();
        }
    }, [onCancel, closeModal]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeydown = (e: KeyboardEvent) => {
            if (e.repeat) return;

            switch (e.key) {
                // ESC 클릭시 onClose 효과
                case "Escape":
                    handleClose();
                    break;
                case "Enter":
                    onFormSubmit();
                    break;
                default:
                    break;
            }
        };

        document.addEventListener("keydown", handleKeydown);

        return () => document.removeEventListener("keydown", handleKeydown);
    }, [isOpen, onFormSubmit, handleClose]);

    return (
        <Modal
            isOpen={isOpen}
            title={title}
            onClose={handleClose}
            onCancel={handleCancel}
            onFormSubmit={onFormSubmit}
            submitButtonText={submitButtonText}
            cancelButtonText={cancelButtonText}
            showCloseButton={showCloseButton}
            showCancelButton={showCancelButton}
            showButtons={showButtons}
        >
            {content}
        </Modal>
    );
};

export default ConfirmModal;
