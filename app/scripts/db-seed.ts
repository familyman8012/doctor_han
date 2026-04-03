import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import crypto from "node:crypto";

import type { Database, TablesInsert } from "../src/lib/database.types";
import { ensureLocalSupabaseEnv } from "./_supabase";

const DEFAULT_PASSWORD = "Password123!" as const;

async function getLocalSupabaseEnv(): Promise<{ url: string; serviceRoleKey: string }> {
	const env = await ensureLocalSupabaseEnv([
		"--override-name",
		"api.url=NEXT_PUBLIC_SUPABASE_URL",
		"--override-name",
		"auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY",
	]);
	const url = env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !serviceRoleKey) {
		throw new Error(
			[
				"Missing local Supabase env from `supabase status`.",
				"",
				"Make sure local Supabase is running:",
				"  pnpm -C app db:start",
			].join("\n"),
		);
	}

	return { url, serviceRoleKey };
}

function getRemoteSupabaseEnv(): { url: string; serviceRoleKey: string } {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !serviceRoleKey) {
		throw new Error(
			[
				"Missing remote Supabase env.",
				"",
				"Run with .env loaded, for example:",
				"  cd app && set -a && source .env && set +a && pnpm db:seed -- --remote",
			].join("\n"),
		);
	}

	return { url, serviceRoleKey };
}

function sleep(ms: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function createRng(seed: number) {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let x = t;
		x = Math.imul(x ^ (x >>> 15), x | 1);
		x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
}

function pick<T>(rng: () => number, items: readonly T[]): T {
	return items[Math.floor(rng() * items.length)]!;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
	return out;
}

function toDateString(input: Date): string {
	return input.toISOString().slice(0, 10);
}

async function waitForPostgrestReady(supabase: SupabaseClient<Database>) {
	const maxAttempts = 120;
	let lastErrorMessage = "unknown";
	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			const { error } = await supabase.from("categories").select("id").limit(1);
			if (!error) return;
			lastErrorMessage = error.message;
		} catch {
			lastErrorMessage = "fetch failed";
		}
		await sleep(500);
	}

	throw new Error(`Supabase API not ready after waiting. lastError=${lastErrorMessage}`);
}

async function waitForAuthAdminReady(supabase: SupabaseClient<Database>) {
	const maxAttempts = 120;
	let lastErrorMessage = "unknown";
	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
			if (!error) return;
			lastErrorMessage = error.message;
		} catch {
			lastErrorMessage = "fetch failed";
		}
		await sleep(500);
	}

	throw new Error(`Supabase Auth admin API not ready after waiting. lastError=${lastErrorMessage}`);
}

async function assertNoDanglingVendorCategories(supabase: SupabaseClient<Database>) {
	const { data: vendorCategoryRows, error: vendorCategoryError } = await supabase
		.from("vendor_categories")
		.select("category_id")
		.limit(5000);

	if (vendorCategoryError) {
		throw new Error(`Failed to inspect vendor_categories: ${vendorCategoryError.message}`);
	}

	const categoryIds = Array.from(
		new Set((vendorCategoryRows ?? []).map((row) => row.category_id).filter((id): id is string => Boolean(id))),
	);

	if (categoryIds.length === 0) {
		return;
	}

	const { data: categoryRows, error: categoryError } = await supabase
		.from("categories")
		.select("id")
		.in("id", categoryIds);

	if (categoryError) {
		throw new Error(`Failed to inspect categories: ${categoryError.message}`);
	}

	const existingCategoryIds = new Set((categoryRows ?? []).map((row) => row.id));
	const missingCategoryIds = categoryIds.filter((id) => !existingCategoryIds.has(id));

	if (missingCategoryIds.length === 0) {
		const [{ count: vendorCount, error: vendorCountError }, { count: productCount, error: productCountError }] =
			await Promise.all([
				supabase.from("vendors").select("id", { count: "exact", head: true }),
				supabase.from("products").select("id", { count: "exact", head: true }),
			]);

		if (vendorCountError) {
			throw new Error(`Failed to inspect vendors: ${vendorCountError.message}`);
		}

		if (productCountError) {
			throw new Error(`Failed to inspect products: ${productCountError.message}`);
		}

		if ((vendorCount ?? 0) > 0 && vendorCategoryRows.length === 0) {
			throw new Error(
				[
					"Detected incomplete local seed fixture: vendors exist but vendor_categories is empty.",
					"Run `pnpm -C app db:reset` before relying on local smoke/E2E results.",
				].join("\n"),
			);
		}

		if ((vendorCount ?? 0) > 0 && (productCount ?? 0) === 0) {
			throw new Error(
				[
					"Detected incomplete local seed fixture: vendors exist but products are missing.",
					"Run `pnpm -C app db:reset` before relying on local smoke/E2E results.",
				].join("\n"),
			);
		}

		return;
	}

	throw new Error(
		[
			"Detected dangling vendor_categories -> categories references in local data.",
			`Missing category IDs: ${missingCategoryIds.slice(0, 5).join(", ")}`,
			"Your local DB is out of sync with the current category migrations.",
			"Run `pnpm -C app db:reset` before relying on local smoke/E2E results.",
		].join("\n"),
	);
}

