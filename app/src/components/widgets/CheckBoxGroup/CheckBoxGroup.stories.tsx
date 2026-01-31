import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { CheckBoxGroup, ConnectedCheckBox, AllCheckBox } from "./CheckBoxGroup";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";

const meta: Meta<typeof CheckBoxGroup> = {
    title: "Widgets/CheckBoxGroup",
    component: CheckBoxGroup,
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
            control: { type: "radio" },
            options: ["sm", "md"],
            description: "체크박스 크기",
        },
        direction: {
            control: { type: "radio" },
            options: ["horizontal", "vertical"],
            description: "체크박스 배치 방향",
        },
        disabled: {
            control: "boolean",
            description: "비활성화 상태",
        },
        onChange: {
            action: "onChange",
            description: "선택 값 변경 시 호출되는 콜백",
        },
    },
};

export default meta;
type Story = StoryObj<typeof CheckBoxGroup>;

// 기본 예제
export const Default: Story = {
    render: (args) => {
        const Component = () => {
            const [selectedValues, setSelectedValues] = useState<string[]>([]);

            return (
                <div className="space-y-4">
                    <CheckBoxGroup
                        {...args}
                        options={[
                            { label: "옵션 1", value: "option1" },
                            { label: "옵션 2", value: "option2" },
                            { label: "옵션 3", value: "option3" },
                            { label: "옵션 4", value: "option4" },
                        ]}
                        onChange={setSelectedValues}
                    />
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">선택된 값:</p>
                        <p className="font-medium">{selectedValues.length > 0 ? selectedValues.join(", ") : "없음"}</p>
                    </div>
                </div>
            );
        };
        return <Component />;
    },
};

// 전체 선택 기능
export const WithAllCheckHandler: Story = {
    render: (args) => {
        const Component = () => {
            const [selectedValues, setSelectedValues] = useState<string[]>([]);

            const options = [
                { label: "사과", value: "apple" },
                { label: "바나나", value: "banana" },
                { label: "오렌지", value: "orange" },
                { label: "포도", value: "grape" },
            ];

            return (
                <div className="space-y-4">
                    <CheckBoxGroup {...args} options={options} allCheckHandler={options} onChange={setSelectedValues} />
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-blue-600">선택된 과일:</p>
                        <p className="font-medium">{selectedValues.length > 0 ? selectedValues.join(", ") : "없음"}</p>
                    </div>
                </div>
            );
        };
        return <Component />;
    },
};

// 서브텍스트 포함
export const WithSubText: Story = {
    render: (args) => {
        const Component = () => {
            const [, setSelectedValues] = useState<string[]>([]);

            return (
                <CheckBoxGroup
                    {...args}
                    options={[
                        {
                            label: "이메일 알림",
                            subText: "중요한 업데이트를 이메일로 받습니다",
                            value: "email",
                        },
                        {
                            label: "SMS 알림",
                            subText: "긴급한 알림을 문자로 받습니다",
                            value: "sms",
                        },
                        {
                            label: "푸시 알림",
                            subText: "앱을 통해 실시간 알림을 받습니다",
                            value: "push",
                        },
                    ]}
                    onChange={setSelectedValues}
                />
            );
        };
        return <Component />;
    },
};

// 수평 배치
export const Horizontal: Story = {
    args: {
        direction: "horizontal",
        size: "sm",
    },
    render: (args) => {
        const Component = () => {
            const [, setSelectedValues] = useState<string[]>([]);

            return (
                <CheckBoxGroup
                    {...args}
                    options={[
                        { label: "월요일", value: "mon" },
                        { label: "화요일", value: "tue" },
                        { label: "수요일", value: "wed" },
                        { label: "목요일", value: "thu" },
                        { label: "금요일", value: "fri" },
                        { label: "토요일", value: "sat" },
                        { label: "일요일", value: "sun" },
                    ]}
                    onChange={setSelectedValues}
                />
            );
        };
        return <Component />;
    },
};

