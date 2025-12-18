import type { Meta, StoryObj } from "@storybook/react";
import { useState, forwardRef } from "react";
import { useForm, Controller } from "react-hook-form";
import MyDatePicker from "./DatePicker";
import { Input } from "@/components/ui/Input/Input";
import { Calendar } from "lucide-react";

const meta: Meta<typeof MyDatePicker> = {
    title: "Widgets/DatePicker",
    component: MyDatePicker,
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

type Story = StoryObj<typeof MyDatePicker>;

export const Default: Story = {
    render: () => {
        const DefaultExample = () => {
            const [date, setDate] = useState<string | null>(null);

            return (
                <div className="p-8">
                    <div className="max-w-xs">
                        <MyDatePicker
                            selectedDate={date}
                            onChange={(newDate) => setDate(newDate)}
                            placeholderText="날짜를 선택하세요"
                        />
                    </div>
                </div>
            );
        };

        return <DefaultExample />;
    },
};

// useState 예제
export const WithUseState: Story = {
    render: () => {
        const UseStateExample = () => {
            const [date, setDate] = useState<string | null>(null);

            return (
                <div className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold">useState 예제</h3>
                    <MyDatePicker
                        selectedDate={date}
                        onChange={(newDate) => setDate(newDate)}
                        placeholderText="날짜를 선택하세요"
                    />
                    <div className="text-sm">
                        <strong>선택된 날짜:</strong> {date || "없음"}
                    </div>
                    <button
                        type="button"
                        onClick={() => setDate("2024-01-01")}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        2024-01-01로 설정
                    </button>
                    <button
                        type="button"
                        onClick={() => setDate(null)}
                        className="ml-2 px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        초기화
                    </button>
                </div>
            );
        };

        return <UseStateExample />;
    },
};

// react-hook-form 예제
interface FormData {
    startDate: string | null;
    endDate: string | null;
}

export const WithReactHookForm: Story = {
    render: () => {
        const ReactHookFormExample = () => {
            const {
                control,
                handleSubmit,
                reset,
                watch,
                formState: { errors },
            } = useForm<FormData>({
                defaultValues: {
                    startDate: null,
                    endDate: null,
                },
            });

            const watchedValues = watch();

            const onSubmit = (data: FormData) => {
                alert(`제출된 데이터:\n시작일: ${data.startDate}\n종료일: ${data.endDate}`);
                console.log("Form data:", data);
            };

            return (
                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold">react-hook-form 예제</h3>

                    <div>
                        <label className="block text-sm font-medium mb-1">시작일 *</label>
                        <Controller
                            name="startDate"
                            control={control}
                            rules={{ required: "시작일을 선택해주세요" }}
                            render={({ field }) => (
                                <MyDatePicker
                                    selectedDate={field.value}
                                    onChange={(date) => field.onChange(date)}
                                    placeholderText="시작일 선택"
                                />
                            )}
                        />
                        {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">종료일</label>
                        <Controller
                            name="endDate"
                            control={control}
                            render={({ field }) => (
                                <MyDatePicker
                                    selectedDate={field.value}
                                    onChange={(date) => field.onChange(date)}
                                    placeholderText="종료일 선택"
                                    minDate={watchedValues.startDate ? new Date(watchedValues.startDate) : null}
                                />
                            )}
                        />
                    </div>

                    <div className="text-sm bg-gray-100 p-2 rounded">
                        <strong>현재 폼 값:</strong>
                        <pre>{JSON.stringify(watchedValues, null, 2)}</pre>
                    </div>

                    <div className="space-x-2">
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            제출
                        </button>
                        <button
                            type="button"
                            onClick={() => reset()}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            초기화
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                reset({
                                    startDate: "2024-01-01",
                                    endDate: "2024-12-31",
                                })
                            }
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            예제 데이터 설정
                        </button>
                    </div>
                </form>
            );
        };

        return <ReactHookFormExample />;
    },
};

// customInput 예제 - 커스텀 Input 사용
export const WithCustomDateInput: Story = {
    render: () => {
        const CustomDateInputExample = () => {
            const [selectedDate, setSelectedDate] = useState<string | null>(null);

            // Custom Input component
            const CustomDateInput = forwardRef<HTMLInputElement, any>((props, ref) => {
                const { value, onClick, placeholder, disabled } = props;

                // value를 포맷팅하여 표시
                const displayValue = value ? new Date(value).toLocaleDateString("ko-KR") : "";

                return (
                    <Input
                        ref={ref}
                        type="text"
                        value={displayValue}
                        onClick={onClick}
                        placeholder={placeholder}
                        disabled={disabled}
                        size="xs"
                        className="w-auto"
                        readOnly
                        TrailingIcon={<Calendar className="w-4 h-4" />}
                    />
                );
            });

            CustomDateInput.displayName = "CustomDateInput";

            return (
                <div className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold">Custom Input 예제</h3>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">날짜 선택 (커스텀 Input 사용)</label>
                        <MyDatePicker
                            selectedDate={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            customInput={<CustomDateInput />}
                            placeholderText="날짜를 선택하세요"
                        />
                    </div>
                    <div className="text-sm bg-gray-100 p-2 rounded">
                        <strong>선택된 날짜:</strong> {selectedDate || "없음"}
                    </div>
                </div>
            );
        };

        return <CustomDateInputExample />;
    },
};