async function createAuthUser(
	supabase: SupabaseClient<Database>,
	input: { email: string; password: string },
): Promise<User> {
	const { data, error } = await supabase.auth.admin.createUser({
		email: input.email,
		password: input.password,
		email_confirm: true,
	});

	if (!error && data.user) {
		return data.user;
	}

	const existingUser = await findAuthUserByEmail(supabase, input.email);
	if (existingUser) {
		return existingUser;
	}

	throw new Error(`Failed to create user: ${input.email} (${error?.message ?? "unknown"})`);
}

async function listAllAuthUsers(supabase: SupabaseClient<Database>): Promise<User[]> {
	const users: User[] = [];
	let page = 1;

	for (;;) {
		const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
		if (error) {
			throw new Error(`Failed to list auth users: ${error.message}`);
		}

		users.push(...data.users);

		if (data.users.length < 200) {
			return users;
		}

		page += 1;
	}
}

async function findAuthUserByEmail(
	supabase: SupabaseClient<Database>,
	email: string,
): Promise<User | null> {
	const users = await listAllAuthUsers(supabase);
	return users.find((user) => user.email === email) ?? null;
}

async function cleanupPartialSeedState(supabase: SupabaseClient<Database>) {
	const [authUsers, profilesCountResult, doctorVerificationCountResult, vendorVerificationCountResult] =
		await Promise.all([
			listAllAuthUsers(supabase),
			supabase.from("profiles").select("id", { count: "exact", head: true }),
			supabase.from("doctor_verifications").select("user_id", { count: "exact", head: true }),
			supabase.from("vendor_verifications").select("user_id", { count: "exact", head: true }),
		]);

	const profilesCount = profilesCountResult.count ?? 0;
	const doctorVerificationCount = doctorVerificationCountResult.count ?? 0;
	const vendorVerificationCount = vendorVerificationCountResult.count ?? 0;

	if (
		authUsers.length === 0 &&
		profilesCount === 0 &&
		doctorVerificationCount === 0 &&
		vendorVerificationCount === 0
	) {
		return;
	}

	console.info("🧹 Partial local seed state detected. Cleaning auth/profiles/verifications before reseeding...");

	for (const table of ["doctor_verifications", "vendor_verifications", "profiles"] as const) {
		const { error } = await supabase.from(table).delete().not("id", "is", null);
		if (error) {
			throw new Error(`Failed to cleanup ${table}: ${error.message}`);
		}
	}

	for (const user of authUsers) {
		const { error } = await supabase.auth.admin.deleteUser(user.id);
		if (error) {
			throw new Error(`Failed to cleanup auth user ${user.email ?? user.id}: ${error.message}`);
		}
	}
}

async function insertAll<TTable extends keyof Database["public"]["Tables"] & string>(
	supabase: SupabaseClient<Database>,
	table: TTable,
	rows: Database["public"]["Tables"][TTable]["Insert"][],
) {
	for (const batch of chunk(rows, 200)) {
		const builder = supabase.from(table);
		type InsertValues = Parameters<typeof builder.insert>[0];
		const { error } = await builder.insert(batch as unknown as InsertValues);
		if (error) {
			throw new Error(`Failed to insert ${String(table)} (${error.code ?? "?"}): ${error.message}`);
		}
	}
}

