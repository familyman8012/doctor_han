import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import Modal from "./Modal";
import AlertModal from "./AlertModal";
import ConfirmModal from "./ConfirmModal";
import { useConfirmModalStore } from "@/stores/confirmModalStore";
import { Button } from "@/components/ui/Button/button";

const meta: Meta<typeof Modal> = {
    title: "Modal/Modal",
    component: Modal,
    tags: ["autodocs"],
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const UsageExamples: Story = {
    render: () => {
        const Examples = () => {
            const [basicOpen, setBasicOpen] = useState(false);
            const [alertOpen, setAlertOpen] = useState(false);
            const [customOpen, setCustomOpen] = useState(false);
            const [noButtonsOpen, setNoButtonsOpen] = useState(false);
            const [withCloseOpen, setWithCloseOpen] = useState(false);

            const { openModal } = useConfirmModalStore();

            return (
                <div className="p-8 space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Modal Component Examples</h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Basic Modal</h4>
                                <Button onClick={() => setBasicOpen(true)}>Open Basic Modal</Button>
                                <Modal
                                    isOpen={basicOpen}
                                    onClose={() => setBasicOpen(false)}
                                    title="기본 모달"
                                    onFormSubmit={() => {
                                        console.log("Submit clicked");
                                        setBasicOpen(false);
                                    }}
                                    onCancel={() => {
                                        console.log("Cancel clicked");
                                        setBasicOpen(false);
                                    }}
                                >
                                    <p className="text-sm text-neutral-60">
                                        이것은 기본 모달입니다. 확인과 취소 버튼이 있습니다.
                                    </p>
                                </Modal>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Alert Modal</h4>
                                <Button onClick={() => setAlertOpen(true)} variant="secondary">
                                    Open Alert Modal
                                </Button>
                                <AlertModal
                                    isOpen={alertOpen}
                                    title="알림"
                                    content="작업이 성공적으로 완료되었습니다."
                                    onClose={() => setAlertOpen(false)}
                                />
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Confirm Modal (with Zustand)</h4>
                                <Button
                                    onClick={() => {
                                        openModal({
                                            title: "확인",
                                            content: (
                                                <p className="text-sm text-neutral-60">
                                                    정말로 이 작업을 수행하시겠습니까?
                                                    <br />이 작업은 되돌릴 수 없습니다.
                                                </p>
                                            ),
                                            onFormSubmit: () => {
                                                console.log("Confirmed!");
                                                useConfirmModalStore.getState().closeModal();
                                            },
                                            onCancel: () => {
                                                console.log("Cancelled");
                                                useConfirmModalStore.getState().closeModal();
                                            },
                                            submitButtonText: "삭제",
                                            cancelButtonText: "취소",
                                            showCancelButton: true,
                                        });
                                    }}
                                    variant="ghostPrimary"
                                >
                                    Open Confirm Modal
                                </Button>
                                <ConfirmModal />
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Modal with Close Button</h4>
                                <Button onClick={() => setWithCloseOpen(true)} variant="ghostSecondary">
                                    Open Modal with Close Button
                                </Button>
                                <Modal
                                    isOpen={withCloseOpen}
                                    onClose={() => setWithCloseOpen(false)}
                                    title="닫기 버튼이 있는 모달"
                                    showCloseButton={true}
                                    onFormSubmit={() => setWithCloseOpen(false)}
                                    showCancelButton={false}
                                    submitButtonText="저장"
                                >
                                    <div className="space-y-4">
                                        <p className="text-sm text-neutral-60">
                                            이 모달은 제목 옆에 X 닫기 버튼이 있습니다.
                                        </p>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-neutral-80 rounded"
                                            placeholder="여기에 입력하세요..."
                                        />
                                    </div>
                                </Modal>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Modal without Buttons</h4>
                                <Button onClick={() => setNoButtonsOpen(true)} variant="secondary">
                                    Open Modal without Buttons
                                </Button>
                                <Modal
                                    isOpen={noButtonsOpen}
                                    onClose={() => setNoButtonsOpen(false)}
                                    title="버튼이 없는 모달"
                                    showButtons={false}
                                    showCloseButton={true}
                                >
                                    <div className="space-y-4">
                                        <p className="text-sm text-neutral-60">
                                            이 모달은 하단 버튼이 없고, 닫기 버튼만 있습니다.
                                        </p>
                                        <div className="bg-neutral-95 p-4 rounded">
                                            <p className="text-xs text-neutral-40">
                                                사용자가 내용을 읽고 X 버튼으로 닫을 수 있습니다.
                                            </p>
                                        </div>
                                    </div>
                                </Modal>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Custom Content Modal</h4>
                                <Button onClick={() => setCustomOpen(true)}>Open Custom Content Modal</Button>
                                <Modal
                                    isOpen={customOpen}
                                    onClose={() => setCustomOpen(false)}
                                    title="커스텀 콘텐츠"
                                    onFormSubmit={() => setCustomOpen(false)}
                                    submitButtonText="완료"
                                    showCancelButton={false}
                                >
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h5 className="font-medium text-blue-900 mb-2">중요 안내</h5>
                                            <ul className="text-sm text-blue-700 space-y-1">
                                                <li>• 첫 번째 안내 사항</li>
                                                <li>• 두 번째 안내 사항</li>
                                                <li>• 세 번째 안내 사항</li>
                                            </ul>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="agree" className="rounded" />
                                            <label htmlFor="agree" className="text-sm">
                                                위 내용을 모두 확인했습니다
                                            </label>
                                        </div>
                                    </div>
                                </Modal>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-gray-50 rounded">
                        <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts (ConfirmModal)</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>• ESC: 모달 닫기</li>
                            <li>• Enter: 확인 동작 수행</li>
                        </ul>
                    </div>
                </div>
            );
        };

        return <Examples />;
    },
    parameters: {
        docs: {
            source: {
                code: null,
            },
        },
    },
};

const Default: Story = {
    render: (args) => {
        const ModalExample = () => {
            const [isOpen, setIsOpen] = useState(false);

            return (
                <>
                    <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
                    <Modal
                        {...args}
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        onFormSubmit={() => {
                            console.log("Submit");
                            setIsOpen(false);
                        }}
                        onCancel={() => {
                            console.log("Cancel");
                            setIsOpen(false);
                        }}
                    />
                </>
            );
        };

        return <ModalExample />;
    },
    args: {
        title: "모달 제목",
        children: "모달 내용이 여기에 표시됩니다.",
        submitButtonText: "확인",
        cancelButtonText: "취소",
        showCancelButton: true,
        showCloseButton: false,
        showButtons: true,
    },
};

const WithCloseButton: Story = {
    render: (args) => {
        const ModalExample = () => {
            const [isOpen, setIsOpen] = useState(false);

            return (
                <>
                    <Button onClick={() => setIsOpen(true)}>Open Modal with Close Button</Button>
                    <Modal
                        {...args}
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        onFormSubmit={() => setIsOpen(false)}
                    />
                </>
            );
        };

        return <ModalExample />;
    },
    args: {
        title: "닫기 버튼이 있는 모달",
        children: "X 버튼으로 닫을 수 있습니다.",
        submitButtonText: "확인",
        showCancelButton: false,
        showCloseButton: true,
        showButtons: true,
    },
};

const Alert: Story = {
    render: () => {
        const AlertExample = () => {
            const [isOpen, setIsOpen] = useState(false);

            return (
                <>
                    <Button onClick={() => setIsOpen(true)}>Show Alert</Button>
                    <AlertModal
                        isOpen={isOpen}
                        title="알림"
                        content="작업이 완료되었습니다."
                        onClose={() => setIsOpen(false)}
                    />
                </>
            );
        };

        return <AlertExample />;
    },
};

export { Default, WithCloseButton, Alert };
