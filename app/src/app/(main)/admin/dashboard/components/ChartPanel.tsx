"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import type { PieLabelRenderProps } from "recharts";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import type { TimeSeriesPoint } from "@/lib/schema/analytics";

// Dynamic imports for recharts to avoid SSR issues and optimize bundle
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false });

interface ChartPanelProps {
    title: string;
    subtitle?: string;
    isLoading?: boolean;
    children?: ReactNode;
}

export default function ChartPanel({ title, subtitle, isLoading, children }: ChartPanelProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#0a3b41]">{title}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            {isLoading ? (
                <div className="flex items-center justify-center h-[240px]">
                    <Spinner size="md" />
                </div>
            ) : (
                <div className="h-[240px]">{children}</div>
            )}
        </div>
    );
}

// ============================================
// Pre-built Chart Variants
// ============================================

const COLORS = ["#0a3b41", "#62e3d5", "#f59e0b", "#8b5cf6", "#ef4444", "#3b82f6"];

interface LineChartViewProps {
    data: TimeSeriesPoint[];
    color?: string;
    label?: string;
}

export function LineChartView({ data, color = "#62e3d5", label = "값" }: LineChartViewProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={50} />
                <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    labelStyle={{ fontWeight: 600 }}
                />
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name={label}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

interface MultiLineChartViewProps {
    data: Record<string, unknown>[];
    lines: { dataKey: string; color: string; name: string }[];
}

export function MultiLineChartView({ data, lines }: MultiLineChartViewProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={50} />
                <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    labelStyle={{ fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {lines.map((line) => (
                    <Line
                        key={line.dataKey}
                        type="monotone"
                        dataKey={line.dataKey}
                        stroke={line.color}
                        strokeWidth={2}
                        dot={false}
                        name={line.name}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}

interface BarChartViewProps {
    data: TimeSeriesPoint[];
    color?: string;
    label?: string;
}

export function BarChartView({ data, color = "#62e3d5", label = "값" }: BarChartViewProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={50} />
                <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} name={label} />
            </BarChart>
        </ResponsiveContainer>
    );
}

interface PieChartViewProps {
    data: { name: string; value: number }[];
}

export function PieChartView({ data }: PieChartViewProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: PieLabelRenderProps) =>
                        `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    formatter={(value) => Number(value ?? 0).toLocaleString()}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