async function upsertAll<TTable extends keyof Database["public"]["Tables"] & string>(
	supabase: SupabaseClient<Database>,
	table: TTable,
	rows: Database["public"]["Tables"][TTable]["Insert"][],
	onConflict: string,
) {
	for (const batch of chunk(rows, 200)) {
		const builder = supabase.from(table);
		type UpsertValues = Parameters<typeof builder.upsert>[0];
		const { error } = await builder.upsert(batch as unknown as UpsertValues, {
			onConflict,
		});
		if (error) {
			throw new Error(`Failed to upsert ${String(table)} (${error.code ?? "?"}): ${error.message}`);
		}
	}
}

type SeedCategory = {
	id: string;
	parentId: string | null;
	depth: number;
	slug: string;
	name: string;
	listingType: "vendor" | "product";
};

const REGION_PRIMARY = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산"] as const;
const REGION_SECONDARY = [
	"강남구",
	"서초구",
	"송파구",
	"마포구",
	"성남시",
	"수원시",
	"부천시",
	"연수구",
	"해운대구",
	"수성구",
	"서구",
	"유성구",
] as const;

const NAME_PREFIX = ["메디", "스마트", "클리닉", "온", "그린", "블루", "브라이트", "프라임", "케어", "디자인"] as const;
const NAME_SUFFIX = ["파트너스", "솔루션", "랩", "웍스", "컴퍼니", "스튜디오", "프로", "플래닝", "서비스", "그룹"] as const;

function getSeedFlavor(category: { slug: string; name: string }) {
	const slug = category.slug;

	if (slug.includes("interior")) {
		return {
			tagline: "병·의원 전문 인테리어, 설계부터 시공까지",
			priceRange: { min: 8000000, max: 32000000 },
			portfolioTitle: "시공 사례",
			reviews: [
				"동선 설계가 좋아 진료 효율이 개선됐습니다. 결과물도 만족합니다.",
				"일정 관리가 체계적이고 커뮤니케이션이 빠릅니다.",
				"마감 퀄리티가 좋고 사후 대응도 괜찮았습니다.",
			] as const,
		};
	}

	if (slug.includes("pharma") || slug.includes("pharmacopuncture")) {
		return {
			tagline: "약침 조제부터 품질관리까지 안정적으로 지원",
			priceRange: { min: 300000, max: 1800000 },
			portfolioTitle: "프로젝트 사례",
			reviews: [
				"약침 품질이 안정적이고 응대가 빨라 운영에 도움이 됐습니다.",
				"납기 일정이 정확하고 문의 대응이 친절합니다.",
				"자료 정리가 잘 되어 있어 협업이 편했습니다.",
			] as const,
		};
	}

	if (slug.includes("decoction") || slug.includes("herbal")) {
		return {
			tagline: "원외탕전/한약 공급부터 배송까지 원스톱 지원",
			priceRange: { min: 200000, max: 1200000 },
			portfolioTitle: "프로젝트 사례",
			reviews: [
				"처방 연동이 안정적이고 배송이 정확합니다. 응대도 빠른 편이에요.",
				"포장 퀄리티가 좋아 환자 만족도가 올라갔습니다.",
				"문의 대응이 친절했고 운영 프로세스가 체계적입니다.",
			] as const,
		};
	}

	return {
		tagline: `${category.name} 관련 상담부터 진행 관리까지 지원`,
		priceRange: { min: 500000, max: 5000000 },
		portfolioTitle: "프로젝트 사례",
		reviews: [
			"응대가 빠르고 진행 과정이 비교적 투명했습니다.",
			"일정 조율이 매끄럽고 결과물도 만족스러웠습니다.",
			"설명이 이해하기 쉬워서 협업이 편했습니다.",
		] as const,
	};
}

type SeedUserSpec = {
	email: string;
	password: string;
	role: TablesInsert<"profiles">["role"];
	displayName: string;
	phone: string;
	verificationStatus?: TablesInsert<"doctor_verifications">["status"] | TablesInsert<"vendor_verifications">["status"];
};

