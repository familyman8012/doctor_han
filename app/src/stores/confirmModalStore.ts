import { create } from "zustand";
import { type ReactNode } from "react";

type ConfirmModalOptions = {
    title?: string | ReactNode;
    content?: ReactNode;
    onFormSubmit?: () => void;
    onCancel?: () => void;
    onClose?: () => void;
    submitButtonText?: string;
    cancelButtonText?: string;
    showCloseButton?: boolean;
    showCancelButton?: boolean;
    showButtons?: boolean;
};

type ConfirmModalStore = {
    isOpen: boolean;
    title?: string | ReactNode;
    content?: ReactNode;
    onFormSubmit: () => void;
    onCancel?: () => void;
    onClose?: () => void;
    submitButtonText: string;
    cancelButtonText: string;
    showCloseButton: boolean;
    showCancelButton: boolean;
    showButtons: boolean;
    openModal: (options: ConfirmModalOptions) => void;
    closeModal: () => void;
};

const defaults = {
    isOpen: false,
    title: undefined,
    content: undefined,
    onFormSubmit: () => {},
    onCancel: undefined,
    onClose: undefined,
    submitButtonText: "확인",
    cancelButtonText: "취소",
    showCloseButton: false,
    showCancelButton: true,
    showButtons: true,
} as const;

export const useConfirmModalStore = create<ConfirmModalStore>((set) => ({
    ...defaults,
    openModal: (options) =>
        set({
            ...defaults,
            ...options,
            isOpen: true,
            onFormSubmit: options.onFormSubmit ?? defaults.onFormSubmit,
        }),
    closeModal: () => set({ ...defaults }),
}));
