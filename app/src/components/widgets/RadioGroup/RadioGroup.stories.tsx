import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { RadioGroup } from "./RadioGroup";
import { Radio } from "@/components/ui/Radio/Radio";

const meta: Meta<typeof RadioGroup> = {
    title: "Widgets/RadioGroup",
    component: RadioGroup,
    tags: ["autodocs"],
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
    argTypes: {
        direction: {
            control: "radio",
            options: ["horizontal", "vertical"],
            description: "Radio 배치 방향",
        },
        size: {
            control: "radio",
            options: ["sm", "md"],
            description: "Radio 크기",
        },
        disabled: {
            control: "boolean",
            description: "비활성화 상태",
        },
    },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

// Usage Examples를 최상단에 배치
export const UsageExamples: Story = {
    render: () => {
        const ControlledExample = () => {
            const [value, setValue] = useState("option1");

            return (
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">선택된 값: {value}</p>
                        <RadioGroup
                            value={value}
                            onChange={setValue}
                            options={[
                                { value: "option1", label: "옵션 1" },
                                { value: "option2", label: "옵션 2" },
                                { value: "option3", label: "옵션 3" },
                            ]}
                        />
                    </div>
                </div>
            );
        };

        const UncontrolledExample = () => {
            const [lastChanged, setLastChanged] = useState("");

            return (
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">마지막 변경: {lastChanged || "없음"}</p>
                        <RadioGroup
                            defaultValue="default2"
                            onChange={(value) => setLastChanged(value)}
                            options={[
                                { value: "default1", label: "기본 옵션 1" },
                                { value: "default2", label: "기본 옵션 2 (초기 선택)" },
                                { value: "default3", label: "기본 옵션 3" },
                            ]}
                        />
                    </div>
                </div>
            );
        };

        return (
            <div className="p-8 space-y-12">
                <div>
                    <h3 className="text-lg font-semibold mb-4">1. Options 배열 사용 (권장)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-3">Controlled 모드</h4>
                            <ControlledExample />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-3">Uncontrolled 모드</h4>
                            <UncontrolledExample />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">2. Children으로 Radio 전달</h3>
                    <RadioGroup defaultValue="child2">
                        <Radio value="child1" label="자식 라디오 1" />
                        <Radio value="child2" label="자식 라디오 2" subText="서브 텍스트 포함" />
                        <Radio value="child3" label="자식 라디오 3" />
                    </RadioGroup>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">3. 중첩된 구조 지원</h3>
                    <RadioGroup defaultValue="nested1" direction="vertical">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">그룹 A</p>
                            <Radio value="nested1" label="중첩 옵션 1" />
                            <Radio value="nested2" label="중첩 옵션 2" />
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">그룹 B</p>
                            <Radio value="nested3" label="중첩 옵션 3" />
                            <Radio value="nested4" label="중첩 옵션 4" />
                        </div>
                    </RadioGroup>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">4. 가로/세로 배치</h3>
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">가로 배치 (horizontal)</p>
                            <RadioGroup
                                direction="horizontal"
                                defaultValue="h1"
                                options={[
                                    { value: "h1", label: "가로 1" },
                                    { value: "h2", label: "가로 2" },
                                    { value: "h3", label: "가로 3" },
                                    { value: "h4", label: "가로 4" },
                                ]}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">세로 배치 (vertical)</p>
                            <RadioGroup
                                direction="vertical"
                                defaultValue="v1"
                                options={[
                                    { value: "v1", label: "세로 1" },
                                    { value: "v2", label: "세로 2" },
                                    { value: "v3", label: "세로 3" },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">5. 크기 및 서브 텍스트</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">작은 크기 (sm)</p>
                            <RadioGroup
                                size="sm"
                                defaultValue="sm1"
                                options={[
                                    { value: "sm1", label: "작은 옵션 1", subText: "설명 텍스트" },
                                    { value: "sm2", label: "작은 옵션 2", subText: "추가 정보" },
                                    { value: "sm3", label: "작은 옵션 3" },
                                ]}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">중간 크기 (md)</p>
                            <RadioGroup
                                size="md"
                                defaultValue="md1"
                                options={[
                                    { value: "md1", label: "중간 옵션 1", subText: "설명 텍스트" },
                                    { value: "md2", label: "중간 옵션 2", subText: "추가 정보" },
                                    { value: "md3", label: "중간 옵션 3" },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">6. 비활성화 상태</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">전체 비활성화</p>
                            <RadioGroup
                                disabled
                                defaultValue="dis1"
                                options={[
                                    { value: "dis1", label: "비활성 옵션 1" },
                                    { value: "dis2", label: "비활성 옵션 2" },
                                    { value: "dis3", label: "비활성 옵션 3" },
                                ]}
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">개별 비활성화</p>
                            <RadioGroup defaultValue="ind1">
                                <Radio value="ind1" label="활성 옵션" />
                                <Radio value="ind2" label="비활성 옵션" disabled />
                                <Radio value="ind3" label="활성 옵션" />
                            </RadioGroup>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
    parameters: {
        docs: {
            source: {
                code: null,
            },
        },
    },
};

// 기본 예제
const Default: Story = {
    render: (args) => <RadioGroup {...args} />,
    args: {
        options: [
            { value: "option1", label: "옵션 1" },
            { value: "option2", label: "옵션 2" },
            { value: "option3", label: "옵션 3" },
        ],
        defaultValue: "option1",
    },
};

// Options 배열 사용
const WithOptions: Story = {
    render: (args) => {
        const [value, setValue] = useState("opt2");
        return (
            <div className="space-y-4">
                <p className="text-sm text-gray-600">선택된 값: {value}</p>
                <RadioGroup {...args} value={value} onChange={setValue} />
            </div>
        );
    },
    args: {
        options: [
            { value: "opt1", label: "첫 번째 옵션", subText: "첫 번째 옵션에 대한 설명" },
            { value: "opt2", label: "두 번째 옵션", subText: "두 번째 옵션에 대한 설명" },
            { value: "opt3", label: "세 번째 옵션", subText: "세 번째 옵션에 대한 설명" },
        ],
    },
};

// Children 사용
const WithChildren: Story = {
    render: (args) => (
        <RadioGroup {...args}>
            <Radio value="radio1" label="라디오 1" />
            <Radio value="radio2" label="라디오 2" subText="추가 설명" />
            <Radio value="radio3" label="라디오 3" />
            <Radio value="radio4" label="라디오 4" disabled />
        </RadioGroup>
    ),
    args: {
        defaultValue: "radio2",
    },
};

// 가로 배치
const Horizontal: Story = {
    render: (args) => <RadioGroup {...args} />,
    args: {
        direction: "horizontal",
        options: [
            { value: "h1", label: "옵션 A" },
            { value: "h2", label: "옵션 B" },
            { value: "h3", label: "옵션 C" },
            { value: "h4", label: "옵션 D" },
        ],
        defaultValue: "h1",
    },
};

// 크기 비교
const Sizes: Story = {
    render: () => (
        <div className="space-y-8">
            <div>
                <h4 className="text-sm font-medium mb-3">Small (sm)</h4>
                <RadioGroup
                    size="sm"
                    options={[
                        { value: "s1", label: "Small 1" },
                        { value: "s2", label: "Small 2" },
                        { value: "s3", label: "Small 3" },
                    ]}
                    defaultValue="s1"
                />
            </div>
            <div>
                <h4 className="text-sm font-medium mb-3">Medium (md)</h4>
                <RadioGroup
                    size="md"
                    options={[
                        { value: "m1", label: "Medium 1" },
                        { value: "m2", label: "Medium 2" },
                        { value: "m3", label: "Medium 3" },
                    ]}
                    defaultValue="m1"
                />
            </div>
        </div>
    ),
};

// 비활성화 상태
const Disabled: Story = {
    render: (args) => <RadioGroup {...args} />,
    args: {
        disabled: true,
        options: [
            { value: "d1", label: "비활성 1" },
            { value: "d2", label: "비활성 2" },
            { value: "d3", label: "비활성 3" },
        ],
        defaultValue: "d2",
    },
};

export { Default, WithOptions, WithChildren, Horizontal, Sizes, Disabled };
