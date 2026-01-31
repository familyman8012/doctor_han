"use client";

import type React from "react";
import {
    ResponsiveContainer,
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { BasicTooltip } from "./BasicTooltip";
import { cn } from "@/components/utils";
import { getChartColors } from "./chartTheme";

export interface AreaChartProps {
    chartData: Record<string, unknown>[];
    areas?: { dataKey: string; color: string; name?: string }[];
    height?: string | number;
    xKey?: string;
    hasGrid?: boolean;
    isStacked?: boolean;
    isLegend?: boolean;
    className?: string;
    loading?: boolean;
    gradientOpacity?: [number, number];
}

export const AreaChart: React.FC<AreaChartProps> = ({
    chartData,
    areas,
    height = "400px",
    xKey = "name",
    hasGrid = true,
    isStacked = false,
    isLegend = false,
    className,
    loading = false,
    gradientOpacity = [0.8, 0.1],
}) => {
    // Auto-detect data keys if areas not provided
    const colors = getChartColors("modern");
    const dataKeys =
        areas ||
        (chartData?.length > 0
            ? Object.keys(chartData[0])
                  .filter((key) => key !== xKey && typeof chartData[0][key] === "number")
                  .map((key, index) => ({
                      dataKey: key,
                      color: colors[index % colors.length],
                      name: key,
                  }))
            : []);

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
                <RechartsAreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        {dataKeys.map((area, index) => (
                            <linearGradient key={index} id={`colorGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={area.color} stopOpacity={gradientOpacity[0]} />
                                <stop offset="95%" stopColor={area.color} stopOpacity={gradientOpacity[1]} />
                            </linearGradient>
                        ))}
                    </defs>
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
                    {isLegend && <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="rect" />}
                    {dataKeys.map((area, index) => (
                        <Area
                            key={index}
                            type="monotone"
                            dataKey={area.dataKey}
                            stackId={isStacked ? "1" : undefined}
                            stroke={area.color}
                            strokeWidth={2}
                            fill={`url(#colorGradient-${index})`}
                            name={area.name}
                        />
                    ))}
                </RechartsAreaChart>
            </ResponsiveContainer>
        </div>
    );
};