async function main() {
	const args = new Set(process.argv.slice(2).filter((arg) => arg !== "--"));
	const isRemote = args.has("--remote");
	const { url, serviceRoleKey } = isRemote ? getRemoteSupabaseEnv() : await getLocalSupabaseEnv();

	console.info(isRemote ? "🌐 Seeding remote Supabase..." : "🏠 Seeding local Supabase...");

	const supabase = createClient<Database>(url, serviceRoleKey, {
		auth: { persistSession: false, autoRefreshToken: false },
	});

	await waitForPostgrestReady(supabase);
	await waitForAuthAdminReady(supabase);

	const { count: existingVendorCount, error: existingVendorCountError } = await supabase
		.from("vendors")
		.select("id", { count: "exact", head: true });

	if (existingVendorCountError) {
		throw new Error(`Failed to check existing vendors: ${existingVendorCountError.message}`);
	}

	if (!isRemote && (existingVendorCount ?? 0) === 0) {
		await cleanupPartialSeedState(supabase);
	}

	if ((existingVendorCount ?? 0) > 0) {
		await assertNoDanglingVendorCategories(supabase);
		console.info("ℹ️  Seed skipped: existing data detected. Run `pnpm -C app db:reset` to recreate local data.");
		return;
	}

	const seedRng = createRng(20251221);

	const adminSpec: SeedUserSpec = {
		email: "admin@medihub.local",
		password: DEFAULT_PASSWORD,
		role: "admin",
		displayName: "메디허브 관리자",
		phone: "010-0000-0000",
	};

	const doctorSpecs: SeedUserSpec[] = Array.from({ length: 5 }).map((_, index) => ({
		email: `doctor${index + 1}@medihub.local`,
		password: DEFAULT_PASSWORD,
		role: "doctor",
		displayName: `한의사 ${index + 1}`,
		phone: `010-10${String(index + 1).padStart(2, "0")}-0000`,
		verificationStatus: "approved",
	}));

	const doctorPendingSpec: SeedUserSpec = {
		email: "doctor.pending@medihub.local",
		password: DEFAULT_PASSWORD,
		role: "doctor",
		displayName: "한의사(승인대기)",
		phone: "010-1099-0000",
		verificationStatus: "pending",
	};

	const vendorCount = 64;
	const vendorSpecs: SeedUserSpec[] = Array.from({ length: vendorCount }).map((_, index) => ({
		email: `vendor${String(index + 1).padStart(2, "0")}@medihub.local`,
		password: DEFAULT_PASSWORD,
		role: "vendor",
		displayName: `업체담당자 ${index + 1}`,
		phone: `010-20${String(index + 1).padStart(2, "0")}-0000`,
		verificationStatus: "approved",
	}));

	const vendorPendingSpec: SeedUserSpec = {
		email: "vendor.pending@medihub.local",
		password: DEFAULT_PASSWORD,
		role: "vendor",
		displayName: "업체담당자(승인대기)",
		phone: "010-2099-0000",
		verificationStatus: "pending",
	};

	const userSpecs = [adminSpec, ...doctorSpecs, doctorPendingSpec, ...vendorSpecs, vendorPendingSpec];

	console.info(`🌱 Seeding users (${userSpecs.length})...`);

	const createdUsers: Array<{ spec: SeedUserSpec; user: User }> = [];
	for (const spec of userSpecs) {
		const user = await createAuthUser(supabase, { email: spec.email, password: spec.password });
		createdUsers.push({ spec, user });
	}

	const adminUser = createdUsers.find((u) => u.spec.role === "admin")!;

	const profileRows: TablesInsert<"profiles">[] = createdUsers.map(({ spec, user }) => ({
		id: user.id,
		role: spec.role,
		status: "active",
		display_name: spec.displayName,
		phone: spec.phone,
		email: spec.email,
		avatar_url: null,
	}));

	await upsertAll(supabase, "profiles", profileRows, "id");

	const doctorVerificationRows: TablesInsert<"doctor_verifications">[] = [];
	const vendorVerificationRows: TablesInsert<"vendor_verifications">[] = [];

	for (const { spec, user } of createdUsers) {
		if (spec.role === "doctor") {
			doctorVerificationRows.push({
				user_id: user.id,
				license_no: `DOC-${String(10000 + doctorVerificationRows.length).slice(-5)}`,
				full_name: spec.displayName,
				birth_date: "1988-01-01",
				clinic_name: `한의원 ${doctorVerificationRows.length + 1}`,
				license_file_id: null,
				status: (spec.verificationStatus as TablesInsert<"doctor_verifications">["status"]) ?? "approved",
				reviewed_by: spec.verificationStatus === "approved" ? adminUser.user.id : null,
				reviewed_at: spec.verificationStatus === "approved" ? new Date().toISOString() : null,
				reject_reason: null,
			});
		}

		if (spec.role === "vendor") {
			const companyName = `가상 업체 ${vendorVerificationRows.length + 1}`;
			vendorVerificationRows.push({
				user_id: user.id,
				business_no: `123-45-${String(10000 + vendorVerificationRows.length).slice(-5)}`,
				company_name: companyName,
				contact_name: spec.displayName,
				contact_phone: spec.phone,
				contact_email: spec.email,
				business_license_file_id: null,
				status: (spec.verificationStatus as TablesInsert<"vendor_verifications">["status"]) ?? "approved",
				reviewed_by: spec.verificationStatus === "approved" ? adminUser.user.id : null,
				reviewed_at: spec.verificationStatus === "approved" ? new Date().toISOString() : null,
				reject_reason: null,
			});
		}
	}

	await upsertAll(supabase, "doctor_verifications", doctorVerificationRows, "user_id");
	await upsertAll(supabase, "vendor_verifications", vendorVerificationRows, "user_id");

	console.info("🌱 Reading active categories...");

	const { data: rootRows, error: rootError } = await supabase
		.from("categories")
		.select("id, parent_id, depth, slug, name, listing_type")
		.eq("is_active", true);

	if (rootError) {
		throw new Error(`Failed to read categories: ${rootError.message}`);
	}

	const categoriesById = new Map<string, SeedCategory>();
	for (const row of (rootRows ?? []) as Array<{
		id: string;
		parent_id: string | null;
		depth: number;
		slug: string;
		name: string;
		listing_type: "vendor" | "product" | null;
	}>) {
		const category: SeedCategory = {
			id: row.id,
			parentId: row.parent_id,
			depth: row.depth,
			slug: row.slug,
			name: row.name,
			listingType: row.listing_type === "vendor" ? "vendor" : "product",
		};
		categoriesById.set(row.id, category);
	}

	const vendorLeadCategories = [...categoriesById.values()].filter(
		(category) => category.listingType === "vendor" && category.depth >= 2,
	);
	const vendorLeadFallbacks = [...categoriesById.values()].filter(
		(category) => category.listingType === "vendor" && category.depth === 1,
	);
	const productCategories = [...categoriesById.values()].filter(
		(category) => category.listingType === "product" && category.depth >= 2,
	);
	const productFallbacks = [...categoriesById.values()].filter(
		(category) => category.listingType === "product" && category.depth === 1,
	);

	if (vendorLeadCategories.length === 0 && vendorLeadFallbacks.length === 0) {
		throw new Error("Missing active vendor categories for seed data.");
	}

	if (productCategories.length === 0 && productFallbacks.length === 0) {
		throw new Error("Missing active product categories for seed data.");
	}

	console.info("🌱 Seeding vendors / portfolios...");

	const approvedVendorUsers = createdUsers
		.filter((u) => u.spec.role === "vendor" && u.spec.verificationStatus === "approved")
		.map((u) => u.user);

	const vendorRows: TablesInsert<"vendors">[] = [];
	const vendorCategoryRows: TablesInsert<"vendor_categories">[] = [];
	const vendorPriceRows: TablesInsert<"vendor_service_prices">[] = [];
	const portfolioRows: TablesInsert<"vendor_portfolios">[] = [];
	const portfolioAssetRows: TablesInsert<"vendor_portfolio_assets">[] = [];

	type SeedVendorMeta = {
		vendorId: string;
		ownerUserId: string;
		leadCategorySlug: string;
		leadCategoryName: string;
		productCategoryId: string;
		productCategorySlug: string;
		productCategoryName: string;
	};
	const vendorsMeta: SeedVendorMeta[] = [];

	for (let index = 0; index < approvedVendorUsers.length; index += 1) {
		const owner = approvedVendorUsers[index]!;
		const leadCategory =
			vendorLeadCategories[index % vendorLeadCategories.length] ??
			vendorLeadFallbacks[index % vendorLeadFallbacks.length]!;
		const productCategory =
			productCategories[index % productCategories.length] ??
			productFallbacks[index % productFallbacks.length]!;
		const flavor = getSeedFlavor({ slug: leadCategory.slug, name: leadCategory.name });

		const prefix = pick(seedRng, NAME_PREFIX);
		const suffix = pick(seedRng, NAME_SUFFIX);
		const vendorName = `${prefix}${leadCategory.name} ${suffix}`;

		const regionPrimary = pick(seedRng, REGION_PRIMARY);
		const regionSecondary = pick(seedRng, REGION_SECONDARY);
		const price = flavor.priceRange;
		const variance = 0.75 + seedRng() * 0.5;
		const priceMin = Math.round(price.min * variance);
		const priceMax = Math.max(priceMin + 10000, Math.round(price.max * variance));

		const vendorId = crypto.randomUUID();

		vendorRows.push({
			id: vendorId,
			owner_user_id: owner.id,
			name: vendorName,
			summary: flavor.tagline,
			description: `${flavor.tagline}\n\n- 상담/견적: 빠른 회신\n- 진행 방식: 일정·산출물 공유\n- A/S: 운영 지원`,
			region_primary: regionPrimary,
			region_secondary: regionSecondary,
			price_min: priceMin,
			price_max: priceMax,
			status: "active",
		});

			vendorsMeta.push({
				vendorId,
				ownerUserId: owner.id,
				leadCategorySlug: leadCategory.slug,
				leadCategoryName: leadCategory.name,
				productCategoryId: productCategory.id,
				productCategorySlug: productCategory.slug,
				productCategoryName: productCategory.name,
			});

		const vendorCategoryIds = new Set<string>();
		const leadRoot = leadCategory.parentId ? categoriesById.get(leadCategory.parentId) : null;
		const productRoot = productCategory.parentId ? categoriesById.get(productCategory.parentId) : null;
		if (leadRoot) vendorCategoryIds.add(leadRoot.id);
		vendorCategoryIds.add(leadCategory.id);
		if (productRoot) vendorCategoryIds.add(productRoot.id);
		vendorCategoryIds.add(productCategory.id);

		for (const categoryId of vendorCategoryIds) {
			vendorCategoryRows.push({ vendor_id: vendorId, category_id: categoryId });
		}

		let priceOrder = 0;
		for (const categoryId of vendorCategoryIds) {
			const seededPrice = 20000 + ((index + priceOrder) % 8) * 10000;
			vendorPriceRows.push({
				id: crypto.randomUUID(),
				vendor_id: vendorId,
				category_id: categoryId,
				price: seededPrice,
				daily_budget_limit: null,
				status: "active",
			});
			priceOrder += 1;
		}

		const portfolioId = crypto.randomUUID();
		portfolioRows.push({
			id: portfolioId,
			vendor_id: vendorId,
			title: flavor.portfolioTitle,
			description: `${leadCategory.name} 관련 대표 사례 모음`,
			sort_order: 0,
		});

		for (let assetIndex = 0; assetIndex < 4; assetIndex += 1) {
			portfolioAssetRows.push({
				id: crypto.randomUUID(),
				portfolio_id: portfolioId,
				file_id: null,
				url: `https://picsum.photos/seed/medihub-${index + 1}-${assetIndex + 1}/1200/900`,
				sort_order: assetIndex,
			});
		}
	}

	await insertAll(supabase, "vendors", vendorRows);
		await insertAll(supabase, "vendor_categories", vendorCategoryRows);
		await insertAll(supabase, "vendor_service_prices", vendorPriceRows);
		await insertAll(supabase, "vendor_portfolios", portfolioRows);
		await insertAll(supabase, "vendor_portfolio_assets", portfolioAssetRows);

		console.info("🌱 Seeding products...");

		const productRows: TablesInsert<"products">[] = [];
		const productImageRows: TablesInsert<"product_images">[] = [];
		const productFaqRows: TablesInsert<"product_faqs">[] = [];

		for (let vendorIndex = 0; vendorIndex < vendorsMeta.length; vendorIndex += 1) {
			const vendor = vendorsMeta[vendorIndex]!;

			for (let productIndex = 0; productIndex < 2; productIndex += 1) {
				const productId = crypto.randomUUID();
				const priceBase = 150000 + ((vendorIndex + productIndex) % 10) * 50000;
				const priceType = productIndex % 2 === 0 ? "fixed" : "range";

				productRows.push({
					id: productId,
					vendor_id: vendor.vendorId,
					category_id: vendor.productCategoryId,
					title: `${vendor.productCategoryName} 패키지 ${productIndex + 1}`,
					summary: `${vendor.productCategoryName} 도입/운영을 위한 실무형 상품입니다.`,
					description: [
						`${vendor.productCategoryName} 관련 핵심 기능과 운영 지원을 함께 제공합니다.`,
						"- 상담 후 기관 상황에 맞게 범위를 조정합니다.",
						"- 설치/초기 세팅/운영 가이드를 포함합니다.",
					].join("\n"),
					price_type: priceType,
					price_min: priceBase,
					price_max: priceType === "range" ? priceBase + 200000 : priceBase,
					price_unit: "건",
					status: "active",
					sort_order: productIndex,
					published_at: new Date().toISOString(),
					view_count: 20 + ((vendorIndex + productIndex) % 15) * 7,
					inquiry_count: 3 + ((vendorIndex + productIndex) % 6),
					review_count: 0,
					rating_avg: 0,
					rejection_reason: null,
				});

				productImageRows.push({
					id: crypto.randomUUID(),
					product_id: productId,
					file_id: null,
					url: `https://picsum.photos/seed/medihub-product-${vendorIndex + 1}-${productIndex + 1}/1200/900`,
					alt_text: `${vendor.productCategoryName} 상품 이미지`,
					is_primary: true,
					sort_order: 0,
				});

				productFaqRows.push(
					{
						id: crypto.randomUUID(),
						product_id: productId,
						question: "상담 후 커스터마이징이 가능한가요?",
						answer: "네. 기관 규모와 운영 방식에 맞춰 범위를 조정해드립니다.",
						sort_order: 0,
					},
					{
						id: crypto.randomUUID(),
						product_id: productId,
						question: "설치/교육도 포함되나요?",
						answer: "초기 세팅과 기본 교육, 운영 안내까지 포함해드립니다.",
						sort_order: 1,
					},
				);
			}
		}

		await insertAll(supabase, "products", productRows);
		await insertAll(supabase, "product_images", productImageRows);
		await insertAll(supabase, "product_faqs", productFaqRows);

		console.info("🌱 Seeding leads / reviews / favorites...");

	const doctorApprovedUsers = createdUsers
		.filter((u) => u.spec.role === "doctor" && u.spec.verificationStatus === "approved")
		.map((u) => u.user);

	const leadStatuses = [
		"submitted",
		"in_progress",
		"quote_pending",
		"negotiating",
		"contracted",
		"hold",
		"closed",
	] as const satisfies ReadonlyArray<NonNullable<TablesInsert<"leads">["status"]>>;

	const leadRows: TablesInsert<"leads">[] = [];
	const leadHistoryRows: TablesInsert<"lead_status_history">[] = [];

	for (let index = 0; index < 80; index += 1) {
		const doctor = pick(seedRng, doctorApprovedUsers);
		const doctorEmail = doctor.email ?? null;
		const vendor = pick(seedRng, vendorsMeta);
		const status = pick(seedRng, leadStatuses);
		const leadId = crypto.randomUUID();

		leadRows.push({
			id: leadId,
			doctor_user_id: doctor.id,
			vendor_id: vendor.vendorId,
			service_name: `${vendor.leadCategoryName} 상담`,
			contact_name: (doctorEmail ?? doctor.id.slice(0, 8)).split("@")[0] ?? "홍길동",
			contact_phone: "010-1234-5678",
			contact_email: doctorEmail,
			preferred_channel: pick(seedRng, ["전화", "문자", "카카오톡", "이메일"] as const),
			preferred_time: pick(seedRng, ["오전", "오후", "저녁"] as const),
			content: "예산/일정/요구사항에 맞는 견적 및 진행 방식이 궁금합니다. 가능한 일정과 준비 자료 안내 부탁드립니다.",
			status,
		});

		leadHistoryRows.push({
			id: crypto.randomUUID(),
			lead_id: leadId,
			from_status: null,
			to_status: status,
			changed_by: doctor.id,
		});
	}

	await insertAll(supabase, "leads", leadRows);
	await insertAll(supabase, "lead_status_history", leadHistoryRows);

	const reviewRows: TablesInsert<"reviews">[] = [];
	for (let index = 0; index < 160; index += 1) {
		const doctor = pick(seedRng, doctorApprovedUsers);
		const vendor = pick(seedRng, vendorsMeta);
		const ratingPool = [5, 5, 5, 4, 4, 4, 3] as const;
		const rating = pick(seedRng, ratingPool);
		const template = pick(
			seedRng,
			getSeedFlavor({ slug: vendor.leadCategorySlug, name: vendor.leadCategoryName }).reviews,
		);
		const workedAt = new Date(Date.now() - Math.floor(seedRng() * 365) * 24 * 60 * 60 * 1000);

		reviewRows.push({
			id: crypto.randomUUID(),
			vendor_id: vendor.vendorId,
			doctor_user_id: doctor.id,
			lead_id: null,
			rating,
			content: template,
			amount: Math.round((seedRng() * 900 + 100) * 10000),
			worked_at: toDateString(workedAt),
			status: seedRng() < 0.92 ? "published" : "hidden",
			photo_file_ids: [],
		});
	}

	await insertAll(supabase, "reviews", reviewRows);

	const favoriteRows: TablesInsert<"favorites">[] = [];
	const recentViewRows: TablesInsert<"recent_views">[] = [];

	for (const doctor of doctorApprovedUsers) {
		const favoriteVendorIds = new Set<string>();
		while (favoriteVendorIds.size < 10) favoriteVendorIds.add(pick(seedRng, vendorsMeta).vendorId);

		for (const vendorId of favoriteVendorIds) {
			favoriteRows.push({
				user_id: doctor.id,
				vendor_id: vendorId,
			});
		}

		const recentVendorIds = new Set<string>();
		while (recentVendorIds.size < 20) recentVendorIds.add(pick(seedRng, vendorsMeta).vendorId);

		for (const vendorId of recentVendorIds) {
			recentViewRows.push({
				user_id: doctor.id,
				vendor_id: vendorId,
				view_count: 1 + Math.floor(seedRng() * 5),
				last_viewed_at: new Date(Date.now() - Math.floor(seedRng() * 14) * 24 * 60 * 60 * 1000).toISOString(),
			});
		}
	}

	await insertAll(supabase, "favorites", favoriteRows);
	await insertAll(supabase, "recent_views", recentViewRows);

	console.info("✅ Seed complete.");
	console.info("");
	console.info("🔑 Test accounts:");
	console.info(`- admin:  ${adminSpec.email} / ${DEFAULT_PASSWORD}`);
	console.info(`- doctor: ${doctorSpecs[0]?.email} / ${DEFAULT_PASSWORD}`);
	console.info(`- vendor: ${vendorSpecs[0]?.email} / ${DEFAULT_PASSWORD}`);
	console.info("");
	console.info("ℹ️ Pending accounts (admin verification UI test):");
	console.info(`- doctor: ${doctorPendingSpec.email} / ${DEFAULT_PASSWORD}`);
	console.info(`- vendor: ${vendorPendingSpec.email} / ${DEFAULT_PASSWORD}`);
}

main().catch((error) => {
	console.error("❌ db:seed failed:", error);
	process.exit(1);
});
