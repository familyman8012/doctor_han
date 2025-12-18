import React from "react";
import { cn } from "@/components/utils";

export interface ColorItem {
    name: string;
    variable: string;
    value?: string;
}

interface ColorBoxProps {
    color: ColorItem;
    className?: string;
}

export const ColorBox: React.FC<ColorBoxProps> = ({ color, className }) => {
    const [hexValue, setHexValue] = React.useState<string>("");

    React.useEffect(() => {
        // Get computed CSS variable value
        const computedValue = getComputedStyle(document.documentElement).getPropertyValue(color.variable).trim();
        setHexValue(computedValue || color.value || "");
    }, [color.variable, color.value]);

    return (
        <div className={cn("flex flex-col rounded-lg shadow-md hover:shadow-lg transition-shadow", className)}>
            <div
                className="h-20 rounded-t-lg border border-b-0 border-gray-200"
                style={{ backgroundColor: color.value || `var(${color.variable})` }}
            />
            <div className="p-3 bg-white rounded-b-lg border border-t-0 border-gray-200">
                <h3 className="text-xs font-semibold text-[#0a3b41] mb-1">{color.name}</h3>
                <p className="text-xs text-[#5a6376] font-mono">{hexValue || color.value || ""}</p>
                <p className="text-[10px] text-gray-400 font-mono mt-1">{color.variable}</p>
            </div>
        </div>
    );
};

interface ColorGroupProps {
    title: string;
    colors: ColorItem[];
    columns?: number;
}

export const ColorGroup: React.FC<ColorGroupProps> = ({ title, colors, columns = 4 }) => {
    return (
        <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#0a3b41] mb-4">{title}</h2>
            <div
                className={cn(
                    "grid gap-4",
                    columns === 2 && "grid-cols-2",
                    columns === 3 && "grid-cols-3",
                    columns === 4 && "grid-cols-4",
                    columns === 5 && "grid-cols-5",
                    columns === 6 && "grid-cols-6",
                )}
            >
                {colors.map((color) => (
                    <ColorBox key={color.variable} color={color} />
                ))}
            </div>
        </div>
    );
};

