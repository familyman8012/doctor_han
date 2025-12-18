import type { Meta, StoryObj } from "@storybook/react";
import { ErrorText } from "./ErrorText";

const meta: Meta<typeof ErrorText> = {
    title: "Ui/ErrorText",
    component: ErrorText,
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
type Story = StoryObj<typeof ErrorText>;

export const Default: Story = {
    args: {
        children: "에러 메시지입니다",
    },
};

export const ErrorTypes: Story = {
    render: () => (
        <div className="space-y-3">
            <div>
                <label className="text-sm font-medium">Required Error</label>
                <input type="text" className="w-full border rounded px-3 py-2 border-red-300" />
                <ErrorText error={{ type: "required" }} />
            </div>

            <div>
                <label className="text-sm font-medium">Min Length Error</label>
                <input type="text" className="w-full border rounded px-3 py-2 border-red-300" />
                <ErrorText error={{ type: "minLength", message: "8" }} />
            </div>

            <div>
                <label className="text-sm font-medium">Max Length Error</label>
                <input type="text" className="w-full border rounded px-3 py-2 border-red-300" />
                <ErrorText error={{ type: "maxLength", message: "20" }} />
            </div>

            <div>
                <label className="text-sm font-medium">Pattern Error</label>
                <input type="text" className="w-full border rounded px-3 py-2 border-red-300" />
                <ErrorText error={{ type: "pattern" }} />
            </div>

            <div>
                <label className="text-sm font-medium">Custom Message</label>
                <input type="text" className="w-full border rounded px-3 py-2 border-red-300" />
                <ErrorText error={{ message: "이미 사용중인 이메일입니다." }} />
            </div>
        </div>
    ),
};

export const WithFormExample: Story = {
    render: () => (
        <div className="max-w-md space-y-4">
            <h3 className="text-lg font-semibold mb-4">회원가입 폼</h3>

            <div>
                <label className="text-sm font-medium">이메일 *</label>
                <input
                    type="email"
                    className="w-full border rounded px-3 py-2 border-red-300"
                    placeholder="example@email.com"
                />
                <ErrorText error={{ type: "required" }} />
            </div>

            <div>
                <label className="text-sm font-medium">비밀번호 *</label>
                <input
                    type="password"
                    className="w-full border rounded px-3 py-2 border-red-300"
                    placeholder="8자 이상 입력"
                />
                <ErrorText error={{ type: "minLength", message: "8" }} />
            </div>

            <div>
                <label className="text-sm font-medium">닉네임 *</label>
                <input type="text" className="w-full border rounded px-3 py-2" placeholder="2-10자 입력" />
            </div>
        </div>
    ),
};
