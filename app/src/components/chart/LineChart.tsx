"use client";

import React from "react";
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { BasicTooltip } from "./BasicTooltip";
import { cn } from "@/components/utils";
import { getChartColors } from "./chartTheme";

export interface LineChartProps {
    chartData: Record<string, unknown>[];
    lines?: { dataKey: string; color: string; name?: string; strokeWidth?: number }[];
    height?: string | number;
    xKey?: string;
    hasGrid?: boolean;
    isSmooth?: boolean;
    isDot?: boolean;
    isArea?: boolean;
    isLegend?: boolean;
    className?: string;
    loading?: boolean;
    strokeWidth?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
    chartData,
    lines,
    height = "400px",
    xKey = "name",
    hasGrid = true,
    isSmooth = true,
    isDot = true,
    isArea = false,
    isLegend = false,
    className,
    loading = false,
    strokeWidth = 2,
}) => {
    // Auto-detect data keys if lines not provided
    const colors = getChartColors("modern");
    const dataKeys =
        lines ||
        (chartData?.length > 0
            ? Object.keys(chartData[0])
                  .filter((key) => key !== xKey && typeof chartData[0][key] === "number")
                  .map((key, index) => ({
                      dataKey: key,
                      color: colors[index % colors.length],
                      name: key,
                      strokeWidth: strokeWidth,
                  }))
            : []);

    // Temporary debug logging
    if (typeof window !== "undefined" && chartData?.length > 0) {
        console.log("LineChart Debug:", {
            chartData: chartData,
            dataKeys: dataKeys,
            xKey: xKey,
            firstDataItem: chartData[0],
            detectedKeys: Object.keys(chartData[0]).filter(
                (key) => key !== xKey && typeof chartData[0][key] === "number",
            ),
        });
    }

    if (loading || !chartData?.length) {
        return (
            <div
                className={cn("bg-gray-100 animate-pulse rounded-lg", className)}
                style={{ height: typeof height === "number" ? `${height}px` : height }}
            />
        );
    }

    // Ensure we have dataKeys
    if (!dataKeys || dataKeys.length === 0) {
        console.warn("LineChart: No dataKeys found. Check your data structure or provide explicit lines prop.");
        return (
            <div className={cn("w-full text-center text-gray-500 p-8", className)}>
                No data keys found to render lines
            </div>
        );
    }

    return (
        <div
            className={cn("w-full", className)}
            style={{ height: typeof height === "number" ? `${height}px` : height }}
        >
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        {dataKeys.map((line, index) => (
                            <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={line.color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={line.color} stopOpacity={0} />
                            </linearGradient>
                        ))}
                    </defs>
                    {hasGrid && (
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} vertical={false} />
                    )}
                    <XAxis
                        dataKey={xKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 12 }}
                        dx={-10}
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
                    {isLegend && <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />}
                    {dataKeys.map((line, index) => (
                        <React.Fragment key={`line-${index}`}>
                            {isArea && (
                                <Area
                                    type={isSmooth ? "monotone" : "linear"}
                                    dataKey={line.dataKey}
                                    stroke="none"
                                    fill={`url(#gradient-${index})`}
                                />
                            )}
                            <Line
                                type={isSmooth ? "monotone" : "linear"}
                                dataKey={line.dataKey}
                                stroke={line.color}
                                strokeWidth={line.strokeWidth || strokeWidth}
                                name={line.name}
                                dot={isDot ? { fill: line.color, strokeWidth: 2, r: 4 } : false}
                                activeDot={{ r: 6 }}
                            />
                        </React.Fragment>
                    ))}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