// Color definitions from globals.css
export const colorGroups = {
    theme: [
        { name: "Primary Teal", variable: "--color-theme-primary", value: "#62e3d5" },
        { name: "Primary Dark", variable: "--color-theme-primary-dark", value: "#4dd4c5" },
        { name: "Primary Light", variable: "--color-theme-primary-light", value: "#7ceede" },
        { name: "Dark Text", variable: "--color-theme-text-dark", value: "#0a3b41" },
        { name: "Gray Text", variable: "--color-theme-text-gray", value: "#5a6376" },
        { name: "Light Gray", variable: "--color-theme-gray-light", value: "#94a3b8" },
        { name: "Border Gray", variable: "--color-theme-border", value: "#e5e7eb" },
        { name: "Background Light", variable: "--color-theme-bg-light", value: "#fafbfc" },
    ],
    gray: [
        { name: "Gray 0", variable: "--color-gray-0" },
        { name: "Gray 1", variable: "--color-gray-1" },
        { name: "Gray 2", variable: "--color-gray-2" },
        { name: "Gray 3", variable: "--color-gray-3" },
        { name: "Gray 4", variable: "--color-gray-4" },
        { name: "Gray 5", variable: "--color-gray-5" },
        { name: "Gray 6", variable: "--color-gray-6" },
        { name: "Gray 7", variable: "--color-gray-7" },
        { name: "Gray 8", variable: "--color-gray-8" },
        { name: "Gray 9", variable: "--color-gray-9" },
        { name: "Gray 10", variable: "--color-gray-10" },
        { name: "Gray 25", variable: "--color-gray-25" },
        { name: "Gray 50", variable: "--color-gray-50" },
        { name: "Gray 100", variable: "--color-gray-100" },
        { name: "Gray 200", variable: "--color-gray-200" },
        { name: "Gray 300", variable: "--color-gray-300" },
        { name: "Gray 400", variable: "--color-gray-400" },
        { name: "Gray 500", variable: "--color-gray-500" },
        { name: "Gray 600", variable: "--color-gray-600" },
        { name: "Gray 700", variable: "--color-gray-700" },
        { name: "Gray 800", variable: "--color-gray-800" },
        { name: "Gray 900", variable: "--color-gray-900" },
    ],
    neutral: [
        { name: "Neutral 10", variable: "--color-neutral-10" },
        { name: "Neutral 20", variable: "--color-neutral-20" },
        { name: "Neutral 30", variable: "--color-neutral-30" },
        { name: "Neutral 40", variable: "--color-neutral-40" },
        { name: "Neutral 50", variable: "--color-neutral-50" },
        { name: "Neutral 60", variable: "--color-neutral-60" },
        { name: "Neutral 70", variable: "--color-neutral-70" },
        { name: "Neutral 80", variable: "--color-neutral-80" },
        { name: "Neutral 90", variable: "--color-neutral-90" },
        { name: "Neutral 95", variable: "--color-neutral-95" },
    ],
    primary: [
        { name: "Primary 25", variable: "--color-primary-25" },
        { name: "Primary 50", variable: "--color-primary-50" },
        { name: "Primary 100", variable: "--color-primary-100" },
        { name: "Primary 200", variable: "--color-primary-200" },
        { name: "Primary 300", variable: "--color-primary-300" },
        { name: "Primary 400", variable: "--color-primary-400" },
        { name: "Primary 500", variable: "--color-primary-500" },
        { name: "Primary 600", variable: "--color-primary-600" },
        { name: "Primary 700", variable: "--color-primary-700" },
        { name: "Primary 800", variable: "--color-primary-800" },
        { name: "Primary 900", variable: "--color-primary-900" },
    ],
    blue: [
        { name: "Blue 50", variable: "--color-blue-50" },
        { name: "Blue 60", variable: "--color-blue-60" },
        { name: "Blue 70", variable: "--color-blue-70" },
        { name: "Blue 80", variable: "--color-blue-80" },
        { name: "Blue 85", variable: "--color-blue-85" },
        { name: "Blue 90", variable: "--color-blue-90" },
    ],
    orange: [
        { name: "Orange 10", variable: "--color-orange-10" },
        { name: "Orange 15", variable: "--color-orange-15" },
        { name: "Orange 30", variable: "--color-orange-30" },
        { name: "Orange 40", variable: "--color-orange-40" },
        { name: "Orange 45", variable: "--color-orange-45" },
        { name: "Orange 50", variable: "--color-orange-50" },
        { name: "Orange 60", variable: "--color-orange-60" },
        { name: "Orange 70", variable: "--color-orange-70" },
        { name: "Orange 80", variable: "--color-orange-80" },
        { name: "Orange 90", variable: "--color-orange-90" },
        { name: "Orange 95", variable: "--color-orange-95" },
    ],
    red: [
        { name: "Red 50", variable: "--color-red-50" },
        { name: "Red 60", variable: "--color-red-60" },
        { name: "Red 80", variable: "--color-red-80" },
        { name: "Red 90", variable: "--color-red-90" },
    ],
    error: [
        { name: "Error 25", variable: "--color-error-25" },
        { name: "Error 50", variable: "--color-error-50" },
        { name: "Error 100", variable: "--color-error-100" },
        { name: "Error 200", variable: "--color-error-200" },
        { name: "Error 300", variable: "--color-error-300" },
        { name: "Error 400", variable: "--color-error-400" },
        { name: "Error 500", variable: "--color-error-500" },
        { name: "Error 600", variable: "--color-error-600" },
        { name: "Error 700", variable: "--color-error-700" },
        { name: "Error 800", variable: "--color-error-800" },
        { name: "Error 900", variable: "--color-error-900" },
    ],
    warning: [
        { name: "Warning 25", variable: "--color-warning-25" },
        { name: "Warning 50", variable: "--color-warning-50" },
        { name: "Warning 100", variable: "--color-warning-100" },
        { name: "Warning 200", variable: "--color-warning-200" },
        { name: "Warning 300", variable: "--color-warning-300" },
        { name: "Warning 400", variable: "--color-warning-400" },
        { name: "Warning 500", variable: "--color-warning-500" },
        { name: "Warning 600", variable: "--color-warning-600" },
        { name: "Warning 700", variable: "--color-warning-700" },
        { name: "Warning 800", variable: "--color-warning-800" },
        { name: "Warning 900", variable: "--color-warning-900" },
    ],
    success: [
        { name: "Success 25", variable: "--color-success-25" },
        { name: "Success 50", variable: "--color-success-50" },
        { name: "Success 100", variable: "--color-success-100" },
        { name: "Success 200", variable: "--color-success-200" },
        { name: "Success 300", variable: "--color-success-300" },
        { name: "Success 400", variable: "--color-success-400" },
        { name: "Success 500", variable: "--color-success-500" },
        { name: "Success 600", variable: "--color-success-600" },
        { name: "Success 700", variable: "--color-success-700" },
        { name: "Success 800", variable: "--color-success-800" },
        { name: "Success 900", variable: "--color-success-900" },
    ],
    green: [
        { name: "Green 30", variable: "--color-green-30" },
        { name: "Green 50", variable: "--color-green-50" },
        { name: "Green 80", variable: "--color-green-80" },
        { name: "Green 90", variable: "--color-green-90" },
        { name: "Green 300", variable: "--color-green-300" },
        { name: "Green 400", variable: "--color-green-400" },
        { name: "Green 500", variable: "--color-green-500" },
    ],
    yellow: [
        { name: "Yellow 50", variable: "--color-yellow-50" },
        { name: "Yellow 60", variable: "--color-yellow-60" },
        { name: "Yellow 90", variable: "--color-yellow-90" },
    ],
    indigo: [
        { name: "Indigo 35", variable: "--color-indigo-35" },
        { name: "Indigo 45", variable: "--color-indigo-45" },
        { name: "Indigo 75", variable: "--color-indigo-75" },
        { name: "Indigo 90", variable: "--color-indigo-90" },
    ],
    badge: [
        { name: "Badge Green Label", variable: "--color-badge-green-label" },
        { name: "Badge Green Border", variable: "--color-badge-green-border" },
        { name: "Badge Green BG", variable: "--color-badge-green-bg" },
        { name: "Badge Yellow Label", variable: "--color-badge-yellow-label" },
        { name: "Badge Yellow Border", variable: "--color-badge-yellow-border" },
        { name: "Badge Yellow BG", variable: "--color-badge-yellow-bg" },
        { name: "Badge Indigo Label", variable: "--color-badge-indigo-label" },
        { name: "Badge Indigo Border", variable: "--color-badge-indigo-border" },
        { name: "Badge Indigo BG", variable: "--color-badge-indigo-bg" },
        { name: "Badge Purple Label", variable: "--color-badge-purple-label" },
        { name: "Badge Purple Border", variable: "--color-badge-purple-border" },
        { name: "Badge Purple BG", variable: "--color-badge-purple-bg" },
        { name: "Badge Blue Label", variable: "--color-badge-blue-label" },
        { name: "Badge Blue Border", variable: "--color-badge-blue-border" },
        { name: "Badge Blue BG", variable: "--color-badge-blue-bg" },
        { name: "Badge Red Label", variable: "--color-badge-red-label" },
        { name: "Badge Red Border", variable: "--color-badge-red-border" },
        { name: "Badge Red BG", variable: "--color-badge-red-bg" },
        { name: "Badge Gray Label", variable: "--color-badge-gray-label" },
        { name: "Badge Gray Border", variable: "--color-badge-gray-border" },
        { name: "Badge Gray BG", variable: "--color-badge-gray-bg" },
        { name: "Badge Orange Label", variable: "--color-badge-orange-label" },
        { name: "Badge Orange Border", variable: "--color-badge-orange-border" },
        { name: "Badge Orange BG", variable: "--color-badge-orange-bg" },
    ],
};
