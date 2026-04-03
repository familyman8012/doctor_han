import puppeteer from "puppeteer";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BASE_URL, TIMEOUTS, type Role } from "./config";
import { login, resolveDynamicIds } from "./auth";
import { attachCollectors, type SmokeError } from "./collectors";
import { getPagesForRole, type PageEntry } from "./pages";

const SCREENSHOT_DIR = process.env.SMOKE_SCREENSHOT_DIR ?? join(__dirname, "screenshots");
const REPORT_DIR = join(__dirname, "..", "..", "doc");

// ── Helpers ──

function resolvePagePath(entry: PageEntry, dynamicIds: Record<string, string>): string {
    let path = entry.path;
    if (entry.dynamic) {
        const id = dynamicIds[entry.dynamic];
        if (id) {
            path = path.replace(`{${entry.dynamic}}`, id);
        }
    }
    return path;
}

// ── Main ──

async function runSmokeForRole(role: Role, allErrors: SmokeError[]): Promise<void> {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`  🧪 Smoke testing: ${role.toUpperCase()}`);
    console.log(`${"═".repeat(60)}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    try {
        // Auth pages - visit before login
        if (role === "doctor") {
            const authPages = getPagesForRole(role).filter((p) => p.roles.length === 0);
            if (authPages.length > 0) {
                const authPage = await browser.newPage();
                await authPage.setViewport({ width: 1280, height: 800 });
                for (const entry of authPages) {
                    await visitPage(authPage, entry, entry.path, role, allErrors);
                }
                await authPage.close();
            }
        }

        // Login
        const page = await login(browser, role);

        // Resolve dynamic IDs
        const dynamicIds = await resolveDynamicIds(page, role);
        console.log(`  📋 Dynamic IDs:`, dynamicIds);

        // Get pages for this role (exclude auth pages)
        const pagePathFilter = process.env.SMOKE_ONLY_PATHS
            ?.split(",")
            .map((value) => value.trim())
            .filter(Boolean);
        const pages = getPagesForRole(role)
            .filter((p) => p.roles.length > 0)
            .filter((entry) => {
                if (!pagePathFilter || pagePathFilter.length === 0) return true;
                return pagePathFilter.includes(entry.path);
            });
        console.log(`  📄 Pages to test: ${pages.length}\n`);

        for (const entry of pages) {
            const resolvedPath = resolvePagePath(entry, dynamicIds);
            await visitPage(page, entry, resolvedPath, role, allErrors);
        }

        await page.close();
    } finally {
        await browser.close();
    }
}

async function visitPage(page: import("puppeteer").Page, entry: PageEntry, resolvedPath: string, role: string, allErrors: SmokeError[]): Promise<void> {
    const fullUrl = `${BASE_URL}${resolvedPath}`;
    const label = `[${role}] ${entry.label} (${resolvedPath})`;

    try {
        const collector = attachCollectors(page, role, resolvedPath);

        await page.goto(fullUrl, {
            waitUntil: "networkidle2",
            timeout: TIMEOUTS.navigation,
        });

        // Wait for React Query / data to settle
        await new Promise((r) => setTimeout(r, TIMEOUTS.settle));

        // Collect toast errors from DOM
        await collector.collectToasts();

        const errors = collector.flush();

        if (errors.length > 0) {
            console.log(`  ❌ ${label} — ${errors.length} error(s)`);
            for (const e of errors) {
                console.log(`     [${e.severity}/${e.type}] ${e.message.slice(0, 120)}`);
            }

            // Take screenshot on error
            const ssDir = join(SCREENSHOT_DIR, role);
            mkdirSync(ssDir, { recursive: true });
            const safeName = resolvedPath.replace(/\//g, "_").replace(/[^a-zA-Z0-9_-]/g, "") || "root";
            await page.screenshot({ path: join(ssDir, `${safeName}.png`), fullPage: true });

            allErrors.push(...errors);
        } else {
            console.log(`  ✅ ${label}`);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`  💥 ${label} — TIMEOUT/CRASH: ${message.slice(0, 120)}`);
        allErrors.push({
            severity: "P0",
            type: "crash",
            page: resolvedPath,
            role,
            message: `Navigation failed: ${message}`,
        });
    }
}

// ── Report Generation ──

function generateReport(allErrors: SmokeError[]): void {
    // Group by severity
    const bySeverity: Record<string, SmokeError[]> = {};
    for (const e of allErrors) {
        (bySeverity[e.severity] ??= []).push(e);
    }

    // Group by page
    const byPage: Record<string, SmokeError[]> = {};
    for (const e of allErrors) {
        const key = `[${e.role}] ${e.page}`;
        (byPage[key] ??= []).push(e);
    }

    const lines: string[] = [
        "# Smoke Test Report",
        "",
        `**Date**: ${new Date().toISOString().slice(0, 19)}`,
        `**Total errors**: ${allErrors.length}`,
        `**P0 (critical)**: ${bySeverity["P0"]?.length ?? 0}`,
        `**P1 (major)**: ${bySeverity["P1"]?.length ?? 0}`,
        `**P2 (minor)**: ${bySeverity["P2"]?.length ?? 0}`,
        "",
        "---",
        "",
    ];

    // P0 first
    if (bySeverity["P0"]?.length) {
        lines.push("## P0 — Critical (5xx / crashes / error toasts)");
        lines.push("");
        for (const e of bySeverity["P0"]) {
            lines.push(`- **[${e.role}] ${e.page}** — \`${e.type}\`: ${e.message}`);
            if (e.detail) lines.push(`  - Detail: \`${e.detail.slice(0, 200)}\``);
        }
        lines.push("");
    }

    if (bySeverity["P1"]?.length) {
        lines.push("## P1 — Major (4xx errors)");
        lines.push("");
        for (const e of bySeverity["P1"]) {
            lines.push(`- **[${e.role}] ${e.page}** — \`${e.type}\`: ${e.message}`);
            if (e.detail) lines.push(`  - Detail: \`${e.detail.slice(0, 200)}\``);
        }
        lines.push("");
    }

    if (bySeverity["P2"]?.length) {
        lines.push("## P2 — Minor (console errors)");
        lines.push("");
        for (const e of bySeverity["P2"]) {
            lines.push(`- **[${e.role}] ${e.page}** — \`${e.type}\`: ${e.message.slice(0, 150)}`);
        }
        lines.push("");
    }

    // By page summary
    lines.push("## Errors by Page");
    lines.push("");
    for (const [page, errors] of Object.entries(byPage).sort()) {
        lines.push(`### ${page} (${errors.length} errors)`);
        for (const e of errors) {
            lines.push(`- [${e.severity}/${e.type}] ${e.message.slice(0, 150)}`);
        }
        lines.push("");
    }

    mkdirSync(REPORT_DIR, { recursive: true });
    writeFileSync(join(REPORT_DIR, "smoke-report.md"), lines.join("\n"), "utf-8");
    writeFileSync(join(REPORT_DIR, "smoke-results.json"), JSON.stringify(allErrors, null, 2), "utf-8");

    console.log(`\n📊 Report saved to doc/smoke-report.md (${allErrors.length} errors found)`);
    console.log(`📋 JSON saved to doc/smoke-results.json`);
}

// ── Entry ──

async function main() {
    console.log("🚀 Medihub Smoke Test Runner");
    console.log(`   Target: ${BASE_URL}`);
    console.log(`   Time: ${new Date().toISOString()}\n`);

    mkdirSync(SCREENSHOT_DIR, { recursive: true });

    const allErrors: SmokeError[] = [];
    const roles: Role[] = ["doctor", "vendor", "admin"];

    for (const role of roles) {
        await runSmokeForRole(role, allErrors);
    }

    // Generate report
    generateReport(allErrors);

    console.log("\n✨ Smoke test complete!");
    process.exit(allErrors.some((e) => e.severity === "P0") ? 1 : 0);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(2);
});
