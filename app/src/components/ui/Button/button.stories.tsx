import type { Meta, StoryObj } from "@storybook/react";
import { Plus, Download, ChevronRight, ArrowRight, Filter, RefreshCw, Users } from "lucide-react";
import { Button, BtnDelete, type ButtonProps } from "./button";

interface Props extends ButtonProps {
    darkMode: boolean;
}

const meta: Meta<Props> = {
    title: "Ui/Button",
    component: Button,
    tags: ["autodocs"],
    args: {
        variant: "primary",
        size: "md",
        darkMode: false,
        disabled: false,
    },
    argTypes: {
        variant: {
            control: "radio",
            options: [
                "primary",
                "secondary",
                "ghostPrimary",
                "ghostSecondary",
                "selectItem",
                "selectItem_on",
                "transparent",
                "danger",
                "list",
                "listActive",
            ],
        },
        size: {
            control: "radio",
            options: ["xs", "sm", "md", "lg"],
        },
        disabled: {
            control: "boolean",
        },
        darkMode: {
            control: "boolean",
        },
    },
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
};

export default meta;

type Story = StoryObj<Props>;

type ButtonVariant =
    | "primary"
    | "secondary"
    | "ghostPrimary"
    | "ghostSecondary"
    | "selectItem"
    | "selectItem_on"
    | "transparent";

const buttons: ButtonVariant[] = ["primary", "secondary", "ghostPrimary", "ghostSecondary"];

