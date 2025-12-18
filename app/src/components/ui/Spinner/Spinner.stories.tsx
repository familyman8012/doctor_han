import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";

interface SpinnerProps {
    className?: string;
    color?: string;
    size?: "xs" | "sm" | "md" | "lg";
}

const meta: Meta<SpinnerProps> = {
    title: "Ui/Spinner",
    component: Spinner,
    tags: ["autodocs"],
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
    argTypes: {
        size: {
            control: "select",
            options: ["xs", "sm", "md", "lg"],
            description: "Spinner size",
        },
        className: {
            control: "text",
            description: "Additional CSS classes",
        },
        color: {
            control: "color",
            description: "Spinner color",
        },
    },
};

export default meta;
type Story = StoryObj<SpinnerProps>;

export const Default: Story = {
    args: {},
};

export const Sizes: Story = {
    render: () => (
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
                <Spinner size="xs" />
                <span className="text-xs text-gray-500">xs</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <Spinner size="sm" />
                <span className="text-xs text-gray-500">sm</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <Spinner size="md" />
                <span className="text-xs text-gray-500">md</span>
            </div>
            <div className="flex flex-col items-center gap-1">
                <Spinner size="lg" />
                <span className="text-xs text-gray-500">lg</span>
            </div>
        </div>
    ),
};

export const Colors: Story = {
    render: () => (
        <div className="flex items-center gap-4">
            <Spinner color="#3B82F6" />
            <Spinner color="#10B981" />
            <Spinner color="#F59E0B" />
            <Spinner color="#EF4444" />
            <Spinner color="#8B5CF6" />
        </div>
    ),
};

export const UsageExamples: Story = {
    render: () => (
        <div className="p-8 space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Button Loading State</h3>
                <div className="flex gap-3">
                    <button className="px-3 py-2 bg-[#62e3d5] text-[#0a3b41] rounded-[8px] flex items-center gap-2 text-sm font-medium">
                        <Spinner size="sm" color="#0a3b41" />
                        저장 중...
                    </button>
                    <button className="px-3 py-2 border border-gray-200 rounded-[8px] flex items-center gap-2 text-sm text-[#0a3b41]">
                        <Spinner size="sm" />
                        처리 중
                    </button>
                    <button
                        disabled
                        className="px-3 py-2 bg-gray-100 text-gray-400 rounded-[8px] flex items-center gap-2 text-sm cursor-not-allowed"
                    >
                        <Spinner size="xs" color="#9ca3af" />
                        대기 중
                    </button>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Card Loading State</h3>
                <div className="border border-gray-200 rounded-[8px] p-8 flex flex-col items-center justify-center bg-white">
                    <Spinner size="lg" className="mb-3" />
                    <p className="text-sm text-[#5f6b6d]">데이터를 불러오는 중...</p>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Table Loading</h3>
                <div className="border border-gray-100 rounded-[8px] bg-white">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h4 className="text-sm font-medium text-[#0a3b41]">출고 요청 목록</h4>
                    </div>
                    <div className="p-12 flex flex-col items-center justify-center">
                        <Spinner size="md" className="mb-2" />
                        <p className="text-sm text-[#5f6b6d]">목록을 가져오는 중...</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">Inline Loading</h3>
                <div className="space-y-2">
                    <p className="text-sm text-[#0a3b41]">
                        데이터 동기화 중 <Spinner size="xs" className="inline-block ml-1" />
                    </p>
                    <p className="text-sm text-[#5f6b6d]">
                        파일 업로드: document.pdf <Spinner size="xs" className="inline-block ml-2" color="#5f6b6d" />
                    </p>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            source: {
                code: null,
            },
        },
    },
};
