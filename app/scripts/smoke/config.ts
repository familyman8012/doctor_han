export const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

export const ACCOUNTS = {
    admin: { email: "admin@medihub.local", password: "Password123!" },
    doctor: { email: "doctor1@medihub.local", password: "Password123!" },
    vendor: { email: "vendor01@medihub.local", password: "Password123!" },
} as const;

export type Role = keyof typeof ACCOUNTS;

export const TIMEOUTS = {
    navigation: 15_000,
    settle: 3_000,
    login: 10_000,
    toast: 2_000,
} as const;

// Ignore patterns for console errors
export const CONSOLE_IGNORE_PATTERNS = [
    /favicon\.ico/,
    /Download the React DevTools/,
    /React does not recognize/,
    /Warning:/,
    /DevTools/,
    /Sentry/,
    /_next\/static/,
    /hot-update/,
    /NEXT_REDIRECT/,
    /ChunkLoadError/,
];

// Ignore patterns for network errors
export const NETWORK_IGNORE_PATTERNS = [
    /favicon\.ico/,
    /hot-update/,
    /_next\/webpack-hmr/,
    /sentry/i,
    /\.map$/,
];
