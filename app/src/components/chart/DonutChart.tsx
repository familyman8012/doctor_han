"use client";

import type React from "react";
import { ResponsiveContainer, PieChart, Pie, Legend, Tooltip, Cell } from "recharts";
import type { PieLabelRenderProps } from "recharts/types/polar/Pie";
import { BasicTooltip } from "./BasicTooltip";
import { DonutBasicLegend } from "./DonutBasicLegend";
import { cn } from "@/components/utils";
import { getChartColors } from "./chartTheme";

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
}: PieLabelRenderProps): React.ReactNode => {
    if (
        typeof cx !== "number" ||
        typeof cy !== "number" ||
        typeof midAngle !== "number" ||
        typeof innerRadius !== "number" ||
        typeof outerRadius !== "number" ||
        typeof percent !== "number"
    ) {
        return null;
    }

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-sm font-medium">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts Legend/Tooltip content props have complex types
type LegendContent = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts Legend/Tooltip content props have complex types
type TooltipContent = any;

export interface DonutChartProps {
    chartData: Record<string, unknown>[];
    height?: string | number;
    legend?: LegendContent;
    toolTip?: TooltipContent;
    colors?: string[];
    dataKey?: string;
    className?: string;
    loading?: boolean;
    innerRadius?: string | number;
    outerRadius?: string | number;
}

const DEFAULT_COLORS = getChartColors("modern");

export const DonutChart: React.FC<DonutChartProps> = ({
    chartData,
    height = "400px",
    legend = <DonutBasicLegend />,
    toolTip = <BasicTooltip />,
    colors = DEFAULT_COLORS,
    dataKey = "value",
    className,
    loading = false,
    innerRadius = "50%",
    outerRadius = "70%",
}) => {
    if (loading || !chartData) {
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
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey={dataKey}
                    >
                        {chartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Legend
                        layout="vertical"
                        verticalAlign="bottom"
                        align="center"
                        content={legend}
                        wrapperStyle={{ width: "100%" }}
                    />
                    <Tooltip content={toolTip} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
