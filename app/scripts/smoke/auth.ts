import type { Browser, Page } from "puppeteer";
import { ACCOUNTS, BASE_URL, TIMEOUTS, type Role } from "./config";

/**
 * Log in as a specific role via the browser login page.
 * Returns an authenticated Page instance.
 */
export async function login(browser: Browser, role: Role): Promise<Page> {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const { email, password } = ACCOUNTS[role];
    console.log(`  🔑 Logging in as ${role} (${email})...`);

    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2", timeout: TIMEOUTS.navigation });

    // Type credentials
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: TIMEOUTS.login });
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    if (emailInput) {
        await emailInput.click({ clickCount: 3 });
        await emailInput.type(email);
    }

    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
        await passwordInput.click({ clickCount: 3 });
        await passwordInput.type(password);
    }

    // Submit
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: TIMEOUTS.navigation }).catch(() => {}),
        page.click('button[type="submit"]'),
    ]);

    // Wait for auth to settle - check that /api/me returns successfully
    try {
        await page.waitForFunction(
            () => {
                return document.cookie.includes("sb-") || document.querySelector('[data-auth-ready="true"]') !== null;
            },
            { timeout: TIMEOUTS.login },
        );
    } catch {
        // Fallback: just wait a bit for auth cookies to set
        await new Promise((r) => setTimeout(r, 2000));
    }

    // Verify login succeeded by checking we're not still on /login
    const url = page.url();
    if (url.includes("/login")) {
        console.warn(`  ⚠️ Login may have failed for ${role} - still on login page`);
    } else {
        console.log(`  ✅ Logged in as ${role}`);
    }

    return page;
}

/**
 * Resolve dynamic IDs by fetching list APIs from authenticated page context.
 */
export async function resolveDynamicIds(page: Page, role: Role): Promise<Record<string, string>> {
    const ids: Record<string, string> = {};

    const fetchFirst = async (apiPath: string, idField = "id"): Promise<string | null> => {
        try {
            const result = await page.evaluate(
                async (url: string, field: string) => {
                    const res = await fetch(url, { credentials: "include" });
                    if (!res.ok) return null;
                    const json = await res.json();
                    const items = json.data?.items ?? json.data?.rows ?? json.data ?? [];
                    if (Array.isArray(items) && items.length > 0) {
                        return items[0][field] ?? null;
                    }
                    return null;
                },
                `${apiPath}`, idField,
            );
            return result as string | null;
        } catch {
            return null;
        }
    };

    if (role === "doctor") {
        ids.vendorId = (await fetchFirst("/api/vendors?pageSize=1")) ?? "00000000-0000-0000-0000-000000000000";
        ids.productId = (await fetchFirst("/api/products?pageSize=1")) ?? "00000000-0000-0000-0000-000000000000";
        ids.leadId = (await fetchFirst("/api/leads?pageSize=1")) ?? "00000000-0000-0000-0000-000000000000";
    }

    if (role === "vendor") {
        ids.vendorLeadId = (await fetchFirst("/api/leads?pageSize=1")) ?? "00000000-0000-0000-0000-000000000000";
        ids.vendorProductId = (await fetchFirst("/api/vendors/me/products?pageSize=1")) ?? "00000000-0000-0000-0000-000000000000";
        ids.bidProjectId = (await fetchFirst("/api/bid/projects?pageSize=1")) ?? "00000000-0000-0000-0000-000000000000";
    }

    if (role === "admin") {
        ids.adminBidProjectId = (await fetchFirst("/api/admin/bid-projects?pageSize=1")) ?? "00000000-0000-0000-0000-000000000000";
        ids.adminCampaignId = (await fetchFirst("/api/admin/ads/campaigns?pageSize=1")) ?? "00000000-0000-0000-0000-000000000000";
        ids.adminSettlementId = (await fetchFirst("/api/admin/settlements?pageSize=1")) ?? "00000000-0000-0000-0000-000000000000";
        ids.adminSupportId = (await fetchFirst("/api/admin/support?pageSize=1")) ?? "00000000-0000-0000-0000-000000000000";
    }

    return ids;
}
