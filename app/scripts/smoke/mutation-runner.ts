/**
 * Mutation Smoke Test Runner
 *
 * Tests all POST/PATCH/DELETE API endpoints with minimal payloads.
 * Success criteria: 200/201 or 400 (Zod validation) = OK, 500 = BUG.
 *
 * Usage: cd app && pnpm tsx scripts/smoke/mutation-runner.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ── Config ──

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const REPORT_DIR = join(__dirname, "..", "..", "doc");

const ACCOUNTS = {
    admin: { email: "admin@medihub.local", password: "Password123!" },
    doctor: { email: "doctor1@medihub.local", password: "Password123!" },
    vendor: { email: "vendor01@medihub.local", password: "Password123!" },
} as const;

type Role = keyof typeof ACCOUNTS;

// ── Types ──

interface TestResult {
    endpoint: string;
    method: string;
    role: Role;
    status: number;
    ok: boolean;
    error?: string;
    body?: string;
}

// ── Auth ──

import { createClient } from "@supabase/supabase-js";

// Store full session cookie strings per role
const sessionCookies: Record<Role, string> = {} as any;

async function authenticate(role: Role): Promise<void> {
    const { email, password } = ACCOUNTS[role];
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
        throw new Error(`Auth failed for ${role} (${email}): ${error?.message ?? "no session"}`);
    }

    // Build cookie value from full session object (matches what @supabase/ssr expects)
    const sessionStr = JSON.stringify(data.session);
    const base64Val = `base64-${Buffer.from(sessionStr).toString("base64")}`;

    // Cookie name: sb-<ref>-auth-token where ref = hostname.split('.')[0]
    const ref = new URL(SUPABASE_URL).hostname.split(".")[0];
    sessionCookies[role] = `sb-${ref}-auth-token=${base64Val}`;
}

// ── API Call Helper ──

async function callApi(
    method: string,
    path: string,
    role: Role,
    body?: Record<string, unknown>,
): Promise<{ status: number; body: string }> {
    const url = `${BASE_URL}${path}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Cookie: sessionCookies[role],
    };

    try {
        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            redirect: "manual",
        });

        const text = await res.text().catch(() => "(no body)");
        return { status: res.status, body: text };
    } catch (err) {
        return {
            status: 0,
            body: `FETCH_ERROR: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}

// ── Test Definitions ──

interface MutationTest {
    role: Role;
    method: string;
    path: string;
    body?: Record<string, unknown>;
    /** Dynamic path resolver - called with fetched IDs */
    resolvePath?: (ids: DynamicIds) => string;
    /** Skip if no dynamic ID available */
    requiresId?: keyof DynamicIds;
    label: string;
}

interface DynamicIds {
    vendorId: string;
    productId: string;
    leadId: string;
    categoryId: string;
    reviewId: string;
    bidProjectId: string;
    supportTicketId: string;
    helpCategoryId: string;
    helpArticleId: string;
    verificationId: string;
    reportId: string;
    priceId: string;
    portfolioId: string;
    subscriptionId: string;
    membershipId: string;
    campaignId: string;
    settlementId: string;
    refundId: string;
    sanctionId: string;
    bannerId: string;
    priorityAdId: string;
}

const DUMMY_UUID = "00000000-0000-0000-0000-000000000099";

