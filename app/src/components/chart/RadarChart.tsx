"use client";

import type React from "react";
import {
    ResponsiveContainer,
    RadarChart as RechartsRadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend,
    Tooltip,
} from "recharts";
import { cn } from "@/components/utils";

export interface RadarChartProps {
    chartData: Record<string, unknown>[];
    dataKey?: string;
    height?: string | number;
    fill?: string;
    stroke?: string;
    isLegend?: boolean;
    className?: string;
    loading?: boolean;
    opacity?: number;
    multiple?: { dataKey: string; color: string; name?: string }[];
}

export const RadarChart: React.FC<RadarChartProps> = ({
    chartData,
    dataKey = "value",
    height = "400px",
    fill = "#6366F1",
    stroke = "#4F46E5",
    isLegend = false,
    className,
    loading = false,
    opacity = 0.5,
    multiple,
}) => {
    if (loading || !chartData?.length) {
        return (
            <div
                className={cn("bg-gray-100 animate-pulse rounded-lg", className)}
                style={{ height: typeof height === "number" ? `${height}px` : height }}
            />
        );
    }

    const radarDataKeys = multiple || [{ dataKey, color: fill, name: dataKey }];

    return (
        <div
            className={cn("w-full", className)}
            style={{ height: typeof height === "number" ? `${height}px` : height }}
        >
            <ResponsiveContainer width="100%" height="100%">
                <RechartsRadarChart data={chartData}>
                    <PolarGrid stroke="#E5E7EB" strokeWidth={1} strokeOpacity={0.5} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#6B7280", fontSize: 12 }} className="text-xs" />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, "dataMax"]}
                        tick={{ fill: "#6B7280", fontSize: 10 }}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                    />
                    {isLegend && <Legend wrapperStyle={{ paddingTop: "20px" }} />}
                    {radarDataKeys.map((radar, index) => (
                        <Radar
                            key={index}
                            name={radar.name}
                            dataKey={radar.dataKey}
                            stroke={multiple ? radar.color : stroke}
                            fill={radar.color}
                            fillOpacity={opacity}
                            strokeWidth={2}
                        />
                    ))}
                </RechartsRadarChart>
            </ResponsiveContainer>
        </div>
    );
};