const Default: Story = {
    render: (args) => (
        <div className="p-8">
            <style>
                {`
          .box_btn_line {
            display: flex;
            margin: 30px 0;
          }
          .box_btn_line button {
            margin-right: 5px;
          }
        `}
            </style>

            <div className="space-y-4">
                <div>
                    <Button {...args} variant="ghostSecondary" LeadingIcon={<Download />}>
                        내보내기
                    </Button>
                </div>
                <div>
                    <Button {...args} LeadingIcon={<Plus />}>
                        제품 등록
                    </Button>
                </div>
                <div>
                    <Button {...args} variant="ghostSecondary">
                        취소
                    </Button>
                </div>
                <div>
                    <Button {...args}>등록</Button>
                </div>
                <div>
                    <Button {...args} variant="ghostSecondary">
                        이전
                    </Button>
                </div>
                <div>
                    <Button {...args} variant="ghostSecondary" LeadingIcon={<Download />}>
                        다운로드
                    </Button>
                </div>
                <div>
                    <Button variant="selectItem" TrailingIcon={<BtnDelete />}>
                        Exception
                    </Button>
                </div>
                <div>
                    <Button variant="selectItem_on" TrailingIcon={<BtnDelete />}>
                        Exception
                    </Button>
                </div>
                <div>
                    <Button variant="selectItem" disabled TrailingIcon={<BtnDelete />}>
                        Exception
                    </Button>
                </div>
                <div>
                    <Button variant="selectItem_on" disabled TrailingIcon={<BtnDelete />}>
                        Exception
                    </Button>
                </div>
                <div>
                    <Button {...args} IconOnly={<ArrowRight />} />
                </div>
            </div>

            {buttons.map((el) => (
                <div key={el}>
                    <div className="box_btn_line">
                        <Button {...args} variant={el}>
                            Button default
                        </Button>
                        <Button {...args} variant={el} LeadingIcon={<Plus />}>
                            Button default
                        </Button>
                        <Button {...args} variant={el} TrailingIcon={<ChevronRight />}>
                            Button default
                        </Button>
                    </div>
                    <div className="box_btn_line">
                        <Button {...args} variant={el} disabled>
                            Button default
                        </Button>
                        <Button {...args} variant={el} LeadingIcon={<Plus />} disabled>
                            Button default
                        </Button>
                        <Button {...args} variant={el} TrailingIcon={<ChevronRight />} disabled>
                            Button default
                        </Button>
                    </div>
                    <div className="box_btn_line">
                        {/* sizeLg */}
                        <Button {...args} variant={el} size="lg">
                            Button default
                        </Button>
                        <Button {...args} variant={el} size="lg" LeadingIcon={<Plus />}>
                            Button default
                        </Button>
                        <Button {...args} variant={el} size="lg" TrailingIcon={<ChevronRight />}>
                            Button default
                        </Button>
                    </div>{" "}
                    <div className="box_btn_line">
                        {/* disabled */}
                        <Button {...args} variant={el} size="lg" disabled>
                            Button default
                        </Button>
                        <Button {...args} variant={el} size="lg" LeadingIcon={<Plus />} disabled>
                            Button default
                        </Button>
                        <Button {...args} variant={el} size="lg" TrailingIcon={<ChevronRight />} disabled>
                            Button default
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    ),
};

// 실제 사용 예제 코드 - 맨 앞에 표시
export const UsageExamples: Story = {
    render: () => (
        <div className="p-8 space-y-8">
            <div>
                <h3 className="text-lg font-bold mb-4">실제 사용 예제 코드</h3>
                <p className="text-sm text-gray-600 mb-6">
                    아래는 실제 React 컴포넌트에서 Button을 사용하는 방법입니다. 복사해서 바로 사용하세요.
                </p>
            </div>

            <div className="space-y-6">
                {/* 기본 버튼 */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">기본 버튼</h4>
                    <div className="mb-4 flex gap-2">
                        <Button variant="primary">저장</Button>
                        <Button variant="secondary">취소</Button>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`<Button variant="primary">저장</Button>
<Button variant="secondary">취소</Button>`}
                    </pre>
                </div>

                {/* 아이콘이 있는 버튼 */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">아이콘이 있는 버튼</h4>
                    <div className="mb-4 flex gap-2">
                        <Button variant="primary" LeadingIcon={<Plus />}>
                            새로 만들기
                        </Button>
                        <Button variant="ghostSecondary" LeadingIcon={<Download />}>
                            다운로드
                        </Button>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`import { Plus, Download } from "lucide-react";

<Button variant="primary" LeadingIcon={<Plus />}>
  새로 만들기
</Button>
<Button variant="ghostSecondary" LeadingIcon={<Download />}>
  다운로드
</Button>`}
                    </pre>
                </div>

                {/* 비활성화된 버튼 */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">비활성화된 버튼</h4>
                    <div className="mb-4 flex gap-2">
                        <Button variant="primary" disabled>
                            비활성화
                        </Button>
                        <Button variant="ghostPrimary" disabled>
                            사용 불가
                        </Button>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`<Button variant="primary" disabled>
  비활성화
</Button>
<Button variant="ghostPrimary" disabled>
  사용 불가
</Button>`}
                    </pre>
                </div>

                {/* 리스트 페이지용 컴팩트 버튼 (34px) */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">리스트 페이지용 컴팩트 버튼 (34px 높이)</h4>
                    <p className="text-sm text-gray-600 mb-3">
                        리스트 페이지에서 사용하는 34px 높이의 컴팩트한 버튼들입니다.
                    </p>
                    <div className="mb-4 flex gap-2">
                        <Button variant="list" size="sm" LeadingIcon={<Users />}>
                            내것만
                        </Button>
                        <Button variant="listActive" size="sm" LeadingIcon={<Users />}>
                            내것만
                        </Button>
                        <Button variant="list" size="sm" LeadingIcon={<Filter />}>
                            필터
                        </Button>
                        <Button variant="list" size="sm" LeadingIcon={<RefreshCw />}>
                            갱신
                        </Button>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`import { Users, Filter, RefreshCw } from "lucide-react";

// 기본 상태 (34px 높이)
<Button variant="list" size="sm" LeadingIcon={<Users />}>
  내것만
</Button>

// 활성 상태 (34px 높이)
<Button variant="listActive" size="sm" LeadingIcon={<Users />}>
  내것만
</Button>

// 필터 버튼
<Button variant="list" size="sm" LeadingIcon={<Filter />}>
  필터
</Button>

// 갱신 버튼
<Button variant="list" size="sm" LeadingIcon={<RefreshCw />}>
  갱신
</Button>`}
                    </pre>
                </div>

                {/* 로딩 상태 */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">로딩 상태</h4>
                    <div className="mb-4 flex gap-2">
                        <Button variant="primary" isLoading>
                            저장 중...
                        </Button>
                        <Button variant="secondary" isLoading>
                            처리 중...
                        </Button>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`<Button variant="primary" isLoading>
  저장 중...
</Button>
<Button variant="secondary" isLoading>
  처리 중...
</Button>`}
                    </pre>
                </div>

                {/* 선택 가능한 아이템 */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">선택 가능한 아이템 (필터, 태그 등)</h4>
                    <div className="mb-4 flex gap-2">
                        <Button variant="selectItem" TrailingIcon={<BtnDelete />}>
                            React
                        </Button>
                        <Button variant="selectItem_on" TrailingIcon={<BtnDelete />}>
                            TypeScript
                        </Button>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`import { BtnDelete } from "@/components/ui/button";

<Button variant="selectItem" TrailingIcon={<BtnDelete />}>
  React
</Button>
<Button variant="selectItem_on" TrailingIcon={<BtnDelete />}>
  TypeScript
</Button>`}
                    </pre>
                </div>

                {/* 아이콘만 있는 버튼 */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">아이콘만 있는 버튼</h4>
                    <div className="mb-4 flex gap-2">
                        <Button variant="primary" IconOnly={<ArrowRight />} />
                        <Button variant="ghostSecondary" IconOnly={<Plus />} />
                        <Button variant="transparent" IconOnly={<Download />} />
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`import { ArrowRight, Plus, Download } from "lucide-react";

<Button variant="primary" IconOnly={<ArrowRight />} />
<Button variant="ghostSecondary" IconOnly={<Plus />} />
<Button variant="transparent" IconOnly={<Download />} />`}
                    </pre>
                </div>

                {/* 크기 조절 */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">크기 조절</h4>
                    <div className="mb-4 flex gap-2 items-center">
                        <Button size="sm">Small</Button>
                        <Button size="md">Medium</Button>
                        <Button size="lg">Large</Button>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>`}
                    </pre>
                </div>

                {/* onClick 이벤트 */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">클릭 이벤트 처리</h4>
                    <div className="mb-4">
                        <Button variant="primary" onClick={() => alert("버튼이 클릭되었습니다!")}>
                            클릭해보세요
                        </Button>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`<Button 
  variant="primary" 
  onClick={() => alert('버튼이 클릭되었습니다!')}
>
  클릭해보세요
</Button>`}
                    </pre>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            source: {
                code: null, // Show code 버튼 숨기기
            },
        },
    },
};

// Default를 나중에 export
export { Default };