function buildTests(): MutationTest[] {
    return [
        // ── Leads ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/leads",
            body: {
                vendorId: DUMMY_UUID, // will be replaced dynamically
                categoryIds: [DUMMY_UUID],
                contactName: "스모크테스트",
                contactPhone: "010-0000-0000",
                content: "스모크 테스트 문의입니다.",
            },
            label: "리드 생성",
        },
        {
            role: "doctor",
            method: "PATCH",
            path: `/api/leads/${DUMMY_UUID}/status`,
            resolvePath: (ids) => `/api/leads/${ids.leadId}/status`,
            requiresId: "leadId",
            body: { status: "canceled" },
            label: "리드 상태변경",
        },
        {
            role: "doctor",
            method: "POST",
            path: `/api/leads/${DUMMY_UUID}/messages`,
            resolvePath: (ids) => `/api/leads/${ids.leadId}/messages`,
            requiresId: "leadId",
            body: { content: "스모크 테스트 메시지" },
            label: "리드 메시지 전송",
        },
        {
            role: "doctor",
            method: "PATCH",
            path: `/api/leads/${DUMMY_UUID}/messages/read`,
            resolvePath: (ids) => `/api/leads/${ids.leadId}/messages/read`,
            requiresId: "leadId",
            body: {},
            label: "리드 메시지 읽음",
        },
        {
            role: "doctor",
            method: "POST",
            path: `/api/leads/${DUMMY_UUID}/report`,
            resolvePath: (ids) => `/api/leads/${ids.leadId}/report`,
            requiresId: "leadId",
            body: { reason: "스모크 테스트 신고" },
            label: "리드 신고",
        },

        // ── Reviews ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/reviews",
            body: {
                vendorId: DUMMY_UUID,
                leadId: DUMMY_UUID,
                rating: 5,
                content: "스모크 테스트 리뷰",
            },
            label: "리뷰 작성",
        },
        {
            role: "doctor",
            method: "PATCH",
            path: `/api/reviews/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/reviews/${ids.reviewId}`,
            requiresId: "reviewId",
            body: { content: "수정된 리뷰" },
            label: "리뷰 수정",
        },
        {
            role: "doctor",
            method: "DELETE",
            path: `/api/reviews/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/reviews/${ids.reviewId}`,
            requiresId: "reviewId",
            label: "리뷰 삭제",
        },
        {
            role: "doctor",
            method: "POST",
            path: `/api/reviews/${DUMMY_UUID}/report`,
            resolvePath: (ids) => `/api/reviews/${ids.reviewId}`,
            requiresId: "reviewId",
            body: { reason: "스모크 테스트 신고", type: "spam" },
            label: "리뷰 신고",
        },
        {
            role: "vendor",
            method: "POST",
            path: `/api/reviews/${DUMMY_UUID}/reply`,
            resolvePath: (ids) => `/api/reviews/${ids.reviewId}/reply`,
            requiresId: "reviewId",
            body: { content: "답변 테스트" },
            label: "리뷰 답변 작성",
        },

        // ── Favorites ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/favorites/toggle",
            body: { vendorId: DUMMY_UUID },
            label: "찜 토글 (업체)",
        },
        {
            role: "doctor",
            method: "POST",
            path: "/api/product-favorites/toggle",
            body: { productId: DUMMY_UUID },
            label: "찜 토글 (상품)",
        },

        // ── Vendor Profile ──
        {
            role: "vendor",
            method: "PATCH",
            path: "/api/vendors/me",
            body: { summary: "스모크 테스트 업체 소개" },
            label: "업체 프로필 수정",
        },

        // ── Vendor Products ──
        {
            role: "vendor",
            method: "POST",
            path: "/api/vendors/me/products",
            body: {
                categoryId: DUMMY_UUID,
                title: "스모크 테스트 상품",
            },
            label: "상품 생성",
        },
        {
            role: "vendor",
            method: "PATCH",
            path: `/api/vendors/me/products/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/vendors/me/products/${ids.productId}`,
            requiresId: "productId",
            body: { title: "수정된 상품명" },
            label: "상품 수정",
        },

        // ── Vendor Portfolio ──
        {
            role: "vendor",
            method: "POST",
            path: "/api/vendors/me/portfolio",
            body: { title: "스모크 테스트 포트폴리오" },
            label: "포트폴리오 생성",
        },
        {
            role: "vendor",
            method: "PATCH",
            path: `/api/vendors/me/portfolio/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/vendors/me/portfolio/${ids.portfolioId}`,
            requiresId: "portfolioId",
            body: { title: "수정된 포트폴리오" },
            label: "포트폴리오 수정",
        },
        {
            role: "vendor",
            method: "DELETE",
            path: `/api/vendors/me/portfolio/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/vendors/me/portfolio/${ids.portfolioId}`,
            requiresId: "portfolioId",
            label: "포트폴리오 삭제",
        },

        // ── Vendor Prices ──
        {
            role: "vendor",
            method: "POST",
            path: "/api/vendors/me/prices",
            body: {
                name: "스모크 테스트 가격",
                price: 100000,
                unit: "건",
            },
            label: "가격 생성",
        },
        {
            role: "vendor",
            method: "PATCH",
            path: `/api/vendors/me/prices/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/vendors/me/prices/${ids.priceId}`,
            requiresId: "priceId",
            body: { name: "수정된 가격" },
            label: "가격 수정",
        },

        // ── Support Tickets ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/support/tickets",
            body: {
                categoryId: DUMMY_UUID,
                title: "스모크 테스트 티켓",
                content: "테스트 문의 내용입니다.",
            },
            label: "고객지원 티켓 생성",
        },
        {
            role: "doctor",
            method: "POST",
            path: `/api/support/tickets/${DUMMY_UUID}/messages`,
            resolvePath: (ids) => `/api/support/tickets/${ids.supportTicketId}/messages`,
            requiresId: "supportTicketId",
            body: { content: "추가 메시지 테스트" },
            label: "고객지원 메시지 전송",
        },
        {
            role: "doctor",
            method: "POST",
            path: `/api/support/tickets/${DUMMY_UUID}/reopen`,
            resolvePath: (ids) => `/api/support/tickets/${ids.supportTicketId}/reopen`,
            requiresId: "supportTicketId",
            body: {},
            label: "고객지원 티켓 재오픈",
        },

        // ── Bid Projects ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/bid/projects",
            body: {
                title: "스모크 테스트 입찰",
                location: "서울 강남구",
                budgetMin: 1000000,
                budgetMax: 5000000,
            },
            label: "입찰 프로젝트 생성",
        },
        {
            role: "vendor",
            method: "POST",
            path: `/api/bid/projects/${DUMMY_UUID}/responses`,
            resolvePath: (ids) => `/api/bid/projects/${ids.bidProjectId}/responses`,
            requiresId: "bidProjectId",
            body: {
                price: 3000000,
                proposal: "스모크 테스트 입찰 응답",
            },
            label: "입찰 응답 제출",
        },
        {
            role: "doctor",
            method: "PATCH",
            path: `/api/bid/projects/${DUMMY_UUID}/cancel`,
            resolvePath: (ids) => `/api/bid/projects/${ids.bidProjectId}/cancel`,
            requiresId: "bidProjectId",
            body: {},
            label: "입찰 프로젝트 취소",
        },

        // ── Credits ──
        {
            role: "vendor",
            method: "POST",
            path: "/api/credits/charge",
            body: { packageId: DUMMY_UUID },
            label: "크레딧 충전 준비",
        },
        {
            role: "vendor",
            method: "PATCH",
            path: "/api/credits/auto-charge",
            body: { enabled: false },
            label: "자동충전 설정",
        },

        // ── Payments ──
        {
            role: "vendor",
            method: "POST",
            path: "/api/payments/confirm",
            body: {
                paymentKey: "test_payment_key",
                orderId: "test_order_id",
                amount: 10000,
            },
            label: "결제 확인",
        },

        // ── Notification Settings ──
        {
            role: "doctor",
            method: "PATCH",
            path: "/api/notification-settings",
            body: { emailEnabled: false },
            label: "알림 설정 변경",
        },

        // ── Profile ──
        {
            role: "doctor",
            method: "PATCH",
            path: "/api/profile",
            body: { displayName: "스모크테스트닥터" },
            label: "프로필 수정",
        },

        // ── Onboarding ──
        {
            role: "doctor",
            method: "PATCH",
            path: "/api/onboarding",
            body: { step: "completed" },
            label: "온보딩 상태 변경",
        },

        // ── Geocode ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/geocode",
            body: { address: "서울 강남구 테헤란로 1" },
            label: "지오코딩",
        },

        // ── File Upload ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/files/signed-upload",
            body: {
                fileName: "test.png",
                contentType: "image/png",
                bucket: "uploads",
            },
            label: "파일 업로드 URL 발급",
        },

        // ── Product Recent Views ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/product-recent-views",
            body: { productId: DUMMY_UUID },
            label: "상품 조회 기록",
        },

        // ── Vendor Subscriptions ──
        {
            role: "vendor",
            method: "POST",
            path: "/api/vendors/me/subscriptions",
            body: { planId: DUMMY_UUID },
            label: "구독 생성",
        },

        // ── Vendor Membership ──
        {
            role: "vendor",
            method: "POST",
            path: "/api/vendors/me/membership",
            body: { planId: DUMMY_UUID },
            label: "멤버십 가입",
        },

        // ── Ads ──
        {
            role: "vendor",
            method: "POST",
            path: "/api/ads/priority/purchase",
            body: { categoryId: DUMMY_UUID, months: 1 },
            label: "우선노출 광고 구매",
        },
        {
            role: "doctor",
            method: "POST",
            path: `/api/ads/banners/${DUMMY_UUID}/click`,
            resolvePath: (ids) => `/api/ads/banners/${ids.bannerId}/click`,
            requiresId: "bannerId",
            body: {},
            label: "배너 클릭 추적",
        },

        // ── Refunds ──
        {
            role: "vendor",
            method: "POST",
            path: "/api/refunds",
            body: {
                paymentId: DUMMY_UUID,
                reason: "스모크 테스트 환불",
            },
            label: "환불 요청",
        },

        // ── Admin: Categories ──
        {
            role: "admin",
            method: "POST",
            path: "/api/admin/categories",
            body: {
                name: "스모크테스트카테고리",
                slug: "smoke-test-cat",
            },
            label: "관리자 카테고리 생성",
        },
        {
            role: "admin",
            method: "PATCH",
            path: `/api/admin/categories/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/admin/categories/${ids.categoryId}`,
            requiresId: "categoryId",
            body: { name: "수정된 카테고리" },
            label: "관리자 카테고리 수정",
        },

        // ── Admin: Verifications ──
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/verifications/${DUMMY_UUID}/reject`,
            resolvePath: (ids) => `/api/admin/verifications/${ids.verificationId}/reject`,
            requiresId: "verificationId",
            body: { reason: "스모크 테스트 반려" },
            label: "관리자 인증 반려",
        },

        // ── Admin: Help Center ──
        {
            role: "admin",
            method: "POST",
            path: "/api/admin/help-center/categories",
            body: { name: "스모크테스트도움말", slug: "smoke-help", sortOrder: 999 },
            label: "관리자 도움말 카테고리 생성",
        },
        {
            role: "admin",
            method: "POST",
            path: "/api/admin/help-center/articles",
            body: {
                categoryId: DUMMY_UUID,
                title: "스모크 테스트 도움말",
                content: "테스트 내용",
                type: "faq",
            },
            label: "관리자 도움말 글 생성",
        },

        // ── Admin: Reviews ──
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/reviews/${DUMMY_UUID}/hide`,
            resolvePath: (ids) => `/api/admin/reviews/${ids.reviewId}/hide`,
            requiresId: "reviewId",
            body: {},
            label: "관리자 리뷰 숨김",
        },
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/reviews/${DUMMY_UUID}/unhide`,
            resolvePath: (ids) => `/api/admin/reviews/${ids.reviewId}/unhide`,
            requiresId: "reviewId",
            body: {},
            label: "관리자 리뷰 복원",
        },

        // ── Admin: Reports ──
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/reports/${DUMMY_UUID}/review`,
            resolvePath: (ids) => `/api/admin/reports/${ids.reportId}/review`,
            requiresId: "reportId",
            body: {},
            label: "관리자 신고 검토",
        },
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/reports/${DUMMY_UUID}/dismiss`,
            resolvePath: (ids) => `/api/admin/reports/${ids.reportId}/dismiss`,
            requiresId: "reportId",
            body: { reason: "스모크 테스트 기각" },
            label: "관리자 신고 기각",
        },

        // ── Admin: Support ──
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/support/tickets/${DUMMY_UUID}/messages`,
            resolvePath: (ids) => `/api/admin/support/tickets/${ids.supportTicketId}/messages`,
            requiresId: "supportTicketId",
            body: { content: "관리자 답변 테스트" },
            label: "관리자 티켓 답변",
        },
        {
            role: "admin",
            method: "PATCH",
            path: `/api/admin/support/tickets/${DUMMY_UUID}/status`,
            resolvePath: (ids) => `/api/admin/support/tickets/${ids.supportTicketId}/status`,
            requiresId: "supportTicketId",
            body: { status: "in_progress" },
            label: "관리자 티켓 상태 변경",
        },

        // ── Admin: Bid Projects ──
        {
            role: "admin",
            method: "PATCH",
            path: `/api/admin/bid-projects/${DUMMY_UUID}/status`,
            resolvePath: (ids) => `/api/admin/bid-projects/${ids.bidProjectId}/status`,
            requiresId: "bidProjectId",
            body: { status: "open" },
            label: "관리자 입찰 상태 변경",
        },

        // ── Admin: Settlements ──
        {
            role: "admin",
            method: "POST",
            path: "/api/admin/settlements/generate",
            body: {},
            label: "관리자 정산 생성",
        },

        // ── Admin: Ads Campaigns ──
        {
            role: "admin",
            method: "POST",
            path: "/api/admin/ads/campaigns",
            body: {
                name: "스모크 테스트 캠페인",
                type: "banner",
                startDate: "2026-04-01",
                endDate: "2026-04-30",
            },
            label: "관리자 광고 캠페인 생성",
        },

        // ── Admin: Credits ──
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/credits/${DUMMY_UUID}/adjust`,
            body: { amount: 100, reason: "스모크 테스트" },
            label: "관리자 크레딧 조정",
        },

        // ── Admin: Lead Reports ──
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/lead-reports/${DUMMY_UUID}/review`,
            body: { action: "dismiss", reason: "스모크 테스트" },
            label: "관리자 리드신고 검토",
        },

        // ── Admin: Products ──
        {
            role: "admin",
            method: "PATCH",
            path: `/api/admin/products/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/admin/products/${ids.productId}`,
            requiresId: "productId",
            body: { status: "published" },
            label: "관리자 상품 상태 변경",
        },
    ];
}

