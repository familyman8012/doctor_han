import type { Browser, BrowserContext, Page } from "puppeteer";
import { ACCOUNTS, BASE_URL, TIMEOUTS, type Role } from "./config";

export type LoginCredentials = {
    email: string;
    password: string;
    label?: string;
    role?: Role;
};

type SessionProbe = {
    authenticated: boolean;
    role: Role | null;
};

async function waitForAuthenticatedSession(page: Page, timeoutMs: number, expectedRole?: Role): Promise<boolean> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        const session = await page
            .evaluate(async () => {
                try {
                    const response = await fetch("/api/me", { credentials: "include" });
                    if (!response.ok) {
                        return { authenticated: false, role: null };
                    }

                    const json = await response.json();
                    const user = json?.data?.user;
                    const role = json?.data?.profile?.role;

                    return {
                        authenticated: Boolean(user?.id),
                        role: role === "admin" || role === "doctor" || role === "vendor" ? role : null,
                    } satisfies SessionProbe;
                } catch {
                    return { authenticated: false, role: null };
                }
            })
            .catch(
                () =>
                    ({
                        authenticated: false,
                        role: null,
                    }) satisfies SessionProbe,
            );

        if (session.authenticated && (!expectedRole || session.role === expectedRole)) {
            return true;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return false;
}

async function stabilizeAuthenticatedPage(page: Page): Promise<void> {
    try {
        await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: TIMEOUTS.navigation });
    } catch {
        // Client-side navigation may already be in progress. Fall through to idle waits.
    }

    await page
        .waitForFunction(() => document.readyState === "complete", { timeout: TIMEOUTS.navigation })
        .catch(() => null);
    await page.waitForNetworkIdle({ idleTime: 500, timeout: TIMEOUTS.navigation }).catch(() => null);
}

/**
 * Log in as a specific role via the browser login page.
 * Returns an authenticated Page instance.
 */
export async function login(browser: Browser, role: Role): Promise<Page> {
    return loginAs(browser, {
        email: ACCOUNTS[role].email,
        password: ACCOUNTS[role].password,
        label: role,
    });
}

export async function loginAs(browser: Browser, credentials: LoginCredentials): Promise<Page> {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await completeLogin(page, credentials);
    return page;
}

export async function loginInContext(context: BrowserContext, credentials: LoginCredentials): Promise<Page> {
    const page = await context.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await completeLogin(page, credentials);
    return page;
}

async function completeLogin(page: Page, credentials: LoginCredentials): Promise<void> {
    const label = credentials.label ?? credentials.email;
    console.log(`  🔑 Logging in as ${label} (${credentials.email})...`);

    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2", timeout: TIMEOUTS.navigation });

    // Type credentials
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: TIMEOUTS.login });
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    if (emailInput) {
        await emailInput.click({ clickCount: 3 });
        await emailInput.type(credentials.email);
    }

    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
        await passwordInput.click({ clickCount: 3 });
        await passwordInput.type(credentials.password);
    }

    // Submit
    await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: TIMEOUTS.navigation }).catch(() => {}),
        page.click('button[type="submit"]'),
    ]);

    const isAuthenticated = await waitForAuthenticatedSession(page, TIMEOUTS.login, credentials.role);

    if (!isAuthenticated) {
        throw new Error(`Login did not establish an authenticated ${credentials.role ?? "user"} session for ${label}`);
    }

    await stabilizeAuthenticatedPage(page);
    console.log(`  ✅ Logged in as ${label}`);
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
