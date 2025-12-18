// Modern Chart Color Palettes
export const chartColors = {
    // 부드럽고 현대적인 메인 팔레트
    modern: [
        "#62e3d5", // Primary teal
        "#4dd4c5", // Primary teal dark
        "#7CEEDE", // Light teal
        "#0a3b41", // Dark text
        "#5a6376", // Gray text
        "#94a3b8", // Light gray
    ],

    // 파스텔 톤 (부드러운 느낌)
    pastel: [
        "#A5B4FC", // Indigo 300
        "#C4B5FD", // Violet 300
        "#F9A8D4", // Pink 300
        "#5EEAD4", // Teal 300
        "#FCD34D", // Amber 300
        "#BEF264", // Lime 300
    ],

    // 깊고 진한 색상
    deep: [
        "#4F46E5", // Indigo 600
        "#7C3AED", // Violet 600
        "#DB2777", // Pink 600
        "#0D9488", // Teal 600
        "#D97706", // Amber 600
        "#65A30D", // Lime 600
    ],

    // 모노톤 (회색 계열)
    mono: [
        "#1F2937", // Gray 800
        "#374151", // Gray 700
        "#4B5563", // Gray 600
        "#6B7280", // Gray 500
        "#9CA3AF", // Gray 400
        "#D1D5DB", // Gray 300
    ],

    // 블루 그라디언트
    blueGradient: [
        "#1E3A8A", // Blue 900
        "#1E40AF", // Blue 800
        "#2563EB", // Blue 600
        "#3B82F6", // Blue 500
        "#60A5FA", // Blue 400
        "#93C5FD", // Blue 300
    ],

    // 따뜻한 색상
    warm: [
        "#DC2626", // Red 600
        "#EA580C", // Orange 600
        "#D97706", // Amber 600
        "#CA8A04", // Yellow 600
        "#84CC16", // Lime 500
        "#16A34A", // Green 600
    ],

    // 차가운 색상
    cool: [
        "#0891B2", // Cyan 600
        "#0284C7", // Sky 600
        "#2563EB", // Blue 600
        "#4F46E5", // Indigo 600
        "#7C3AED", // Violet 600
        "#9333EA", // Purple 600
    ],

    // 비즈니스/대시보드용
    business: [
        "#62e3d5", // Primary teal
        "#0a3b41", // Dark text
        "#059669", // Emerald 600
        "#D97706", // Amber 600
        "#DC2626", // Red 600
        "#5a6376", // Gray text
    ],
};

export const getChartColors = (theme: keyof typeof chartColors = "modern") => {
    return chartColors[theme] || chartColors.modern;
};