// ── Dynamic ID Fetcher ──

async function fetchDynamicIds(): Promise<DynamicIds> {
    const ids: DynamicIds = {
        vendorId: "",
        productId: "",
        leadId: "",
        categoryId: "",
        reviewId: "",
        bidProjectId: "",
        supportTicketId: "",
        helpCategoryId: "",
        helpArticleId: "",
        verificationId: "",
        reportId: "",
        priceId: "",
        portfolioId: "",
        subscriptionId: "",
        membershipId: "",
        campaignId: "",
        settlementId: "",
        refundId: "",
        sanctionId: "",
        bannerId: "",
        priorityAdId: "",
    };

    const fetchFirst = async (path: string, role: Role, idField = "id"): Promise<string> => {
        try {
            const { status, body } = await callApi("GET", path, role);
            if (status !== 200) return "";
            const json = JSON.parse(body);
            const items = json.data?.items ?? json.data?.rows ?? json.data ?? [];
            if (Array.isArray(items) && items.length > 0) {
                return items[0][idField] ?? "";
            }
            return "";
        } catch {
            return "";
        }
    };

    // Doctor context
    ids.vendorId = await fetchFirst("/api/vendors?pageSize=1", "doctor");
    ids.productId = await fetchFirst("/api/products?pageSize=1", "doctor");
    ids.leadId = await fetchFirst("/api/leads?pageSize=1", "doctor");
    ids.categoryId = await fetchFirst("/api/categories?pageSize=1", "doctor");
    ids.reviewId = await fetchFirst("/api/reviews?pageSize=1", "doctor");
    ids.bidProjectId = await fetchFirst("/api/bid/projects?pageSize=1", "doctor");

    // Vendor context
    if (!ids.productId) {
        ids.productId = await fetchFirst("/api/vendors/me/products?pageSize=1", "vendor");
    }
    ids.priceId = await fetchFirst("/api/vendors/me/prices?pageSize=1", "vendor");
    ids.portfolioId = await fetchFirst("/api/vendors/me/portfolio?pageSize=1", "vendor");
    ids.subscriptionId = await fetchFirst("/api/vendors/me/subscriptions?pageSize=1", "vendor");

    // Support
    ids.supportTicketId = await fetchFirst("/api/support/tickets?pageSize=1", "doctor");

    // Admin context
    ids.helpCategoryId = await fetchFirst("/api/admin/help-center/categories?pageSize=1", "admin");
    ids.helpArticleId = await fetchFirst("/api/admin/help-center/articles?pageSize=1", "admin");
    ids.verificationId = await fetchFirst("/api/admin/verifications?pageSize=1&status=pending", "admin");
    ids.reportId = await fetchFirst("/api/admin/reports?pageSize=1", "admin");
    ids.campaignId = await fetchFirst("/api/admin/ads/campaigns?pageSize=1", "admin");
    ids.settlementId = await fetchFirst("/api/admin/settlements?pageSize=1", "admin");
    ids.refundId = await fetchFirst("/api/admin/refunds?pageSize=1", "admin");
    ids.sanctionId = await fetchFirst("/api/admin/sanctions?pageSize=1", "admin");
    ids.bannerId = await fetchFirst("/api/ads/banners?pageSize=1", "doctor");

    return ids;
}

