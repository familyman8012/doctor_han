export const ENV_CONFIG = {
    NODE_ENV: process.env.NODE_ENV || "development",
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
};

// 개발 환경 여부 확인
export const isDevelopment = () => ENV_CONFIG.NODE_ENV === "development";
