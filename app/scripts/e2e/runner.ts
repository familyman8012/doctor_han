import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/database.types";
import { ensureLocalSupabaseEnv } from "../_supabase";
import { loginInContext, type LoginCredentials } from "../smoke/auth";
import { ACCOUNTS } from "../smoke/config";
import { BASE_URL, TIMEOUTS } from "../smoke/config";

const REPORT_DIR = join(__dirname, "..", "..", "doc");
const RUN_ID = new Date().toISOString().replace(/\D/g, "").slice(0, 14);

const PENDING_VENDOR: LoginCredentials = {
	email: "vendor.pending@medihub.local",
	password: "Password123!",
	label: "vendor-pending",
	role: "vendor",
};

const LEAD_VENDOR: LoginCredentials = {
	email: "vendor03@medihub.local",
	password: "Password123!",
	label: "vendor-standard",
	role: "vendor",
};

const LEAD_DOCTOR: LoginCredentials = {
	email: ACCOUNTS.doctor.email,
	password: ACCOUNTS.doctor.password,
	label: "doctor-standard",
	role: "doctor",
};

type ApiResult = {
	status: number;
	text: string;
	json: unknown;
};

type ScenarioResult = {
	name: string;
	ok: boolean;
	details: string[];
	error?: string;
};

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message);
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function getAdminConfig(): Promise<{ url: string; serviceRoleKey: string }> {
	const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const envServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (envUrl && envServiceRoleKey) {
		return { url: envUrl, serviceRoleKey: envServiceRoleKey };
	}

	let lastError: unknown = null;

	for (let attempt = 0; attempt < 30; attempt += 1) {
		try {
	const env = await ensureLocalSupabaseEnv([
		"--override-name",
		"api.url=NEXT_PUBLIC_SUPABASE_URL",
		"--override-name",
		"auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY",
	]);
	const url = env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

			if (!url || !serviceRoleKey) {
				throw new Error("Missing local Supabase admin env.");
			}

			return { url, serviceRoleKey };
		} catch (error) {
			lastError = error;
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}

	throw new Error(
		`Could not resolve local Supabase admin env: ${
			lastError instanceof Error ? lastError.message : String(lastError)
		}`,
	);
}

async function createAdminClient(): Promise<SupabaseClient<Database>> {
	const { url, serviceRoleKey } = await getAdminConfig();

	return createClient<Database>(url, serviceRoleKey, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}

async function apiRequest(
	page: Page,
	method: "GET" | "POST" | "PATCH",
	path: string,
	body?: Record<string, unknown>,
): Promise<ApiResult> {
	let lastError: unknown = null;

	for (let attempt = 0; attempt < 3; attempt += 1) {
		try {
			return await page.evaluate(
				async ({ method, path, body }) => {
					const response = await fetch(path, {
						method,
						credentials: "include",
						headers: body ? { "Content-Type": "application/json" } : undefined,
						body: body ? JSON.stringify(body) : undefined,
					});

					const text = await response.text();
					let json: unknown = null;
					try {
						json = JSON.parse(text);
					} catch {
						json = null;
					}

					return {
						status: response.status,
						text,
						json,
					};
				},
				{ method, path, body },
			);
		} catch (error) {
			lastError = error;
			const message = error instanceof Error ? error.message : String(error);
			const isRetriable =
				message.includes("Execution context was destroyed") ||
				message.includes("Failed to fetch") ||
				message.includes("Connection closed");

			if (!isRetriable || attempt === 2) {
				break;
			}

			await page.waitForNetworkIdle({ idleTime: 500, timeout: TIMEOUTS.navigation }).catch(() => null);
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	const location = page.url();
	throw new Error(
		`API request failed (${method} ${path}) on ${location}: ${
			lastError instanceof Error ? lastError.message : String(lastError)
		}`,
	);
}

async function clickText(page: Page, text: string) {
	const clicked = await page.evaluate((targetText) => {
		const candidates = Array.from(
			document.querySelectorAll<HTMLElement>("button, a, [role='button'], [tabindex], [class*='cursor-pointer']"),
		);
		const element = candidates.find((candidate) => candidate.innerText.trim().includes(targetText));
		if (!element) {
			return false;
		}

		element.click();
		return true;
	}, text);

	assert(clicked, `Could not find clickable element containing "${text}"`);
}

async function waitForText(page: Page, text: string, timeout = TIMEOUTS.navigation) {
	await page.waitForFunction(
		(targetText) => document.body.innerText.includes(targetText),
		{ timeout },
		text,
	);
}

async function waitForRole(page: Page, expectedRole: "admin" | "doctor" | "vendor") {
	for (let attempt = 0; attempt < 20; attempt += 1) {
		const meResponse = await apiRequest(page, "GET", "/api/me");
		const profile =
			isRecord(meResponse.json) && isRecord(meResponse.json.data) && isRecord(meResponse.json.data.profile)
				? meResponse.json.data.profile
				: null;

		if (profile?.role === expectedRole) {
			return;
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	throw new Error(`Timed out waiting for ${expectedRole} session`);
}

async function withPage<T>(
	browser: Browser,
	credentials: LoginCredentials | "admin" | "doctor" | "vendor",
	fn: (page: Page) => Promise<T>,
): Promise<T> {
	const context = await browser.createBrowserContext();
	const resolvedCredentials =
		typeof credentials === "string"
			? {
					email: ACCOUNTS[credentials].email,
					password: ACCOUNTS[credentials].password,
					label: credentials,
					role: credentials,
				}
			: credentials;

	const page = await loginInContext(context, resolvedCredentials);

	try {
		await waitForRole(page, resolvedCredentials.role ?? "vendor");
		return await fn(page);
	} finally {
		await context.close();
	}
}

async function preparePendingVendorFixture(admin: SupabaseClient<Database>) {
	const { data: profile, error: profileError } = await admin
		.from("profiles")
		.select("id, email")
		.eq("email", PENDING_VENDOR.email)
		.maybeSingle();

	if (profileError || !profile) {
		throw new Error(
			`Could not find pending vendor profile (${PENDING_VENDOR.email}): ${profileError?.message ?? "not found"}`,
		);
	}

	const { data: verification, error: verificationError } = await admin
		.from("vendor_verifications")
		.update({
			status: "pending",
			reviewed_at: null,
			reviewed_by: null,
			reject_reason: null,
		})
		.eq("user_id", profile.id)
		.select("id")
		.maybeSingle();

	if (verificationError || !verification) {
		throw new Error(
			`Could not reset pending vendor verification (${PENDING_VENDOR.email}): ${
				verificationError?.message ?? "not found"
			}`,
		);
	}

	const { data: vendor, error: vendorError } = await admin
		.from("vendors")
		.select("id")
		.eq("owner_user_id", profile.id)
		.maybeSingle();

	if (vendorError) {
		throw new Error(`Could not inspect pending vendor profile: ${vendorError.message}`);
	}

	if (vendor) {
		const { error: draftError } = await admin
			.from("vendors")
			.update({ status: "draft" })
			.eq("id", vendor.id);

		if (draftError) {
			throw new Error(`Could not reset pending vendor status: ${draftError.message}`);
		}
	}

	return {
		userId: profile.id,
		verificationId: verification.id,
	};
}

async function prepareLeadVendorFixture(admin: SupabaseClient<Database>) {
	const { data: doctorProfile, error: doctorProfileError } = await admin
		.from("profiles")
		.select("id")
		.eq("email", LEAD_DOCTOR.email)
		.single();

	if (doctorProfileError || !doctorProfile) {
		throw new Error(`Could not find lead doctor profile: ${doctorProfileError?.message ?? "not found"}`);
	}

	const { error: rateLimitResetError } = await admin
		.from("rate_limits")
		.delete()
		.eq("user_id", doctorProfile.id)
		.eq("action", "lead_create");

	if (rateLimitResetError) {
		throw new Error(`Could not reset lead rate limits: ${rateLimitResetError.message}`);
	}

	const { data: profile, error: profileError } = await admin
		.from("profiles")
		.select("id, email")
		.eq("email", LEAD_VENDOR.email)
		.maybeSingle();

	if (profileError || !profile) {
		throw new Error(
			`Could not find lead vendor profile (${LEAD_VENDOR.email}): ${profileError?.message ?? "not found"}`,
		);
	}

	const { error: verificationError } = await admin
		.from("vendor_verifications")
		.update({
			status: "approved",
			reviewed_at: new Date().toISOString(),
			reviewed_by: null,
			reject_reason: null,
		})
		.eq("user_id", profile.id);

	if (verificationError) {
		throw new Error(`Could not normalize lead vendor verification: ${verificationError.message}`);
	}

	const { data: vendor, error: vendorError } = await admin
		.from("vendors")
		.select("id")
		.eq("owner_user_id", profile.id)
		.maybeSingle();

	if (vendorError || !vendor) {
		throw new Error(`Could not find lead vendor (${LEAD_VENDOR.email}): ${vendorError?.message ?? "not found"}`);
	}

	const { error: activateVendorError } = await admin
		.from("vendors")
		.update({ status: "active" })
		.eq("id", vendor.id);

	if (activateVendorError) {
		throw new Error(`Could not activate lead vendor: ${activateVendorError.message}`);
	}

	const { data: vendorCategories, error: vendorCategoryError } = await admin
		.from("vendor_categories")
		.select("category_id")
		.eq("vendor_id", vendor.id);

	if (vendorCategoryError) {
		throw new Error(`Could not read lead vendor categories: ${vendorCategoryError.message}`);
	}

	const categoryIds = Array.from(
		new Set((vendorCategories ?? []).map((row) => row.category_id).filter((id): id is string => Boolean(id))),
	);
	if (categoryIds.length === 0) {
		throw new Error("Lead vendor has no categories");
	}

	const { data: categories, error: categoryError } = await admin
		.from("categories")
		.select("id, name, depth, sort_order")
		.in("id", categoryIds)
		.order("depth", { ascending: true })
		.order("sort_order", { ascending: true });

	if (categoryError) {
		throw new Error(`Could not load lead vendor categories: ${categoryError.message}`);
	}

	const firstCategory = (categories ?? [])[0];
	if (!firstCategory) {
		throw new Error("Lead vendor category detail is empty");
	}

	for (let index = 0; index < categoryIds.length; index += 1) {
		const categoryId = categoryIds[index]!;
		const { data: existingPrice, error: existingPriceError } = await admin
			.from("vendor_service_prices")
			.select("id")
			.eq("vendor_id", vendor.id)
			.eq("category_id", categoryId)
			.eq("status", "active")
			.maybeSingle();

		if (existingPriceError) {
			throw new Error(`Could not inspect lead vendor prices: ${existingPriceError.message}`);
		}

		if (!existingPrice) {
			const { error: insertPriceError } = await admin
				.from("vendor_service_prices")
				.insert({
					vendor_id: vendor.id,
					category_id: categoryId,
					price: 30000 + index * 10000,
					status: "active",
				});

			if (insertPriceError) {
				throw new Error(`Could not seed lead vendor prices: ${insertPriceError.message}`);
			}
		}
	}

	return {
		vendorId: vendor.id,
		firstCategoryName: firstCategory.name,
	};
}

async function ensurePendingVendorProfile(page: Page, details: string[]) {
	const categoriesResponse = await apiRequest(page, "GET", "/api/categories");
	assert(categoriesResponse.status === 200, `Failed to load categories (${categoriesResponse.status})`);

	const categoryItems = isRecord(categoriesResponse.json) && isRecord(categoriesResponse.json.data)
		? (categoriesResponse.json.data.items as unknown[])
		: [];
	const vendorCategories = categoryItems.filter(
		(item): item is Record<string, unknown> =>
			isRecord(item) && item.listingType === "vendor" && typeof item.id === "string",
	);
	const vendorCategoryIds = vendorCategories.slice(0, 3).map((item) => item.id as string);

	assert(vendorCategoryIds.length > 0, "No vendor categories available for pending vendor setup");

	const vendorResponse = await apiRequest(page, "GET", "/api/vendors/me");
	assert(vendorResponse.status === 200, `Failed to load pending vendor profile (${vendorResponse.status})`);

	const vendorPayload = {
		name: `테스트 대기 업체 ${RUN_ID}`,
		summary: "E2E 검증용 대기 업체 프로필입니다.",
		description: "관리자 승인 플로우를 검증하기 위한 테스트 업체 프로필입니다.",
		regionPrimary: "서울",
		regionSecondary: "강남구",
		priceMin: 100000,
		priceMax: 300000,
		categoryIds: vendorCategoryIds,
	};

	const existingVendor =
		isRecord(vendorResponse.json) &&
		isRecord(vendorResponse.json.data) &&
		isRecord(vendorResponse.json.data.vendor)
			? vendorResponse.json.data.vendor
			: null;

	if (!existingVendor) {
		const createResponse = await apiRequest(page, "POST", "/api/vendors/me", vendorPayload);
		assert(createResponse.status === 201, `Failed to create pending vendor profile (${createResponse.status})`);
		details.push("대기 업체 프로필 생성");
		return;
	}

	const patchResponse = await apiRequest(page, "PATCH", "/api/vendors/me", {
		status: "draft",
		categoryIds: vendorCategoryIds,
	});
	assert(patchResponse.status === 200, `Failed to refresh pending vendor profile (${patchResponse.status})`);
	details.push("대기 업체 프로필 갱신");
}

async function scenarioVendorApproval(browser: Browser, admin: SupabaseClient<Database>): Promise<ScenarioResult> {
	const details: string[] = [];

	try {
		const fixture = await preparePendingVendorFixture(admin);
		details.push(`fixture reset: ${fixture.verificationId}`);

		await withPage(browser, PENDING_VENDOR, async (page) => {
			const meResponse = await apiRequest(page, "GET", "/api/me");
			assert(meResponse.status === 200, `Pending vendor /api/me failed (${meResponse.status})`);

			const meData =
				isRecord(meResponse.json) && isRecord(meResponse.json.data) ? meResponse.json.data : null;
			const verification =
				meData && isRecord(meData.vendorVerification) ? meData.vendorVerification : null;
			assert(verification?.status === "pending", "Pending vendor should start in pending status");
			await ensurePendingVendorProfile(page, details);
		});

		await withPage(browser, "admin", async (page) => {
			const approveResponse = await apiRequest(
				page,
				"POST",
				`/api/admin/verifications/${fixture.verificationId}/approve`,
				{ type: "vendor" },
			);
			assert(approveResponse.status === 200, `Vendor approval failed (${approveResponse.status})`);
			details.push("관리자 승인 API 성공");
		});

		await withPage(browser, PENDING_VENDOR, async (page) => {
			const meResponse = await apiRequest(page, "GET", "/api/me");
			assert(meResponse.status === 200, `Approved vendor /api/me failed (${meResponse.status})`);

			const meData =
				isRecord(meResponse.json) && isRecord(meResponse.json.data) ? meResponse.json.data : null;
			const verification =
				meData && isRecord(meData.vendorVerification) ? meData.vendorVerification : null;
			assert(verification?.status === "approved", "Vendor should be approved after admin action");

			const vendorResponse = await apiRequest(page, "GET", "/api/vendors/me");
			assert(vendorResponse.status === 200, `Approved vendor profile failed (${vendorResponse.status})`);

			const vendorData =
				isRecord(vendorResponse.json) && isRecord(vendorResponse.json.data) && isRecord(vendorResponse.json.data.vendor)
					? vendorResponse.json.data.vendor
					: null;
			assert(vendorData, "Approved vendor profile should exist");
			assert(vendorData.status === "active", "Approved vendor profile should be active");

			await page.goto(`${BASE_URL}/partner`, { waitUntil: "networkidle2", timeout: TIMEOUTS.navigation });
			await waitForText(page, "업체");
			details.push("승인 후 파트너 페이지 진입 확인");
		});

		return { name: "vendor-approval", ok: true, details };
	} catch (error) {
		return {
			name: "vendor-approval",
			ok: false,
			details,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function scenarioLeadLifecycle(browser: Browser, admin: SupabaseClient<Database>): Promise<ScenarioResult> {
	const details: string[] = [];
	const serviceName = `E2E 문의 ${RUN_ID}`;
	const leadContent = `E2E 문의 본문 ${RUN_ID}`;
	const vendorReply = `E2E 업체 응답 ${RUN_ID}`;

	try {
		let leadId = "";
		const fixture = await prepareLeadVendorFixture(admin);
		details.push(`lead vendor fixture: ${fixture.vendorId}`);

		await withPage(browser, "doctor", async (page) => {
			const vendorDetailResponse = await apiRequest(page, "GET", `/api/vendors/${fixture.vendorId}`);
			assert(vendorDetailResponse.status === 200, `Vendor detail failed (${vendorDetailResponse.status})`);

			const vendor =
				isRecord(vendorDetailResponse.json) &&
				isRecord(vendorDetailResponse.json.data) &&
				isRecord(vendorDetailResponse.json.data.vendor)
					? vendorDetailResponse.json.data.vendor
					: null;
			assert(vendor, "Vendor detail missing");

			const categories = Array.isArray(vendor.categories) ? vendor.categories : [];
			assert(categories.length > 0, "Vendor detail is missing categories");

			await page.goto(`${BASE_URL}/vendors/${fixture.vendorId}/inquiry`, {
				waitUntil: "networkidle2",
				timeout: TIMEOUTS.navigation,
			});
			await waitForText(page, "관심 서비스");

			const categoryClicked = await page.evaluate((categoryName) => {
				const categoryButtons = Array.from(
					document.querySelectorAll<HTMLButtonElement>("form button[type='button']"),
				);
				const target = categoryButtons.find((button) => button.textContent?.trim() === categoryName);
				if (!target) {
					return false;
				}

				target.click();
				return true;
			}, fixture.firstCategoryName);
			assert(categoryClicked, `Could not find inquiry category button "${fixture.firstCategoryName}"`);
			await page.type('input[name="serviceName"]', serviceName);
			await page.type('input[name="contactName"]', "E2E 한의사");
			await page.type('input[name="contactPhone"]', "010-1234-5678");
			await page.type('input[name="contactEmail"]', "doctor-e2e@example.com");
			await page.select('select[name="preferredChannel"]', "phone");
			await page.select('select[name="preferredTime"]', "afternoon");
			await page.type('textarea[name="content"]', leadContent);

			const createLeadResponsePromise = page.waitForResponse(
				(response) => {
					try {
						const url = new URL(response.url());
						return url.pathname === "/api/leads" && response.request().method() === "POST";
					} catch {
						return false;
					}
				},
				{ timeout: TIMEOUTS.navigation },
			);

			const [createLeadResponse] = await Promise.all([
				createLeadResponsePromise,
				page.waitForNavigation({ waitUntil: "networkidle2", timeout: TIMEOUTS.navigation }).catch(() => null),
				clickText(page, "문의 접수하기"),
			]);

			const createLeadPayload = await createLeadResponse.json().catch(() => null);
			assert(
				createLeadResponse.status() === 201,
				`Lead creation failed (${createLeadResponse.status()}): ${JSON.stringify(createLeadPayload)}`,
			);

			const createdLead =
				isRecord(createLeadPayload) &&
				isRecord(createLeadPayload.data) &&
				isRecord(createLeadPayload.data.lead)
					? createLeadPayload.data.lead
					: null;
			assert(createdLead && typeof createdLead.id === "string", "Lead create response is missing lead id");
			leadId = createdLead.id;
			details.push(`lead created: ${leadId}`);

			const leadsResponse = await apiRequest(page, "GET", "/api/leads?pageSize=20");
			assert(leadsResponse.status === 200, `Doctor lead list failed (${leadsResponse.status})`);

			const items =
				isRecord(leadsResponse.json) && isRecord(leadsResponse.json.data) && Array.isArray(leadsResponse.json.data.items)
					? leadsResponse.json.data.items
					: [];
			const listedLead = items.find((item) => isRecord(item) && item.id === leadId);
			assert(listedLead, "Created lead not found in doctor lead list");
		});

		await withPage(browser, LEAD_VENDOR, async (page) => {
			await page.goto(`${BASE_URL}/partner/leads/${leadId}`, {
				waitUntil: "networkidle2",
				timeout: TIMEOUTS.navigation,
			});
			await waitForText(page, serviceName);

			await clickText(page, "상태 변경");
			await waitForText(page, "변경하기");
			await clickText(page, "진행중");
			await clickText(page, "변경하기");

			for (let attempt = 0; attempt < 10; attempt += 1) {
				const detailResponse = await apiRequest(page, "GET", `/api/leads/${leadId}`);
				const lead =
					isRecord(detailResponse.json) &&
					isRecord(detailResponse.json.data) &&
					isRecord(detailResponse.json.data.lead)
						? detailResponse.json.data.lead
						: null;
				if (lead?.status === "in_progress") {
					break;
				}

				if (attempt === 9) {
					throw new Error("Vendor status change was not persisted");
				}

				await new Promise((resolve) => setTimeout(resolve, 1000));
			}

			const messageResponse = await apiRequest(page, "POST", `/api/leads/${leadId}/messages`, {
				content: vendorReply,
			});
			assert(messageResponse.status === 201, `Vendor message failed (${messageResponse.status})`);
			details.push("업체 상태 변경 및 응답 전송");
		});

		await withPage(browser, "doctor", async (page) => {
			await page.goto(`${BASE_URL}/mypage/leads/${leadId}`, {
				waitUntil: "networkidle2",
				timeout: TIMEOUTS.navigation,
			});
			await waitForText(page, "진행중");
			await clickText(page, "대화");
			await waitForText(page, vendorReply);
			details.push("의사 화면에서 상태/응답 확인");
		});

		return { name: "lead-lifecycle", ok: true, details };
	} catch (error) {
		return {
			name: "lead-lifecycle",
			ok: false,
			details,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function scenarioCreditChargePreparation(browser: Browser): Promise<ScenarioResult> {
	const details: string[] = [];

	try {
		await withPage(browser, "vendor", async (page) => {
			await page.goto(`${BASE_URL}/partner/credits`, {
				waitUntil: "networkidle2",
				timeout: TIMEOUTS.navigation,
			});
			await waitForText(page, "크레딧 관리");

			const creditsResponse = await apiRequest(page, "GET", "/api/credits");
			assert(creditsResponse.status === 200, `Credits balance failed (${creditsResponse.status})`);

			const packages =
				isRecord(creditsResponse.json) &&
				isRecord(creditsResponse.json.data) &&
				Array.isArray(creditsResponse.json.data.packages)
					? creditsResponse.json.data.packages
					: [];
			const firstPackage = packages.find((item) => isRecord(item) && typeof item.id === "string");
			assert(firstPackage && typeof firstPackage.id === "string", "No credit package available");

			const prepareResponse = await apiRequest(page, "POST", "/api/credits/charge", {
				packageId: firstPackage.id,
			});
			assert(prepareResponse.status === 200, `Credit charge preparation failed (${prepareResponse.status})`);

			const paymentData =
				isRecord(prepareResponse.json) && isRecord(prepareResponse.json.data) ? prepareResponse.json.data : null;
			assert(typeof paymentData?.orderId === "string", "Charge preparation response is missing orderId");
			assert(typeof paymentData?.amount === "number", "Charge preparation response is missing amount");
			details.push(`order prepared: ${paymentData.orderId}`);
		});

		return { name: "credit-charge-preparation", ok: true, details };
	} catch (error) {
		return {
			name: "credit-charge-preparation",
			ok: false,
			details,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

function writeReport(results: ScenarioResult[]) {
	mkdirSync(REPORT_DIR, { recursive: true });

	const reportLines = [
		"# E2E Report",
		"",
		`**Date**: ${new Date().toISOString().slice(0, 19)}`,
		`**Target**: ${BASE_URL}`,
		`**Passed**: ${results.filter((result) => result.ok).length}/${results.length}`,
		"",
		"---",
		"",
	];

	for (const result of results) {
		reportLines.push(`## ${result.ok ? "PASS" : "FAIL"} — ${result.name}`);
		for (const detail of result.details) {
			reportLines.push(`- ${detail}`);
		}
		if (result.error) {
			reportLines.push(`- Error: ${result.error}`);
		}
		reportLines.push("");
	}

	writeFileSync(join(REPORT_DIR, "e2e-report.md"), reportLines.join("\n"), "utf-8");
	writeFileSync(join(REPORT_DIR, "e2e-results.json"), JSON.stringify(results, null, 2), "utf-8");
}

async function main() {
	console.log("🚀 Medihub E2E Runner");
	console.log(`   Target: ${BASE_URL}`);
	console.log(`   Time: ${new Date().toISOString()}\n`);

	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
	});

	try {
		const admin = await createAdminClient();
		const results = [
			await scenarioVendorApproval(browser, admin),
			await scenarioLeadLifecycle(browser, admin),
			await scenarioCreditChargePreparation(browser),
		];

		writeReport(results);

		console.log(`\n${"═".repeat(60)}`);
		for (const result of results) {
			console.log(`${result.ok ? "✅" : "❌"} ${result.name}${result.error ? ` — ${result.error}` : ""}`);
		}
		console.log(`📄 Report: doc/e2e-report.md`);
		console.log(`${"═".repeat(60)}\n`);

		if (results.some((result) => !result.ok)) {
			process.exit(1);
		}
	} finally {
		await browser.close();
	}
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
