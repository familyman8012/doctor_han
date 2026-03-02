import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import crypto from "node:crypto";

import type { Database, TablesInsert } from "../src/lib/database.types";
import { runSupabaseCaptureStdout } from "./_supabase";

type EnvMap = Record<string, string>;

const DEFAULT_PASSWORD = "Password123!" as const;

function parseEnvOutput(output: string): EnvMap {
	const lines = output
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	const env: EnvMap = {};

	for (const line of lines) {
		if (line.startsWith("Stopped services:")) continue;

		const match = /^([A-Z0-9_]+)="(.*)"$/.exec(line);
		if (!match) continue;

		const [, key, rawValue] = match;
		env[key] = rawValue.replaceAll('\\"', '"');
	}

	return env;
}

async function getLocalSupabaseEnv(): Promise<{ url: string; serviceRoleKey: string }> {
	const statusEnv = await runSupabaseCaptureStdout([
		"status",
		"-o",
		"env",
		"--override-name",
		"api.url=NEXT_PUBLIC_SUPABASE_URL",
		"--override-name",
		"auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY",
	]);

	const env = parseEnvOutput(statusEnv);
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
	const maxAttempts = 30;
	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			const { error } = await supabase.from("categories").select("id").limit(1);
			if (!error) return;
		} catch {
			// ignore
		}
		await sleep(500);
	}

	throw new Error("Supabase API not ready after waiting.");
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

	if (error || !data.user) {
		throw new Error(`Failed to create user: ${input.email} (${error?.message ?? "unknown"})`);
	}

	return data.user;
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

type RootCategorySlug =
	| "external-decoction"
	| "medical-devices"
	| "interior"
	| "signage"
	| "emr"
	| "marketing"
	| "tax-labor"
	| "website";

type RootCategory = { id: string; slug: RootCategorySlug; name: string };

const SUB_CATEGORIES: Record<
	RootCategorySlug,
	Array<{ name: string; slug: string; sortOrder: number }>