// ── Main ──

async function main() {
    console.log("🚀 Mutation Smoke Test Runner");
    console.log(`   Target: ${BASE_URL}`);
    console.log(`   Supabase: ${SUPABASE_URL}`);
    console.log(`   Time: ${new Date().toISOString()}\n`);

    // 1. Authenticate all roles
    console.log("🔑 Authenticating...");
    for (const role of ["admin", "doctor", "vendor"] as Role[]) {
        try {
            await authenticate(role);
            console.log(`   ✅ ${role}: authenticated`);
        } catch (err) {
            console.error(`   ❌ ${role}: ${err instanceof Error ? err.message : err}`);
            process.exit(1);
        }
    }

    // 2. Fetch dynamic IDs
    console.log("\n📋 Fetching dynamic IDs...");
    const ids = await fetchDynamicIds();
    for (const [key, val] of Object.entries(ids)) {
        if (val) console.log(`   ${key}: ${val}`);
        else console.log(`   ${key}: (not found)`);
    }

    // 3. Run mutation tests
    const tests = buildTests();
    console.log(`\n🧪 Running ${tests.length} mutation tests...\n`);

    const results: TestResult[] = [];
    const bugs: TestResult[] = [];

    for (const test of tests) {
        // Resolve dynamic path
        let path = test.path;
        if (test.resolvePath && test.requiresId) {
            const idValue = ids[test.requiresId];
            if (!idValue) {
                console.log(`   ⏭️  [${test.role}] ${test.method} ${test.path} — SKIP (no ${test.requiresId})`);
                results.push({
                    endpoint: test.path,
                    method: test.method,
                    role: test.role,
                    status: -1,
                    ok: true,
                    error: `SKIPPED: no ${test.requiresId}`,
                });
                continue;
            }
            path = test.resolvePath(ids);
        }

        // Also substitute IDs in body
        let body = test.body;
        if (body) {
            body = { ...body };
            if (body.vendorId === DUMMY_UUID && ids.vendorId) body.vendorId = ids.vendorId;
            if (body.productId === DUMMY_UUID && ids.productId) body.productId = ids.productId;
            if (body.leadId === DUMMY_UUID && ids.leadId) body.leadId = ids.leadId;
            if (body.categoryId === DUMMY_UUID && ids.categoryId) body.categoryId = ids.categoryId;
            if (body.packageId === DUMMY_UUID && ids.categoryId) body.packageId = ids.categoryId; // Just use any valid UUID
            if (body.paymentId === DUMMY_UUID) body.paymentId = DUMMY_UUID; // Keep dummy, expect 4xx
            if (Array.isArray(body.categoryIds)) {
                body.categoryIds = body.categoryIds.map((id: unknown) =>
                    id === DUMMY_UUID && ids.categoryId ? ids.categoryId : id,
                );
            }
        }

        const { status, body: responseBody } = await callApi(test.method, path, test.role, body);

        const is500 = status >= 500;
        const isOk = !is500 && status !== 0;

        const result: TestResult = {
            endpoint: path,
            method: test.method,
            role: test.role,
            status,
            ok: isOk,
        };

        if (!isOk) {
            result.error = responseBody?.slice(0, 300);
            result.body = responseBody?.slice(0, 500);
            bugs.push(result);
        }

        results.push(result);

        const icon = is500 ? "❌" : status >= 400 ? "⚠️" : "✅";
        console.log(
            `   ${icon} [${test.role}] ${test.method} ${path} → ${status} ${test.label}${
                is500 ? ` — ${responseBody?.slice(0, 100)}` : ""
            }`,
        );
    }

    // 4. Generate report
    generateMutationReport(results, bugs);

    // 5. Summary
    console.log(`\n${"═".repeat(60)}`);
    console.log(`📊 Results: ${results.length} tested, ${bugs.length} bugs (500s)`);
    console.log(`   ✅ OK (2xx): ${results.filter((r) => r.status >= 200 && r.status < 300).length}`);
    console.log(`   ⚠️  4xx: ${results.filter((r) => r.status >= 400 && r.status < 500).length}`);
    console.log(`   ❌ 5xx: ${results.filter((r) => r.status >= 500).length}`);
    console.log(`   ⏭️  Skipped: ${results.filter((r) => r.status === -1).length}`);
    console.log(`   💥 Fetch errors: ${results.filter((r) => r.status === 0).length}`);
    console.log(`${"═".repeat(60)}`);

    process.exit(bugs.length > 0 ? 1 : 0);
}

