import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import DateRangePicker, { type DateRangeType } from "./DateRange";

const meta: Meta<typeof DateRangePicker> = {
    title: "Widgets/DateRange",
    component: DateRangePicker,
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

type Story = StoryObj<typeof DateRangePicker>;

export const Default: Story = {
    render: () => (
        <DateRangePicker
            onDateRangeChange={(range) => console.log("Date range changed:", range)}
            placeholder="날짜 범위를 선택하세요"
        />
    ),
};

// useState 예제
export const WithUseState: Story = {
    render: () => {
        const UseStateExample = () => {
            const [dateRange, setDateRange] = useState<DateRangeType>([null, null]);
            const [key, setKey] = useState(0); // 컴포넌트 리렌더링을 위한 key

            const handleDateRangeChange = (range: DateRangeType) => {
                setDateRange(range);
                console.log("날짜 범위 변경:", range);
            };

            return (
                <div className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold">useState 예제</h3>

                    <DateRangePicker
                        key={key}
                        onDateRangeChange={handleDateRangeChange}
                        initialDateRange={dateRange}
                        placeholder="날짜 범위를 선택하세요"
                    />

                    <div className="text-sm space-y-2">
                        <div>
                            <strong>시작일:</strong>{" "}
                            {dateRange[0] ? new Date(dateRange[0]).toLocaleDateString("ko-KR") : "선택되지 않음"}
                        </div>
                        <div>
                            <strong>종료일:</strong>{" "}
                            {dateRange[1] ? new Date(dateRange[1]).toLocaleDateString("ko-KR") : "선택되지 않음"}
                        </div>
                    </div>

                    <div className="space-x-2">
                        <button
                            type="button"
                            onClick={() => {
                                const today = new Date();
                                const weekAgo = new Date();
                                weekAgo.setDate(today.getDate() - 7);
                                setDateRange([weekAgo, today]);
                                setKey((prev) => prev + 1); // 컴포넌트 리렌더링
                            }}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            최근 7일로 설정
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const today = new Date();
                                const monthAgo = new Date();
                                monthAgo.setDate(today.getDate() - 30);
                                setDateRange([monthAgo, today]);
                                setKey((prev) => prev + 1); // 컴포넌트 리렌더링
                            }}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            최근 30일로 설정
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDateRange([null, null]);
                                setKey((prev) => prev + 1); // 컴포넌트 리렌더링
                            }}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            초기화
                        </button>
                    </div>
                </div>
            );
        };

        return <UseStateExample />;
    },
};

// react-hook-form 예제
interface FormData {
    vacationPeriod: DateRangeType;
    businessTripPeriod: DateRangeType;
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
                    vacationPeriod: [null, null],
                    businessTripPeriod: [null, null],
                },
            });

            const watchedValues = watch();

            const onSubmit = (data: FormData) => {
                const formatDate = (date: Date | null) => (date ? new Date(date).toLocaleDateString("ko-KR") : "없음");

                alert(
                    `제출된 데이터:\n\n` +
                        `휴가 기간: ${formatDate(data.vacationPeriod[0])} ~ ${formatDate(data.vacationPeriod[1])}\n` +
                        `출장 기간: ${formatDate(data.businessTripPeriod[0])} ~ ${formatDate(data.businessTripPeriod[1])}`,
                );
                console.log("Form data:", data);
            };

            return (
                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold">react-hook-form 예제</h3>

                    <div>
                        <label className="block text-sm font-medium mb-1">휴가 기간 *</label>
                        <Controller
                            name="vacationPeriod"
                            control={control}
                            rules={{
                                validate: (value) => {
                                    if (!value[0] || !value[1]) {
                                        return "휴가 기간을 선택해주세요";
                                    }
                                    return true;
                                },
                            }}
                            render={({ field }) => (
                                <DateRangePicker
                                    onDateRangeChange={(range) => field.onChange(range)}
                                    initialDateRange={field.value}
                                    placeholder="휴가 기간 선택"
                                />
                            )}
                        />
                        {errors.vacationPeriod && (
                            <p className="text-red-500 text-sm mt-1">{errors.vacationPeriod.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">출장 기간</label>
                        <Controller
                            name="businessTripPeriod"
                            control={control}
                            render={({ field }) => (
                                <DateRangePicker
                                    onDateRangeChange={(range) => field.onChange(range)}
                                    initialDateRange={field.value}
                                    exceptDateRange={watchedValues.vacationPeriod}
                                    placeholder="출장 기간 선택 (휴가 기간 제외)"
                                />
                            )}
                        />
                        <p className="text-gray-500 text-xs mt-1">휴가 기간과 겹치지 않는 날짜만 선택 가능합니다.</p>
                    </div>

                    <div className="text-sm bg-gray-100 p-3 rounded">
                        <strong>현재 폼 값:</strong>
                        <pre className="mt-2 text-xs">
                            {JSON.stringify(
                                watchedValues,
                                (_key, v) => {
                                    if (v instanceof Date) {
                                        return v.toISOString().split("T")[0];
                                    }
                                    return v;
                                },
                                2,
                            )}
                        </pre>
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
                            onClick={() => {
                                const today = new Date();
                                const nextWeek = new Date();
                                nextWeek.setDate(today.getDate() + 7);
                                const nextMonth = new Date();
                                nextMonth.setDate(today.getDate() + 14);
                                const monthEnd = new Date();
                                monthEnd.setDate(today.getDate() + 21);

                                reset({
                                    vacationPeriod: [today, nextWeek],
                                    businessTripPeriod: [nextMonth, monthEnd],
                                });
                            }}
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

// 고급 기능 데모
export const AdvancedFeatures: Story = {
    render: () => {
        const AdvancedExample = () => {
            const [dateRange, setDateRange] = useState<DateRangeType>([null, null]);
            const [maxDate] = useState(new Date()); // 오늘까지만 선택 가능

            return (
                <div className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold">고급 기능 데모</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                과거 날짜만 선택 가능 (maxDate 설정)
                            </label>
                            <DateRangePicker
                                onDateRangeChange={setDateRange}
                                initialDateRange={dateRange}
                                placeholder="과거 날짜 범위 선택"
                                maxDate={maxDate}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">비활성화된 DateRange</label>
                            <DateRangePicker
                                onDateRangeChange={() => {}}
                                initialDateRange={[new Date("2024-01-01"), new Date("2024-01-15")]}
                                placeholder="비활성화됨"
                                disabled={true}
                            />
                        </div>
                    </div>

                    <div className="text-sm bg-blue-50 p-3 rounded">
                        <strong>선택된 범위:</strong>{" "}
                        {dateRange[0] && dateRange[1]
                            ? `${new Date(dateRange[0]).toLocaleDateString("ko-KR")} ~ ${new Date(dateRange[1]).toLocaleDateString("ko-KR")}`
                            : "없음"}
                    </div>
                </div>
            );
        };

        return <AdvancedExample />;
    },
};
