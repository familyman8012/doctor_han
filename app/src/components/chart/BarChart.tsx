"use client";

import type React from "react";
import { useCallback } from "react";
import {
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LabelList,
    Legend,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { ContentType } from "recharts/types/component/Tooltip";
import { BasicTooltip } from "./BasicTooltip";
import { cn } from "@/components/utils";

const LegendFormatter = ({ value }: { value: string }) => {
    return <span className="text-[#5a6376]">{value}</span>;
};

export interface BarChartProps {
    type?: string;
    height?: string | number;
    chartData: Record<string, unknown>[];
    barSize?: number;
    tickCount?: number;
    xKey?: string;
    xTickFormatter?: (value: string) => string;
    toolTip?: ContentType<ValueType, NameType>;
    fill?: string;
    hasGrid?: boolean;
    isTooltip?: boolean;
    isLegend?: boolean;
    diffSet?: { name: string; dataKey: string; fill: string }[];
    isLabelList?: boolean;
    LabelListFormatter?: (value: string | number | boolean | null | undefined) => string;
    angle?: number;
    className?: string;
    loading?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
    type,
    height = "400px",
    chartData,
    barSize = 16, // 컴팩트한 바 크기
    tickCount,
    xKey = "item_label",
    xTickFormatter,
    toolTip = <BasicTooltip />,
    fill = "#62e3d5", // Primary teal
    hasGrid = false,
    isTooltip = true,
    isLegend,
    diffSet,
    isLabelList,
    LabelListFormatter,
    angle,
    className,
    loading = false,
}) => {
    const chartDataName = chartData?.length > 0 ? Object.keys(chartData[0]) : null;

    const formatter = useCallback((value: string) => <LegendFormatter value={value} />, []);

    if (loading || !chartDataName) {
        return (
            <div
                className={cn("bg-gray-100 animate-pulse rounded", className)}
                style={{ height: typeof height === "number" ? `${height}px` : height }}
            />
        );
    }

    return (
        <div
            className={cn("w-full", className)}
            style={{ height: typeof height === "number" ? `${height}px` : height }}
        >
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                    data={chartData}
                    barSize={barSize}
                    margin={{
                        top: 15,
                        bottom: 15,
                        left: 15,
                        right: 15,
                    }}
                >
                    <CartesianGrid strokeDasharray="2 0" vertical={hasGrid} stroke="#E5E5E5" />
                    <XAxis
                        dataKey={xKey}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tickFormatter={xTickFormatter}
                        angle={angle}
                        textAnchor={angle ? "end" : "middle"}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                    />
                    <YAxis
                        tickCount={tickCount}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tickFormatter={(value: number) => value.toLocaleString()}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                    />
                    {isTooltip && <Tooltip content={toolTip} />}
                    {isLegend && (
                        <Legend
                            iconType="circle"
                            iconSize={12}
                            formatter={formatter}
                            wrapperStyle={{ paddingTop: angle ? "80px" : "32px" }}
                        />
                    )}
                    {type === "diff" && diffSet ? (
                        <>
                            <Bar name={diffSet[0].name} dataKey={diffSet[0].dataKey} fill={diffSet[0].fill} />
                            <Bar name={diffSet[1].name} dataKey={diffSet[1].dataKey} fill={diffSet[1].fill} />
                        </>
                    ) : (
                        <Bar dataKey={chartDataName[1]} fill={fill}>
                            {isLabelList && (
                                <LabelList dataKey={chartDataName[1]} position="top" formatter={LabelListFormatter} />
                            )}
                        </Bar>
                    )}
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
};