// 초기값 설정
export const WithInitialValues: Story = {
    render: (args) => {
        const Component = () => {
            const [, setSelectedValues] = useState<string[]>(["react", "typescript"]);

            return (
                <CheckBoxGroup
                    {...args}
                    options={[
                        { label: "React", value: "react" },
                        { label: "Vue", value: "vue" },
                        { label: "Angular", value: "angular" },
                        { label: "TypeScript", value: "typescript" },
                        { label: "JavaScript", value: "javascript" },
                    ]}
                    initialCheckedValues={["react", "typescript"]}
                    onChange={setSelectedValues}
                />
            );
        };
        return <Component />;
    },
};

// 비활성화 상태
export const Disabled: Story = {
    args: {
        disabled: true,
    },
    render: (args) => (
        <CheckBoxGroup
            {...args}
            options={[
                { label: "옵션 1", value: "option1" },
                { label: "옵션 2", value: "option2" },
                { label: "옵션 3", value: "option3" },
            ]}
            initialCheckedValues={["option1"]}
        />
    ),
};

// Children으로 커스텀 체크박스 사용
export const WithChildren: Story = {
    render: (args) => {
        const Component = () => {
            const [selectedValues, setSelectedValues] = useState<string[]>([]);

            return (
                <div className="space-y-4">
                    <CheckBoxGroup {...args} onChange={setSelectedValues}>
                        <Checkbox value="custom1" label="커스텀 체크박스 1" />
                        <Checkbox value="custom2" label="커스텀 체크박스 2" />
                        <div className="p-2 bg-gray-100 rounded">
                            <Checkbox value="custom3" label="그룹 안의 체크박스" />
                        </div>
                        <Checkbox value="custom4" label="커스텀 체크박스 4" />
                    </CheckBoxGroup>
                    <div className="mt-4 p-3 bg-green-50 rounded">
                        <p className="text-sm text-green-600">선택된 값:</p>
                        <p className="font-medium">{selectedValues.length > 0 ? selectedValues.join(", ") : "없음"}</p>
                    </div>
                </div>
            );
        };
        return <Component />;
    },
};