function generateMutationReport(results: TestResult[], bugs: TestResult[]): void {
    const lines: string[] = [
        "# Mutation Smoke Test Report",
        "",
        `**Date**: ${new Date().toISOString().slice(0, 19)}`,
        `**Total tested**: ${results.length}`,
        `**Bugs (5xx)**: ${bugs.length}`,
        `**OK (2xx)**: ${results.filter((r) => r.status >= 200 && r.status < 300).length}`,
        `**Validation (4xx)**: ${results.filter((r) => r.status >= 400 && r.status < 500).length}`,
        `**Skipped**: ${results.filter((r) => r.status === -1).length}`,
        "",
        "---",
        "",
    ];

    if (bugs.length > 0) {
        lines.push("## 🐛 Bugs (500 errors)");
        lines.push("");
        for (const b of bugs) {
            lines.push(`### [${b.role}] ${b.method} ${b.endpoint}`);
            lines.push(`- **Status**: ${b.status}`);
            if (b.error) lines.push(`- **Error**: \`${b.error.slice(0, 200)}\``);
            lines.push("");
        }
    }

    lines.push("## All Results");
    lines.push("");
    lines.push("| Role | Method | Endpoint | Status | Result |");
    lines.push("|------|--------|----------|--------|--------|");
    for (const r of results) {
        const icon = r.status >= 500 ? "❌" : r.status >= 400 ? "⚠️" : r.status === -1 ? "⏭️" : r.status === 0 ? "💥" : "✅";
        lines.push(`| ${r.role} | ${r.method} | ${r.endpoint} | ${r.status} | ${icon} |`);
    }

    mkdirSync(REPORT_DIR, { recursive: true });
    writeFileSync(join(REPORT_DIR, "mutation-smoke-report.md"), lines.join("\n"), "utf-8");
    writeFileSync(join(REPORT_DIR, "mutation-smoke-results.json"), JSON.stringify(results, null, 2), "utf-8");

    console.log(`\n📊 Report saved to doc/mutation-smoke-report.md`);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(2);
});
