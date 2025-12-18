import type { Meta, StoryObj } from "@storybook/react";
import { BarChart } from "./BarChart";
import { DonutChart } from "./DonutChart";
import { LineChart } from "./LineChart";
import { AreaChart } from "./AreaChart";
import { RadarChart } from "./RadarChart";
import { MixedChart } from "./MixedChart";
import { getChartColors } from ".";

const meta: Meta = {
    title: "Chart/Chart",
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

// Sample data
const barChartData = [
    { item_label: "1월", sales: 4000, profit: 2400 },
    { item_label: "2월", sales: 3000, profit: 1398 },
    { item_label: "3월", sales: 2000, profit: 9800 },
    { item_label: "4월", sales: 2780, profit: 3908 },
    { item_label: "5월", sales: 1890, profit: 4800 },
    { item_label: "6월", sales: 2390, profit: 3800 },
];

const lineChartData = [
    { name: "Jan", desktop: 186, mobile: 80, tablet: 120 },
    { name: "Feb", desktop: 305, mobile: 200, tablet: 150 },
    { name: "Mar", desktop: 237, mobile: 120, tablet: 180 },
    { name: "Apr", desktop: 473, mobile: 190, tablet: 230 },
    { name: "May", desktop: 209, mobile: 130, tablet: 180 },
    { name: "Jun", desktop: 214, mobile: 140, tablet: 160 },
];

const radarData = [
    { subject: "Math", A: 120, B: 110, fullMark: 150 },
    { subject: "Chinese", A: 98, B: 130, fullMark: 150 },
    { subject: "English", A: 86, B: 130, fullMark: 150 },
    { subject: "Geography", A: 99, B: 100, fullMark: 150 },
    { subject: "Physics", A: 85, B: 90, fullMark: 150 },
    { subject: "History", A: 65, B: 85, fullMark: 150 },
];

const mixedChartData = [
    { name: "Jan", revenue: 4000, profit: 2400, growth: 20 },
    { name: "Feb", revenue: 3000, profit: 1398, growth: 30 },
    { name: "Mar", revenue: 2000, profit: 9800, growth: 25 },
    { name: "Apr", revenue: 2780, profit: 3908, growth: 40 },
    { name: "May", revenue: 1890, profit: 4800, growth: 35 },
    { name: "Jun", revenue: 2390, profit: 3800, growth: 45 },
];

const barChartDataWithDiff = [
    {
        item_label: "상품A",
        base_sales_count: 4000,
        comparison_sales_count: 3500,
        increase_decrease_number: 500,
        increase_decrease_rate: 14.3,
    },
    {
        item_label: "상품B",
        base_sales_count: 3000,
        comparison_sales_count: 3200,
        increase_decrease_number: -200,
        increase_decrease_rate: -6.25,
    },
    {
        item_label: "상품C",
        base_sales_count: 2000,
        comparison_sales_count: 1800,
        increase_decrease_number: 200,
        increase_decrease_rate: 11.1,
    },
    {
        item_label: "상품D",
        base_sales_count: 2780,
        comparison_sales_count: 2780,
        increase_decrease_number: 0,
        increase_decrease_rate: 0,
    },
];

const donutChartData = [
    { name: "직접 방문", value: 400, percent: 40, increase: 5 },
    { name: "이메일", value: 300, percent: 30, increase: -2 },
    { name: "광고", value: 200, percent: 20, increase: 10 },
    { name: "기타", value: 100, percent: 10, increase: 0 },
];

// Usage Examples Story
export const UsageExamples: StoryObj = {
    render: () => (
        <div className="p-8 space-y-12">
            <div>
                <h3 className="text-lg font-semibold mb-4">1. Bar Chart Examples</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">기본 Bar Chart</h4>
                        <div className="border rounded-lg p-4">
                            <BarChart chartData={barChartData} height={300} fill={getChartColors("modern")[0]} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">Grid가 있는 Bar Chart</h4>
                        <div className="border rounded-lg p-4">
                            <BarChart
                                chartData={barChartData}
                                height={300}
                                fill={getChartColors("modern")[1]}
                                hasGrid={true}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">Label과 Legend가 있는 Bar Chart</h4>
                        <div className="border rounded-lg p-4">
                            <BarChart
                                chartData={barChartData}
                                height={300}
                                fill={getChartColors("modern")[2]}
                                isLegend={true}
                                isLabelList={true}
                                LabelListFormatter={(value) => `${value.toLocaleString()}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">비교 Bar Chart</h4>
                        <div className="border rounded-lg p-4">
                            <BarChart
                                type="diff"
                                chartData={barChartDataWithDiff}
                                height={300}
                                diffSet={[
                                    { name: "기준일", dataKey: "base_sales_count", fill: getChartColors("modern")[0] },
                                    {
                                        name: "비교일",
                                        dataKey: "comparison_sales_count",
                                        fill: getChartColors("pastel")[0],
                                    },
                                ]}
                                isLegend={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">2. Donut Chart Examples</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">기본 Donut Chart</h4>
                        <div className="border rounded-lg p-4">
                            <DonutChart chartData={donutChartData} height={400} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">커스텀 색상 Donut Chart</h4>
                        <div className="border rounded-lg p-4">
                            <DonutChart chartData={donutChartData} height={400} colors={getChartColors("warm")} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">두께 조절 Donut Chart</h4>
                        <div className="border rounded-lg p-4">
                            <DonutChart chartData={donutChartData} height={400} innerRadius="30%" outerRadius="80%" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">로딩 상태</h4>
                        <div className="border rounded-lg p-4">
                            <DonutChart chartData={[]} height={400} loading={true} />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">3. Line Chart Examples</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">기본 Line Chart</h4>
                        <div className="border rounded-lg p-4">
                            <LineChart chartData={lineChartData} height={300} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">Area가 있는 Line Chart</h4>
                        <div className="border rounded-lg p-4">
                            <LineChart chartData={lineChartData} height={300} isArea={true} strokeWidth={3} />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">4. Area Chart Examples</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">기본 Area Chart</h4>
                        <div className="border rounded-lg p-4">
                            <AreaChart chartData={lineChartData} height={300} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">Stacked Area Chart</h4>
                        <div className="border rounded-lg p-4">
                            <AreaChart chartData={lineChartData} height={300} isStacked={true} isLegend={true} />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">5. Radar Chart Examples</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">기본 Radar Chart</h4>
                        <div className="border rounded-lg p-4">
                            <RadarChart chartData={radarData} dataKey="A" height={400} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">Multiple Radar Chart</h4>
                        <div className="border rounded-lg p-4">
                            <RadarChart
                                chartData={radarData}
                                height={400}
                                multiple={[
                                    { dataKey: "A", color: getChartColors("cool")[0], name: "Student A" },
                                    { dataKey: "B", color: getChartColors("cool")[1], name: "Student B" },
                                ]}
                                isLegend={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">6. Mixed Chart Example</h3>

                <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-600">Bar & Line 복합 차트</h4>
                        <div className="border rounded-lg p-4">
                            <MixedChart
                                chartData={mixedChartData}
                                bars={[
                                    { dataKey: "revenue", color: getChartColors("business")[0], name: "Revenue" },
                                    { dataKey: "profit", color: getChartColors("business")[1], name: "Profit" },
                                ]}
                                lines={[{ dataKey: "growth", color: getChartColors("business")[3], name: "Growth %" }]}
                                height={400}
                                isLegend={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4">7. Chart Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Tooltip</h4>
                        <p className="text-sm text-gray-600">차트 위에 마우스를 올리면 상세 정보를 표시합니다.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Legend</h4>
                        <p className="text-sm text-gray-600">데이터 범례를 표시하여 차트를 쉽게 이해할 수 있습니다.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Responsive</h4>
                        <p className="text-sm text-gray-600">컨테이너 크기에 맞춰 자동으로 크기가 조절됩니다.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Custom Colors</h4>
                        <p className="text-sm text-gray-600">차트 색상을 원하는대로 커스터마이징할 수 있습니다.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Loading State</h4>
                        <p className="text-sm text-gray-600">데이터 로딩 중에는 스켈레톤 UI를 표시합니다.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Grid Lines</h4>
                        <p className="text-sm text-gray-600">Bar Chart에서 그리드 라인을 표시할 수 있습니다.</p>
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

// Individual Stories
type BarChartStory = StoryObj<typeof BarChart>;

export const BasicBarChart: BarChartStory = {
    render: (args) => <BarChart {...args} />,
    args: {
        chartData: barChartData,
        height: 400,
        fill: getChartColors("modern")[0],
    },
};

export const BarChartWithGrid: BarChartStory = {
    render: (args) => <BarChart {...args} />,
    args: {
        chartData: barChartData,
        height: 400,
        fill: getChartColors("modern")[1],
        hasGrid: true,
    },
};

export const BarChartWithLabels: BarChartStory = {
    render: (args) => <BarChart {...args} />,
    args: {
        chartData: barChartData,
        height: 400,
        fill: getChartColors("modern")[2],
        isLabelList: true,
        LabelListFormatter: (value) => `${value.toLocaleString()}`,
    },
};

export const DiffBarChart: BarChartStory = {
    render: (args) => <BarChart {...args} />,
    args: {
        type: "diff",
        chartData: barChartDataWithDiff,
        height: 400,
        diffSet: [
            { name: "기준일", dataKey: "base_sales_count", fill: getChartColors("modern")[0] },
            { name: "비교일", dataKey: "comparison_sales_count", fill: getChartColors("pastel")[0] },
        ],
        isLegend: true,
    },
};

type DonutChartStory = StoryObj<typeof DonutChart>;

export const BasicDonutChart: DonutChartStory = {
    render: (args) => <DonutChart {...args} />,
    args: {
        chartData: donutChartData,
        height: 400,
    },
};

export const CustomColorDonutChart: DonutChartStory = {
    render: (args) => <DonutChart {...args} />,
    args: {
        chartData: donutChartData,
        height: 400,
        colors: getChartColors("warm"),
    },
};

export const ThickDonutChart: DonutChartStory = {
    render: (args) => <DonutChart {...args} />,
    args: {
        chartData: donutChartData,
        height: 400,
        innerRadius: "30%",
        outerRadius: "80%",
    },
};

// Line Chart Stories
type LineChartStory = StoryObj<typeof LineChart>;

export const BasicLineChart: LineChartStory = {
    render: (args) => <LineChart {...args} />,
    args: {
        chartData: lineChartData,
        height: 400,
    },
};

export const SmoothLineChart: LineChartStory = {
    render: (args) => <LineChart {...args} />,
    args: {
        chartData: lineChartData,
        height: 400,
        isSmooth: true,
        isArea: true,
        strokeWidth: 3,
    },
};

// Area Chart Stories
type AreaChartStory = StoryObj<typeof AreaChart>;

export const BasicAreaChart: AreaChartStory = {
    render: (args) => <AreaChart {...args} />,
    args: {
        chartData: lineChartData,
        height: 400,
    },
};

export const StackedAreaChart: AreaChartStory = {
    render: (args) => <AreaChart {...args} />,
    args: {
        chartData: lineChartData,
        height: 400,
        isStacked: true,
        isLegend: true,
    },
};

// Radar Chart Stories
type RadarChartStory = StoryObj<typeof RadarChart>;

export const BasicRadarChart: RadarChartStory = {
    render: (args) => <RadarChart {...args} />,
    args: {
        chartData: radarData,
        dataKey: "A",
        height: 400,
    },
};

export const MultipleRadarChart: RadarChartStory = {
    render: (args) => <RadarChart {...args} />,
    args: {
        chartData: radarData,
        height: 400,
        multiple: [
            { dataKey: "A", color: getChartColors("cool")[0], name: "Student A" },
            { dataKey: "B", color: getChartColors("cool")[1], name: "Student B" },
        ],
        isLegend: true,
    },
};

// Mixed Chart Story
type MixedChartStory = StoryObj<typeof MixedChart>;

export const BarLineMixedChart: MixedChartStory = {
    render: (args) => <MixedChart {...args} />,
    args: {
        chartData: mixedChartData,
        bars: [
            { dataKey: "revenue", color: getChartColors("business")[0], name: "Revenue" },
            { dataKey: "profit", color: getChartColors("business")[1], name: "Profit" },
        ],
        lines: [{ dataKey: "growth", color: getChartColors("business")[3], name: "Growth %" }],
        height: 400,
        isLegend: true,
    },
};