// 테이블에서 사용 예제
export const WithTable: Story = {
    render: () => {
        const Component = () => {
            const [selectedIds, setSelectedIds] = useState<string[]>([]);

            // 샘플 데이터
            const tableData = [
                { id: "1", name: "김철수", email: "kim@example.com", role: "관리자", status: "활성" },
                { id: "2", name: "이영희", email: "lee@example.com", role: "사용자", status: "활성" },
                { id: "3", name: "박민수", email: "park@example.com", role: "사용자", status: "비활성" },
                { id: "4", name: "정다은", email: "jung@example.com", role: "에디터", status: "활성" },
                { id: "5", name: "최준호", email: "choi@example.com", role: "사용자", status: "활성" },
            ];

            const allOptions = tableData.map((row) => ({
                value: row.id,
                label: row.name,
            }));

            const handleAction = (action: string) => {
                console.log(`${action} 실행 - 선택된 항목:`, selectedIds);
                alert(`${action} 실행\n선택된 ID: ${selectedIds.join(", ")}`);
            };

            return (
                <div className="space-y-4">
                    {/* 액션 버튼들 */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAction("삭제")}
                            disabled={selectedIds.length === 0}
                            className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
                        >
                            선택 삭제 ({selectedIds.length})
                        </button>
                        <button
                            onClick={() => handleAction("내보내기")}
                            disabled={selectedIds.length === 0}
                            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                        >
                            선택 내보내기
                        </button>
                        <button
                            onClick={() => handleAction("상태변경")}
                            disabled={selectedIds.length === 0}
                            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
                        >
                            상태 변경
                        </button>
                    </div>

                    {/* 테이블 - Context API 사용 */}
                    <CheckBoxGroup
                        initialCheckedValues={selectedIds}
                        onChange={setSelectedIds}
                        allCheckHandler={allOptions}
                        size="sm"
                    >
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="w-12 px-4 py-3 text-left">
                                            <AllCheckBox label="" />
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">이름</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                            이메일
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">역할</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">상태</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {tableData.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <ConnectedCheckBox value={row.id} />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{row.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{row.email}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{row.role}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        row.status === "활성"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CheckBoxGroup>

                    {/* 선택된 항목 표시 */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">선택된 항목 ID:</p>
                        <p className="text-sm text-blue-700 mt-1">
                            {selectedIds.length > 0 ? `[${selectedIds.join(", ")}]` : "없음"}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                            * Context API를 통해 테이블 구조를 깨지 않고 상태 관리
                        </p>
                    </div>
                </div>
            );
        };

        return <Component />;
    },
};

// React Hook Form 연동
export const WithReactHookForm: Story = {
    render: () => {
        const Component = () => {
            const { handleSubmit, control, watch } = useForm<{ checkboxGroup: string[] }>({
                defaultValues: {
                    checkboxGroup: ["apple", "banana"],
                },
            });

            const watchedValues = watch("checkboxGroup");

            const onSubmit = (data: { checkboxGroup: string[] }) => {
                alert(`제출된 값: ${JSON.stringify(data.checkboxGroup)}`);
                console.log("Form data:", data);
            };

            const options = [
                { label: "사과", value: "apple" },
                { label: "바나나", value: "banana" },
                { label: "오렌지", value: "orange" },
                { label: "포도", value: "grape" },
            ];

            return (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Controller
                        name="checkboxGroup"
                        control={control}
                        render={({ field: { value, onChange, ...restField } }) => (
                            <CheckBoxGroup
                                {...restField}
                                options={options}
                                allCheckHandler={options}
                                initialCheckedValues={value}
                                onChange={onChange}
                            />
                        )}
                    />

                    <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            제출
                        </button>
                        <button
                            type="button"
                            onClick={() => alert(`현재 선택: ${watchedValues?.join(", ") || "없음"}`)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            현재 값 확인
                        </button>
                    </div>

                    <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">실시간 선택 값:</p>
                        <p className="font-medium">{watchedValues?.length > 0 ? watchedValues.join(", ") : "없음"}</p>
                    </div>
                </form>
            );
        };

        return <Component />;
    },
};

// 사용 예제 모음
export const UsageExamples: Story = {
    render: () => (
        <div className="p-8 space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">1. 기본 체크박스 그룹</h3>
                <CheckBoxGroup
                    options={[
                        { label: "옵션 A", value: "a" },
                        { label: "옵션 B", value: "b" },
                        { label: "옵션 C", value: "c" },
                    ]}
                />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">2. 약관 동의</h3>
                <CheckBoxGroup
                    direction="vertical"
                    options={[
                        {
                            label: "서비스 이용약관 동의",
                            subText: "필수",
                            value: "terms",
                        },
                        {
                            label: "개인정보 처리방침 동의",
                            subText: "필수",
                            value: "privacy",
                        },
                        {
                            label: "마케팅 정보 수신 동의",
                            subText: "선택",
                            value: "marketing",
                        },
                    ]}
                    allCheckHandler={[
                        { label: "서비스 이용약관 동의", value: "terms" },
                        { label: "개인정보 처리방침 동의", value: "privacy" },
                        { label: "마케팅 정보 수신 동의", value: "marketing" },
                    ]}
                />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">3. 필터 옵션</h3>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium mb-2">카테고리</p>
                        <CheckBoxGroup
                            size="sm"
                            direction="horizontal"
                            options={[
                                { label: "전자제품", value: "electronics" },
                                { label: "의류", value: "clothing" },
                                { label: "식품", value: "food" },
                                { label: "도서", value: "books" },
                            ]}
                        />
                    </div>
                    <div>
                        <p className="text-sm font-medium mb-2">가격대</p>
                        <CheckBoxGroup
                            size="sm"
                            options={[
                                { label: "1만원 미만", value: "under10k" },
                                { label: "1-5만원", value: "10k-50k" },
                                { label: "5-10만원", value: "50k-100k" },
                                { label: "10만원 이상", value: "over100k" },
                            ]}
                        />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">4. 설문조사</h3>
                <div className="bg-gray-50 p-4 rounded">
                    <p className="font-medium mb-3">선호하는 프로그래밍 언어를 모두 선택해주세요</p>
                    <CheckBoxGroup
                        options={[
                            { label: "JavaScript", value: "js" },
                            { label: "TypeScript", value: "ts" },
                            { label: "Python", value: "python" },
                            { label: "Java", value: "java" },
                            { label: "Go", value: "go" },
                            { label: "Rust", value: "rust" },
                        ]}
                    />
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
