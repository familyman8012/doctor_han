import type { Page, HTTPResponse, ConsoleMessage } from "puppeteer";
import { CONSOLE_IGNORE_PATTERNS, NETWORK_IGNORE_PATTERNS } from "./config";

export type ErrorSeverity = "P0" | "P1" | "P2" | "P3";

export interface SmokeError {
    severity: ErrorSeverity;
    type: "crash" | "network" | "console" | "toast";
    page: string;
    role: string;
    message: string;
    detail?: string;
}

function shouldIgnoreConsole(text: string): boolean {
    return CONSOLE_IGNORE_PATTERNS.some((p) => p.test(text));
}

function shouldIgnoreNetwork(url: string): boolean {
    return NETWORK_IGNORE_PATTERNS.some((p) => p.test(url));
}

const DUMMY_UUID = "00000000-0000-0000-0000-000000000000";

/** Pages using dummy UUID are expected to 404 — filter those as false positives */
function isDummyUuidFalsePositive(pagePath: string, url: string, status: number): boolean {
    if (!pagePath.includes(DUMMY_UUID)) return false;
    // 404 on API calls for dummy UUIDs is expected
    if (status === 404) return true;
    // Product detail pages intentionally try to record recent views; dummy UUID should not fail the smoke run.
    if (status === 400 && url.includes("/api/product-recent-views")) return true;
    return false;
}

function isDummyUuidToast(pagePath: string, message: string): boolean {
    if (!pagePath.includes(DUMMY_UUID)) return false;
    // "찾을 수 없습니다" toasts on dummy UUID pages are expected
    return /찾을 수 없습니다/.test(message);
}

/**
 * Attach error collectors to a Puppeteer page.
 * Returns a function that returns all collected errors and clears the buffer.
 */
export function attachCollectors(page: Page, role: string, pagePath: string) {
    const errors: SmokeError[] = [];

    // 1. Page crashes (uncaught exceptions)
    page.on("pageerror", (err) => {
        const e = err instanceof Error ? err : new Error(String(err));
        errors.push({
            severity: "P0",
            type: "crash",
            page: pagePath,
            role,
            message: e.message,
            detail: e.stack,
        });
    });

    // 2. Console errors
    page.on("console", (msg: ConsoleMessage) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        if (shouldIgnoreConsole(text)) return;
        // Dummy UUID pages: 404 console errors are expected
        if (pagePath.includes(DUMMY_UUID) && /404|찾을 수 없습니다/.test(text)) return;
        if (pagePath.includes(DUMMY_UUID) && /product-recent-views/.test(text) && /400/.test(text)) return;
        errors.push({
            severity: "P2",
            type: "console",
            page: pagePath,
            role,
            message: text.slice(0, 500),
        });
    });

    // 3. Network failures (4xx/5xx)
    page.on("response", (res: HTTPResponse) => {
        const status = res.status();
        if (status < 400) return;
        const url = res.url();
        if (shouldIgnoreNetwork(url)) return;
        // 401 on auth-related pages is expected
        if (status === 401 && (pagePath.startsWith("/login") || pagePath.startsWith("/signup") || pagePath.startsWith("/reset"))) return;
        // Dummy UUID pages: 404s are expected false positives
        if (isDummyUuidFalsePositive(pagePath, url, status)) return;
        // 404 for page-level navigation will be caught by toast or empty state
        errors.push({
            severity: status >= 500 ? "P0" : "P1",
            type: "network",
            page: pagePath,
            role,
            message: `${status} ${res.statusText()}`,
            detail: url,
        });
    });

    return {
        /** Collect toast errors from DOM after page settles */
        async collectToasts(): Promise<void> {
            try {
                const toasts = await page.$$eval(
                    '[data-sonner-toast][data-type="error"], [data-sonner-toast][data-type="warning"]',
                    (els) =>
                        els.map((el) => ({
                            text: el.textContent?.trim() ?? "",
                            type: el.getAttribute("data-type") ?? "error",
                        })),
                );
                for (const t of toasts) {
                    if (!t.text) continue;
                    // Dummy UUID pages: "찾을 수 없습니다" toasts are expected
                    if (isDummyUuidToast(pagePath, t.text)) continue;
                    errors.push({
                        severity: "P0",
                        type: "toast",
                        page: pagePath,
                        role,
                        message: t.text.slice(0, 300),
                    });
                }
            } catch {
                // Page might have navigated away
            }
        },
        /** Flush collected errors */
        flush(): SmokeError[] {
            const result = [...errors];
            errors.length = 0;
            return result;
        },
    };
}
