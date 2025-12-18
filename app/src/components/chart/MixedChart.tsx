"use client";

import type React from "react";
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { BasicTooltip } from "./BasicTooltip";
import { cn } from "@/components/utils";

export interface MixedChartProps {
    chartData: any[];
    bars?: { dataKey: string; color: string; name?: string }[];
    lines?: { dataKey: string; color: string; name?: string }[];
    height?: string | number;
    xKey?: string;
    hasGrid?: boolean;
    isLegend?: boolean;
    className?: string;
    loading?: boolean;
    barSize?: number;
}

export const MixedChart: React.FC<MixedChartProps> = ({
    chartData,
    bars = [],
    lines = [],
    height = "400px",
    xKey = "name",
    hasGrid = true,
    isLegend = true,
    className,
    loading = false,
    barSize = 20,
}) => {
    if (loading || !chartData?.length) {
        return (
            <div
                className={cn("bg-gray-100 animate-pulse rounded-lg", className)}
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
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    {hasGrid && (
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.3} vertical={false} />
                    )}
                    <XAxis
                        dataKey={xKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                        dx={-10}
                        tickFormatter={(value) => value.toLocaleString()}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                        dx={10}
                        tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip
                        content={<BasicTooltip />}
                        contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                    />
                    {isLegend && <Legend wrapperStyle={{ paddingTop: "20px" }} />}
                    {bars.map((bar, index) => (
                        <Bar
                            key={`bar-${index}`}
                            yAxisId="left"
                            dataKey={bar.dataKey}
                            fill={bar.color}
                            name={bar.name}
                            barSize={barSize}
                        />
                    ))}
                    {lines.map((line, index) => (
                        <Line
                            key={`line-${index}`}
                            yAxisId="right"
                            type="monotone"
                            dataKey={line.dataKey}
                            stroke={line.color}
                            strokeWidth={2}
                            name={line.name}
                            dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
                        />
                    ))}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
