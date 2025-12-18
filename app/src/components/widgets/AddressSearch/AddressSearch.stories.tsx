import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AddressSearch } from "./AddressSearch";

const meta: Meta<typeof AddressSearch> = {
    title: "Widgets/AddressSearch",
    component: AddressSearch,
    tags: ["autodocs"],
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
    args: {
        placeholder: "주소를 입력해주세요",
        disabled: false,
    },
    argTypes: {
        value: {
            control: "text",
            description: "입력된 주소 값",
        },
        disabled: {
            control: "boolean",
            description: "비활성화 상태",
        },
        placeholder: {
            control: "text",
            description: "플레이스홀더 텍스트",
        },
        onSearch: {
            action: "onSearch",
            description: "주소 검색 완료 시 호출되는 콜백",
        },
    },
};

export default meta;
type Story = StoryObj<typeof AddressSearch>;

// 기본 예제
export const Default: Story = {
    render: (args) => {
        const Component = () => {
            const [address, setAddress] = useState<string>("");

            return (
                <div className="space-y-4">
                    <AddressSearch {...args} value={address} onSearch={setAddress} />
                    {address && (
                        <div className="p-3 bg-gray-50 rounded">
                            <p className="text-sm text-gray-600">선택된 주소:</p>
                            <p className="font-medium">{address}</p>
                        </div>
                    )}
                </div>
            );
        };
        return <Component />;
    },
};

// React Hook Form 연동 예제
export const WithReactHookForm: Story = {
    render: (args) => {
        const Component = () => {
            const { register, watch, setValue } = useForm<{ address: string }>({
                defaultValues: {
                    address: "",
                },
            });

            const handleSearch = (address: string) => {
                setValue("address", address);
            };

            return (
                <div className="space-y-4">
                    <AddressSearch {...register("address")} {...args} onSearch={handleSearch} />
                    <div className="p-3 bg-blue-50 rounded">
                        <p className="text-sm text-blue-600">React Hook Form Value:</p>
                        <p className="font-medium">{watch("address") || "아직 선택된 주소가 없습니다"}</p>
                    </div>
                </div>
            );
        };
        return <Component />;
    },
};

// 비활성화 상태
export const Disabled: Story = {
    args: {
        disabled: true,
        value: "서울특별시 강남구 역삼동 123-45",
    },
};

// 사용 예제 모음
export const UsageExamples: Story = {
    render: () => (
        <div className="p-8 space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">1. 기본 사용법</h3>
                <div className="bg-gray-50 p-4 rounded">
                    <AddressSearch placeholder="클릭하여 주소를 검색하세요" />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">2. 초기값이 있는 경우</h3>
                <div className="bg-gray-50 p-4 rounded">
                    <AddressSearch value="서울특별시 서초구 서초동 1234-5" />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">3. 폼 내에서 사용</h3>
                <form className="bg-gray-50 p-4 rounded space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">배송지 주소</label>
                        <AddressSearch placeholder="배송받으실 주소를 입력해주세요" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">상세 주소</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            placeholder="상세 주소를 입력해주세요"
                        />
                    </div>
                </form>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">4. 여러 주소 입력</h3>
                <div className="bg-gray-50 p-4 rounded space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">출발지</label>
                        <AddressSearch placeholder="출발지 주소 검색" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">도착지</label>
                        <AddressSearch placeholder="도착지 주소 검색" />
                    </div>
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