> = {
	"external-decoction": [
		{ name: "처방 연동", slug: "external-decoction-prescription-sync", sortOrder: 10 },
		{ name: "배송/포장", slug: "external-decoction-delivery", sortOrder: 20 },
		{ name: "품질관리", slug: "external-decoction-qc", sortOrder: 30 },
		{ name: "보험/수가 대응", slug: "external-decoction-insurance", sortOrder: 40 },
		{ name: "원내-원외 운영", slug: "external-decoction-ops", sortOrder: 50 },
		{ name: "개원 패키지", slug: "external-decoction-opening", sortOrder: 60 },
	],
	"medical-devices": [
		{ name: "진료 장비", slug: "medical-devices-diagnosis", sortOrder: 10 },
		{ name: "치료 장비", slug: "medical-devices-therapy", sortOrder: 20 },
		{ name: "소모품", slug: "medical-devices-consumables", sortOrder: 30 },
		{ name: "설치/교육", slug: "medical-devices-install", sortOrder: 40 },
		{ name: "정비/A/S", slug: "medical-devices-service", sortOrder: 50 },
		{ name: "렌탈/리스", slug: "medical-devices-lease", sortOrder: 60 },
	],
	interior: [
		{ name: "인테리어 설계", slug: "interior-design", sortOrder: 10 },
		{ name: "시공/리모델링", slug: "interior-construction", sortOrder: 20 },
		{ name: "가구/집기", slug: "interior-furniture", sortOrder: 30 },
		{ name: "조명/전기", slug: "interior-lighting", sortOrder: 40 },
		{ name: "상담/견적", slug: "interior-quote", sortOrder: 50 },
		{ name: "개원 패키지", slug: "interior-opening", sortOrder: 60 },
	],
	signage: [
		{ name: "외부 간판", slug: "signage-outdoor", sortOrder: 10 },
		{ name: "실내 사인", slug: "signage-indoor", sortOrder: 20 },
		{ name: "디자인", slug: "signage-design", sortOrder: 30 },
		{ name: "시공", slug: "signage-install", sortOrder: 40 },
		{ name: "LED/조명", slug: "signage-led", sortOrder: 50 },
		{ name: "유지보수", slug: "signage-maintenance", sortOrder: 60 },
	],
	emr: [
		{ name: "전자차트(EMR)", slug: "emr-system", sortOrder: 10 },
		{ name: "예약/CRM", slug: "emr-crm", sortOrder: 20 },
		{ name: "키오스크/접수", slug: "emr-kiosk", sortOrder: 30 },
		{ name: "보험청구", slug: "emr-claim", sortOrder: 40 },
		{ name: "설치/교육", slug: "emr-install", sortOrder: 50 },
		{ name: "유지보수", slug: "emr-maintenance", sortOrder: 60 },
	],
	marketing: [
		{ name: "검색/광고", slug: "marketing-ads", sortOrder: 10 },
		{ name: "콘텐츠/블로그", slug: "marketing-content", sortOrder: 20 },
		{ name: "SNS 운영", slug: "marketing-sns", sortOrder: 30 },
		{ name: "브랜딩", slug: "marketing-branding", sortOrder: 40 },
		{ name: "영상/촬영", slug: "marketing-video", sortOrder: 50 },
		{ name: "리뷰/평판", slug: "marketing-reputation", sortOrder: 60 },
	],
	"tax-labor": [
		{ name: "기장/신고", slug: "tax-labor-tax", sortOrder: 10 },
		{ name: "급여/4대보험", slug: "tax-labor-payroll", sortOrder: 20 },
		{ name: "노무", slug: "tax-labor-hr", sortOrder: 30 },
		{ name: "세무 컨설팅", slug: "tax-labor-consulting", sortOrder: 40 },
		{ name: "개원 세팅", slug: "tax-labor-opening", sortOrder: 50 },
		{ name: "정기 리포트", slug: "tax-labor-report", sortOrder: 60 },
	],
	website: [
		{ name: "홈페이지 제작", slug: "website-build", sortOrder: 10 },
		{ name: "예약/상담 연동", slug: "website-reservation", sortOrder: 20 },
		{ name: "SEO", slug: "website-seo", sortOrder: 30 },
		{ name: "유지보수", slug: "website-maintenance", sortOrder: 40 },
		{ name: "랜딩/이벤트", slug: "website-landing", sortOrder: 50 },
		{ name: "브랜딩 디자인", slug: "website-branding", sortOrder: 60 },
	],
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

const VENDOR_TAGLINES: Record<RootCategorySlug, string> = {
	"external-decoction": "원외탕전/처방 연동부터 배송까지 원스톱 지원",
	"medical-devices": "진료·치료 장비 공급/설치/교육/정비까지 지원",
	interior: "병·의원 전문 인테리어, 설계부터 시공까지",
	signage: "간판/실내사인 디자인·제작·시공 A/S",
	emr: "전자차트/예약/CRM 연동, 설치부터 교육까지",
	marketing: "병·의원 전문 마케팅, 성과 기반 리포트 제공",
	"tax-labor": "세무·노무/급여/4대보험, 운영 리포트 제공",
	website: "홈페이지 제작부터 SEO/유지보수까지",
};

const VENDOR_PRICE_RANGES: Record<RootCategorySlug, { min: number; max: number }> = {
	"external-decoction": { min: 200000, max: 1200000 },
	"medical-devices": { min: 2000000, max: 18000000 },
	interior: { min: 8000000, max: 32000000 },
	signage: { min: 600000, max: 6500000 },
	emr: { min: 900000, max: 5500000 },
	marketing: { min: 300000, max: 2200000 },
	"tax-labor": { min: 200000, max: 900000 },
	website: { min: 1500000, max: 7000000 },
};

const REVIEW_TEMPLATES: Record<RootCategorySlug, readonly string[]> = {
	"external-decoction": [
		"처방 연동이 안정적이고 배송이 정확합니다. 응대도 빠른 편이에요.",
		"포장 퀄리티가 좋아 환자 만족도가 올라갔습니다.",
		"문의 대응이 친절했고, 운영 프로세스가 체계적입니다.",
	],
	"medical-devices": [
		"설치와 교육이 꼼꼼해서 바로 진료에 적용할 수 있었습니다.",
		"A/S 응대가 빨라서 운영에 도움이 됐습니다.",
		"장비 제안이 합리적이고 설명이 명확했습니다.",
	],
	interior: [
		"동선 설계가 좋아 진료 효율이 개선됐습니다. 결과물도 만족합니다.",
		"일정 관리가 체계적이고 커뮤니케이션이 빠릅니다.",
		"마감 퀄리티가 좋고 사후 대응도 괜찮았습니다.",
	],
	signage: [
		"디자인 시안이 빠르게 나왔고 시공도 깔끔했습니다.",
		"야간 시인성이 좋아졌고, 유지보수 안내도 친절했어요.",
		"견적이 명확하고 진행 과정이 투명했습니다.",
	],
	emr: [
		"직원 교육이 잘 되어 적응이 빨랐습니다.",
		"예약/CRM 연동이 편리하고 업무가 줄었습니다.",
		"유지보수 응답이 빨라 안정적으로 운영 중입니다.",
	],
	marketing: [
		"리포트가 명확하고 커뮤니케이션이 빠릅니다.",
		"콘텐츠 방향성이 좋아 상담 전환이 늘었습니다.",
		"광고 효율이 안정적으로 개선됐습니다.",
	],
	"tax-labor": [
		"기장/급여 처리가 깔끔하고 문의 대응이 빠릅니다.",
		"운영 리포트가 유용했고 세무 일정 관리가 편했습니다.",
		"노무 이슈 대응이 빠르고 설명이 이해하기 쉬웠습니다.",
	],
	website: [
		"반응형 디자인이 깔끔하고 업데이트가 빠릅니다.",
		"예약/상담 연동이 매끄러워 문의가 늘었습니다.",
		"SEO 기본 세팅이 잘 되어 검색 노출이 좋아졌습니다.",
	],
};

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

	const { count: existingVendorCount, error: existingVendorCountError } = await supabase
		.from("vendors")
		.select("id", { count: "exact", head: true });

	if (existingVendorCountError) {
		throw new Error(`Failed to check existing vendors: ${existingVendorCountError.message}`);
	}

	if ((existingVendorCount ?? 0) > 0) {
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

	await insertAll(supabase, "profiles", profileRows);

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

	await insertAll(supabase, "doctor_verifications", doctorVerificationRows);
	await insertAll(supabase, "vendor_verifications", vendorVerificationRows);

	console.info("🌱 Seeding categories (sub categories)...");

	const { data: rootRows, error: rootError } = await supabase
		.from("categories")
		.select("id, slug, name")
		.eq("depth", 1)
		.eq("is_active", true);

	if (rootError) {
		throw new Error(`Failed to read root categories: ${rootError.message}`);
	}

	const rootCategories = (rootRows ?? []) as Array<{ id: string; slug: RootCategorySlug; name: string }>;
	const rootBySlug = new Map<RootCategorySlug, RootCategory>();

	for (const row of rootCategories) {
		rootBySlug.set(row.slug, row);
	}

	for (const slug of Object.keys(SUB_CATEGORIES) as RootCategorySlug[]) {
		if (!rootBySlug.get(slug)) {
			throw new Error(`Missing root category slug: ${slug}`);
		}
	}

	const subCategoryRows: TablesInsert<"categories">[] = [];
	for (const [rootSlug, subList] of Object.entries(SUB_CATEGORIES) as Array<[RootCategorySlug, typeof SUB_CATEGORIES[RootCategorySlug]]>) {
		const root = rootBySlug.get(rootSlug)!;
		for (const sub of subList) {
			subCategoryRows.push({
				id: crypto.randomUUID(),
				parent_id: root.id,
				depth: 2,
				name: sub.name,
				slug: sub.slug,
				sort_order: sub.sortOrder,
				is_active: true,
			});
		}
	}

	await insertAll(supabase, "categories", subCategoryRows);

	const { data: allCategories, error: allCategoryError } = await supabase
		.from("categories")
		.select("id, parent_id, depth, slug, name")
		.eq("is_active", true);

	if (allCategoryError) {
		throw new Error(`Failed to read categories: ${allCategoryError.message}`);
	}

	const categoriesBySlug = new Map<string, { id: string; parentId: string | null; depth: number; slug: string; name: string }>();
	for (const row of allCategories ?? []) {
		categoriesBySlug.set(row.slug, {
			id: row.id,
			parentId: row.parent_id,
			depth: row.depth,
			slug: row.slug,
			name: row.name,
		});
	}

	console.info("🌱 Seeding vendors / portfolios...");

	const approvedVendorUsers = createdUsers
		.filter((u) => u.spec.role === "vendor" && u.spec.verificationStatus === "approved")
		.map((u) => u.user);

	const rootSlugs = Object.keys(SUB_CATEGORIES) as RootCategorySlug[];
	const vendorRows: TablesInsert<"vendors">[] = [];
	const vendorCategoryRows: TablesInsert<"vendor_categories">[] = [];
	const portfolioRows: TablesInsert<"vendor_portfolios">[] = [];
	const portfolioAssetRows: TablesInsert<"vendor_portfolio_assets">[] = [];

	type SeedVendorMeta = { vendorId: string; ownerUserId: string; rootSlug: RootCategorySlug; subSlug: string };
	const vendorsMeta: SeedVendorMeta[] = [];

	for (let index = 0; index < approvedVendorUsers.length; index += 1) {
		const owner = approvedVendorUsers[index]!;
		const rootSlug = rootSlugs[index % rootSlugs.length]!;
		const root = rootBySlug.get(rootSlug)!;
		const subSlug = pick(seedRng, SUB_CATEGORIES[rootSlug]).slug;

		const prefix = pick(seedRng, NAME_PREFIX);
		const suffix = pick(seedRng, NAME_SUFFIX);
		const vendorName = `${prefix}${root.name} ${suffix}`;

		const regionPrimary = pick(seedRng, REGION_PRIMARY);
		const regionSecondary = pick(seedRng, REGION_SECONDARY);
		const price = VENDOR_PRICE_RANGES[rootSlug];
		const variance = 0.75 + seedRng() * 0.5;
		const priceMin = Math.round(price.min * variance);
		const priceMax = Math.max(priceMin + 10000, Math.round(price.max * variance));

		const vendorId = crypto.randomUUID();

		vendorRows.push({
			id: vendorId,
			owner_user_id: owner.id,
			name: vendorName,
			summary: VENDOR_TAGLINES[rootSlug],
			description: `${VENDOR_TAGLINES[rootSlug]}\n\n- 상담/견적: 빠른 회신\n- 진행 방식: 일정·산출물 공유\n- A/S: 운영 지원`,
			region_primary: regionPrimary,
			region_secondary: regionSecondary,
			price_min: priceMin,
			price_max: priceMax,
			status: "active",
		});

		vendorsMeta.push({ vendorId, ownerUserId: owner.id, rootSlug, subSlug });

		const subCategory = categoriesBySlug.get(subSlug);
		if (!subCategory) throw new Error(`Missing subcategory slug: ${subSlug}`);

		vendorCategoryRows.push({ vendor_id: vendorId, category_id: root.id });
		vendorCategoryRows.push({ vendor_id: vendorId, category_id: subCategory.id });

		const portfolioId = crypto.randomUUID();
		const portfolioTitle = rootSlug === "interior" ? "시공 사례" : rootSlug === "signage" ? "간판/사인 사례" : "프로젝트 사례";
		portfolioRows.push({
			id: portfolioId,
			vendor_id: vendorId,
			title: portfolioTitle,
			description: `${root.name} 관련 대표 사례 모음`,
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
	await insertAll(supabase, "vendor_portfolios", portfolioRows);
	await insertAll(supabase, "vendor_portfolio_assets", portfolioAssetRows);

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
			service_name: `${rootBySlug.get(vendor.rootSlug)!.name} 상담`,
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
		const template = pick(seedRng, REVIEW_TEMPLATES[vendor.rootSlug]);
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
