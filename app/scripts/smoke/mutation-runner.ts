/**
 * Mutation Smoke Test Runner
 *
 * Tests all POST/PATCH/DELETE API endpoints with minimal payloads.
 * Success criteria: 200/201 or 400 (Zod validation) = OK, 500 = BUG.
 *
 * Usage:
 *   - Safe default: cd app && pnpm smoke:mutation
 *   - Advanced/manual: ALLOW_REMOTE_SMOKE_MUTATION=1 pnpm tsx scripts/smoke/mutation-runner.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer";
import { login } from "./auth";

// ── Config ──

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const REPORT_DIR = join(__dirname, "..", "..", "doc");
const RUN_ID = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACCOUNTS = {
    admin: { email: "admin@medihub.local", password: "Password123!" },
    doctor: { email: "doctor1@medihub.local", password: "Password123!" },
    vendor: { email: "vendor01@medihub.local", password: "Password123!" },
} as const;

type Role = keyof typeof ACCOUNTS;

function isLoopbackUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    } catch {
        return false;
    }
}

function assertSafeTarget(): void {
    if (process.env.ALLOW_REMOTE_SMOKE_MUTATION === "1") {
        return;
    }

    const problems: string[] = [];

    if (!isLoopbackUrl(BASE_URL)) {
        problems.push(`SMOKE_BASE_URL is not local: ${BASE_URL}`);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !isLoopbackUrl(supabaseUrl)) {
        problems.push(`NEXT_PUBLIC_SUPABASE_URL is not local: ${supabaseUrl}`);
    }

    if (problems.length === 0) {
        return;
    }

    throw new Error(
        [
            "Mutation smoke runner refused to start against a non-local target.",
            ...problems.map((problem) => `- ${problem}`),
            "Use `pnpm smoke:mutation` for the local harness.",
            "If you really need a remote run, set ALLOW_REMOTE_SMOKE_MUTATION=1 explicitly.",
        ].join("\n"),
    );
}

// ── Types ──

interface TestResult {
    endpoint: string;
    method: string;
    role: Role;
    status: number;
    ok: boolean;
    expected?: boolean;
    error?: string;
    body?: string;
}

// Store full session cookie strings per role
const sessionCookies: Record<Role, string | undefined> = {
    admin: undefined,
    doctor: undefined,
    vendor: undefined,
};

async function authenticate(role: Role): Promise<void> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    try {
        const page = await login(browser, role);
        const cookies = await page.cookies();
        const cookieHeader = cookies.map(({ name, value }) => `${name}=${value}`).join("; ");

        if (!cookieHeader) {
            throw new Error(`Auth failed for ${role} (${ACCOUNTS[role].email}): no browser cookies`);
        }

        sessionCookies[role] = cookieHeader;
        await page.close();
    } finally {
        await browser.close();
    }
}

// ── API Call Helper ──

async function callApi(
    method: string,
    path: string,
    role: Role,
    body?: Record<string, unknown>,
): Promise<{ status: number; body: string }> {
    const url = `${BASE_URL}${path}`;
    const sessionCookie = sessionCookies[role];

    if (!sessionCookie) {
        throw new Error(`Missing session cookie for role: ${role}`);
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
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
    resolveBody?: (ids: DynamicIds) => Record<string, unknown>;
    /** Dynamic path resolver - called with fetched IDs */
    resolvePath?: (ids: DynamicIds) => string;
    /** Skip if any required dynamic IDs are missing */
    requiresIds?: Array<keyof DynamicIds>;
    /** Store created resource IDs for later tests */
    saveIdAs?: keyof DynamicIds;
    /** 4xx 중에서도 시나리오상 허용되는 상태코드 */
    allowedStatuses?: number[];
    label: string;
}

interface DynamicIds {
    vendorId: string;
    vendorCategoryId: string;
    productCategoryId: string;
    productId: string;
    managedProductId: string;
    creditPackageId: string;
    subscriptionPlanId: string;
    membershipPlanId: string;
    prioritySlotId: string;
    leadId: string;
    vendorLeadId: string;
    leadMessageId: string;
    categoryId: string;
    reviewId: string;
    bidProjectId: string;
    supportTicketId: string;
    helpCategoryId: string;
    verificationId: string;
    reportId: string;
    leadReportId: string;
    priceId: string;
    portfolioId: string;
    subscriptionId: string;
    membershipId: string;
    campaignId: string;
    settlementId: string;
    refundId: string;
    sanctionId: string;
    bannerId: string;
}

const DUMMY_UUID = "00000000-0000-0000-0000-000000000099";

const SAVED_ID_HINTS: Partial<Record<keyof DynamicIds, string[]>> = {
    categoryId: ["category"],
    helpCategoryId: ["category"],
    leadId: ["lead"],
    leadMessageId: ["message"],
    reviewId: ["review"],
    reportId: ["report", "id"],
    leadReportId: ["report", "id"],
    bidProjectId: ["project"],
    supportTicketId: ["ticket"],
    portfolioId: ["portfolio"],
    priceId: ["price"],
    productId: ["product"],
    managedProductId: ["product"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractFirstUuid(value: unknown): string | null {
    if (typeof value === "string") {
        return UUID_REGEX.test(value) ? value : null;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const found = extractFirstUuid(item);
            if (found) return found;
        }
        return null;
    }

    if (!isRecord(value)) {
        return null;
    }

    if (typeof value.id === "string" && UUID_REGEX.test(value.id)) {
        return value.id;
    }

    for (const nested of Object.values(value)) {
        const found = extractFirstUuid(nested);
        if (found) return found;
    }

    return null;
}

function extractSavedId(payload: unknown, key: keyof DynamicIds): string | null {
    const root = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
    const hints = SAVED_ID_HINTS[key] ?? [];

    if (isRecord(root)) {
        for (const hint of hints) {
            const found = extractFirstUuid(root[hint]);
            if (found) return found;
        }
    }

    return extractFirstUuid(root);
}

function cloneBody(body?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!body) return undefined;
    return JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
}

function buildTests(): MutationTest[] {
    return [
        // ── Admin setup ──
        {
            role: "admin",
            method: "POST",
            path: "/api/admin/help-center/categories",
            body: {
                name: `스모크도움말-${RUN_ID}`,
                slug: `smoke-help-${RUN_ID}`,
                displayOrder: 999,
            },
            saveIdAs: "helpCategoryId",
            label: "관리자 도움말 카테고리 생성",
        },
        {
            role: "admin",
            method: "POST",
            path: "/api/admin/categories",
            body: {
                name: `스모크카테고리-${RUN_ID}`,
                slug: `smoke-cat-${RUN_ID}`,
            },
            saveIdAs: "categoryId",
            label: "관리자 카테고리 생성",
        },

        // ── Vendor profile ──
        {
            role: "vendor",
            method: "PATCH",
            path: "/api/vendors/me",
            body: { summary: `스모크 테스트 업체 소개 ${RUN_ID}` },
            label: "업체 프로필 수정",
        },
        {
            role: "vendor",
            method: "POST",
            path: "/api/vendors/me/prices",
            requiresIds: ["vendorCategoryId"],
            resolveBody: (ids) => ({
                categoryId: ids.vendorCategoryId,
                price: 100000,
            }),
            saveIdAs: "priceId",
            allowedStatuses: [409],
            label: "가격 생성",
        },

        // ── Leads / reviews chain ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/leads",
            requiresIds: ["vendorId", "vendorCategoryId"],
            resolveBody: (ids) => ({
                vendorId: ids.vendorId,
                categoryIds: [ids.vendorCategoryId],
                contactName: "스모크테스트",
                contactPhone: "010-0000-0000",
                content: `스모크 테스트 문의 ${RUN_ID}`,
            }),
            saveIdAs: "leadId",
            allowedStatuses: [400],
            label: "리드 생성",
        },
        {
            role: "doctor",
            method: "POST",
            path: `/api/leads/${DUMMY_UUID}/messages`,
            resolvePath: (ids) => `/api/leads/${ids.leadId}/messages`,
            requiresIds: ["leadId"],
            body: { content: `스모크 테스트 메시지 ${RUN_ID}` },
            saveIdAs: "leadMessageId",
            label: "리드 메시지 전송",
        },
        {
            role: "doctor",
            method: "PATCH",
            path: `/api/leads/${DUMMY_UUID}/messages/read`,
            resolvePath: (ids) => `/api/leads/${ids.leadId}/messages/read`,
            requiresIds: ["leadId", "leadMessageId"],
            resolveBody: (ids) => ({ messageIds: [ids.leadMessageId] }),
            label: "리드 메시지 읽음",
        },
        {
            role: "doctor",
            method: "POST",
            path: "/api/reviews",
            requiresIds: ["vendorId", "leadId"],
            resolveBody: (ids) => ({
                vendorId: ids.vendorId,
                leadId: ids.leadId,
                rating: 5,
                content: `스모크 테스트 리뷰 ${RUN_ID}`,
            }),
            saveIdAs: "reviewId",
            label: "리뷰 작성",
        },
        {
            role: "vendor",
            method: "POST",
            path: `/api/reviews/${DUMMY_UUID}/reply`,
            resolvePath: (ids) => `/api/reviews/${ids.reviewId}/reply`,
            requiresIds: ["reviewId"],
            body: { content: `답변 테스트 ${RUN_ID}` },
            label: "리뷰 답변 작성",
        },
        {
            role: "vendor",
            method: "POST",
            path: `/api/reviews/${DUMMY_UUID}/report`,
            resolvePath: (ids) => `/api/reviews/${ids.reviewId}/report`,
            requiresIds: ["reviewId"],
            body: { reason: "other", detail: `스모크 테스트 신고 ${RUN_ID}` },
            saveIdAs: "reportId",
            label: "리뷰 신고",
        },
        {
            role: "vendor",
            method: "POST",
            path: `/api/leads/${DUMMY_UUID}/report`,
            resolvePath: (ids) => `/api/leads/${ids.vendorLeadId}/report`,
            requiresIds: ["vendorLeadId"],
            body: { reason: "other", detail: `스모크 테스트 신고 ${RUN_ID}` },
            saveIdAs: "leadReportId",
            allowedStatuses: [409],
            label: "리드 신고",
        },
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/reviews/${DUMMY_UUID}/hide`,
            resolvePath: (ids) => `/api/admin/reviews/${ids.reviewId}/hide`,
            requiresIds: ["reviewId"],
            body: { reason: `스모크 테스트 숨김 ${RUN_ID}` },
            label: "관리자 리뷰 숨김",
        },
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/reviews/${DUMMY_UUID}/unhide`,
            resolvePath: (ids) => `/api/admin/reviews/${ids.reviewId}/unhide`,
            requiresIds: ["reviewId"],
            body: {},
            label: "관리자 리뷰 복원",
        },
        {
            role: "doctor",
            method: "PATCH",
            path: `/api/reviews/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/reviews/${ids.reviewId}`,
            requiresIds: ["reviewId"],
            body: { content: `수정된 리뷰 ${RUN_ID}` },
            label: "리뷰 수정",
        },

        // ── Favorites ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/favorites/toggle",
            requiresIds: ["vendorId"],
            resolveBody: (ids) => ({ vendorId: ids.vendorId }),
            label: "찜 토글 (업체)",
        },

        // ── Vendor assets ──
        {
            role: "vendor",
            method: "POST",
            path: "/api/vendors/me/portfolio",
            body: { title: `스모크 테스트 포트폴리오 ${RUN_ID}` },
            saveIdAs: "portfolioId",
            label: "포트폴리오 생성",
        },
        {
            role: "vendor",
            method: "PATCH",
            path: `/api/vendors/me/portfolio/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/vendors/me/portfolio/${ids.portfolioId}`,
            requiresIds: ["portfolioId"],
            body: { title: `수정된 포트폴리오 ${RUN_ID}` },
            label: "포트폴리오 수정",
        },
        {
            role: "vendor",
            method: "PATCH",
            path: `/api/vendors/me/prices/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/vendors/me/prices/${ids.priceId}`,
            requiresIds: ["priceId"],
            body: { price: 120000 },
            label: "가격 수정",
        },
        {
            role: "vendor",
            method: "POST",
            path: "/api/vendors/me/products",
            requiresIds: ["productCategoryId"],
            resolveBody: (ids) => ({
                categoryId: ids.productCategoryId,
                title: `스모크 테스트 상품 ${RUN_ID}`,
                priceType: "contact",
            }),
            saveIdAs: "managedProductId",
            label: "상품 생성",
        },
        {
            role: "vendor",
            method: "PATCH",
            path: `/api/vendors/me/products/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/vendors/me/products/${ids.managedProductId}`,
            requiresIds: ["managedProductId"],
            body: { title: `수정된 상품명 ${RUN_ID}` },
            label: "상품 수정",
        },
        {
            role: "doctor",
            method: "POST",
            path: "/api/product-favorites/toggle",
            requiresIds: ["productId"],
            resolveBody: (ids) => ({ productId: ids.productId }),
            label: "찜 토글 (상품)",
        },
        {
            role: "doctor",
            method: "POST",
            path: "/api/product-recent-views",
            requiresIds: ["productId"],
            resolveBody: (ids) => ({ productId: ids.productId }),
            label: "상품 조회 기록",
        },

        // ── Support flow ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/support/tickets",
            requiresIds: ["helpCategoryId"],
            resolveBody: (ids) => ({
                categoryId: ids.helpCategoryId,
                title: `스모크 테스트 티켓 ${RUN_ID}`,
                content: "테스트 문의 내용입니다.",
            }),
            saveIdAs: "supportTicketId",
            allowedStatuses: [429],
            label: "고객지원 티켓 생성",
        },
        {
            role: "doctor",
            method: "POST",
            path: `/api/support/tickets/${DUMMY_UUID}/messages`,
            resolvePath: (ids) => `/api/support/tickets/${ids.supportTicketId}/messages`,
            requiresIds: ["supportTicketId"],
            body: { content: `추가 메시지 테스트 ${RUN_ID}` },
            label: "고객지원 메시지 전송",
        },
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/support/tickets/${DUMMY_UUID}/messages`,
            resolvePath: (ids) => `/api/admin/support/tickets/${ids.supportTicketId}/messages`,
            requiresIds: ["supportTicketId"],
            body: { content: `관리자 답변 테스트 ${RUN_ID}` },
            label: "관리자 티켓 답변",
        },
        {
            role: "admin",
            method: "PATCH",
            path: `/api/admin/support/tickets/${DUMMY_UUID}/status`,
            resolvePath: (ids) => `/api/admin/support/tickets/${ids.supportTicketId}/status`,
            requiresIds: ["supportTicketId"],
            body: { status: "resolved" },
            label: "관리자 티켓 상태 변경",
        },
        {
            role: "doctor",
            method: "POST",
            path: `/api/support/tickets/${DUMMY_UUID}/reopen`,
            resolvePath: (ids) => `/api/support/tickets/${ids.supportTicketId}/reopen`,
            requiresIds: ["supportTicketId"],
            body: {},
            label: "고객지원 티켓 재오픈",
        },

        // ── Bid projects ──
        {
            role: "doctor",
            method: "POST",
            path: "/api/bid/projects",
            body: {
                title: `스모크 테스트 입찰 ${RUN_ID}`,
                location: "서울 강남구",
                budgetMin: 1000000,
                budgetMax: 5000000,
            },
            saveIdAs: "bidProjectId",
            label: "입찰 프로젝트 생성",
        },
        {
            role: "vendor",
            method: "POST",
            path: `/api/bid/projects/${DUMMY_UUID}/responses`,
            resolvePath: (ids) => `/api/bid/projects/${ids.bidProjectId}/responses`,
            requiresIds: ["bidProjectId"],
            body: {
                price: 3000000,
                proposal: `스모크 테스트 입찰 응답 ${RUN_ID}`,
            },
            allowedStatuses: [400, 409],
            label: "입찰 응답 제출",
        },
        {
            role: "admin",
            method: "PATCH",
            path: `/api/admin/bid-projects/${DUMMY_UUID}/status`,
            resolvePath: (ids) => `/api/admin/bid-projects/${ids.bidProjectId}/status`,
            requiresIds: ["bidProjectId"],
            body: { status: "bidding" },
            label: "관리자 입찰 상태 변경",
        },
        {
            role: "doctor",
            method: "PATCH",
            path: `/api/bid/projects/${DUMMY_UUID}/cancel`,
            resolvePath: (ids) => `/api/bid/projects/${ids.bidProjectId}/cancel`,
            requiresIds: ["bidProjectId"],
            body: {},
            label: "입찰 프로젝트 취소",
        },

        // ── Payments / misc mutations ──
        {
            role: "vendor",
            method: "POST",
            path: "/api/credits/charge",
            requiresIds: ["creditPackageId"],
            resolveBody: (ids) => ({ packageId: ids.creditPackageId }),
            label: "크레딧 충전 준비",
        },
        {
            role: "vendor",
            method: "PATCH",
            path: "/api/credits/auto-charge",
            body: { enabled: false },
            label: "자동충전 설정",
        },
        {
            role: "vendor",
            method: "POST",
            path: "/api/payments/confirm",
            body: {
                paymentKey: `test_payment_key_${RUN_ID}`,
                orderId: `test_order_id_${RUN_ID}`,
                amount: 10000,
            },
            allowedStatuses: [404],
            label: "결제 확인",
        },
        {
            role: "doctor",
            method: "PATCH",
            path: "/api/notification-settings",
            body: { emailEnabled: false },
            label: "알림 설정 변경",
        },
        {
            role: "doctor",
            method: "PATCH",
            path: "/api/profile",
            body: { displayName: `스모크테스트닥터${RUN_ID}` },
            label: "프로필 수정",
        },
        {
            role: "doctor",
            method: "PATCH",
            path: "/api/onboarding",
            body: { action: "complete" },
            label: "온보딩 상태 변경",
        },
        {
            role: "doctor",
            method: "POST",
            path: "/api/geocode",
            body: { address: "서울 강남구 테헤란로 1" },
            allowedStatuses: [403],
            label: "지오코딩",
        },
        {
            role: "doctor",
            method: "POST",
            path: "/api/files/signed-upload",
            body: {
                purpose: "lead_attachment",
                fileName: "test.png",
                mimeType: "image/png",
                sizeBytes: 1024,
            },
            label: "파일 업로드 URL 발급",
        },
        {
            role: "vendor",
            method: "POST",
            path: "/api/vendors/me/subscriptions",
            requiresIds: ["productCategoryId", "subscriptionPlanId"],
            resolveBody: (ids) => ({
                categoryId: ids.productCategoryId,
                planId: ids.subscriptionPlanId,
                autoRenew: false,
            }),
            allowedStatuses: [400],
            label: "구독 생성",
        },
        {
            role: "vendor",
            method: "POST",
            path: "/api/vendors/me/membership",
            requiresIds: ["membershipPlanId"],
            resolveBody: (ids) => ({
                planId: ids.membershipPlanId,
                autoRenew: false,
            }),
            allowedStatuses: [400],
            label: "멤버십 가입",
        },
        {
            role: "vendor",
            method: "POST",
            path: "/api/ads/priority/purchase",
            requiresIds: ["prioritySlotId"],
            resolveBody: (ids) => ({ prioritySlotId: ids.prioritySlotId }),
            allowedStatuses: [400],
            label: "우선노출 광고 구매",
        },
        {
            role: "doctor",
            method: "POST",
            path: `/api/ads/banners/${DUMMY_UUID}/click`,
            resolvePath: (ids) => `/api/ads/banners/${ids.bannerId}/click`,
            requiresIds: ["bannerId"],
            body: {},
            label: "배너 클릭 추적",
        },
        {
            role: "vendor",
            method: "POST",
            path: "/api/refunds",
            body: {
                leadChargeId: DUMMY_UUID,
                reason: "other",
                description: `스모크 테스트 환불 ${RUN_ID}`,
            },
            allowedStatuses: [400],
            label: "환불 요청",
        },

        // ── Admin follow-ups ──
        {
            role: "admin",
            method: "PATCH",
            path: `/api/admin/categories/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/admin/categories/${ids.categoryId}`,
            requiresIds: ["categoryId"],
            body: { name: `수정된 카테고리 ${RUN_ID}` },
            label: "관리자 카테고리 수정",
        },
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/verifications/${DUMMY_UUID}/reject`,
            resolvePath: (ids) => `/api/admin/verifications/${ids.verificationId}/reject`,
            requiresIds: ["verificationId"],
            body: { reason: `스모크 테스트 반려 ${RUN_ID}` },
            label: "관리자 인증 반려",
        },
        {
            role: "admin",
            method: "POST",
            path: "/api/admin/help-center/articles",
            requiresIds: ["helpCategoryId"],
            resolveBody: (ids) => ({
                categoryId: ids.helpCategoryId,
                title: `스모크 테스트 도움말 ${RUN_ID}`,
                content: "테스트 내용",
                type: "faq",
            }),
            label: "관리자 도움말 글 생성",
        },
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/reports/${DUMMY_UUID}/review`,
            resolvePath: (ids) => `/api/admin/reports/${ids.reportId}/review`,
            requiresIds: ["reportId"],
            body: {},
            label: "관리자 신고 검토",
        },
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/lead-reports/${DUMMY_UUID}/review`,
            resolvePath: (ids) => `/api/admin/lead-reports/${ids.leadReportId}/review`,
            requiresIds: ["leadReportId"],
            body: { action: "dismiss", reason: `스모크 테스트 ${RUN_ID}` },
            label: "관리자 리드신고 검토",
        },
        {
            role: "admin",
            method: "POST",
            path: "/api/admin/settlements/generate",
            body: { year: 2026, month: 4 },
            label: "관리자 정산 생성",
        },
        {
            role: "admin",
            method: "POST",
            path: "/api/admin/ads/campaigns",
            body: {
                name: `스모크 테스트 캠페인 ${RUN_ID}`,
                type: "banner",
                startDate: "2026-04-01",
                endDate: "2026-04-30",
            },
            allowedStatuses: [400],
            label: "관리자 광고 캠페인 생성",
        },
        {
            role: "admin",
            method: "POST",
            path: `/api/admin/credits/${DUMMY_UUID}/adjust`,
            resolvePath: (ids) => `/api/admin/credits/${ids.vendorId}/adjust`,
            requiresIds: ["vendorId"],
            body: { amount: 100, reason: `스모크 테스트 ${RUN_ID}`, adjustType: "manual_grant" },
            label: "관리자 크레딧 조정",
        },
        {
            role: "admin",
            method: "PATCH",
            path: `/api/admin/products/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/admin/products/${ids.managedProductId}`,
            requiresIds: ["managedProductId"],
            body: { status: "active" },
            label: "관리자 상품 상태 변경",
        },

        // ── Cleanup / terminal state ──
        {
            role: "doctor",
            method: "PATCH",
            path: `/api/leads/${DUMMY_UUID}/status`,
            resolvePath: (ids) => `/api/leads/${ids.leadId}/status`,
            requiresIds: ["leadId"],
            body: { status: "canceled" },
            label: "리드 상태변경",
        },
        {
            role: "doctor",
            method: "DELETE",
            path: `/api/reviews/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/reviews/${ids.reviewId}`,
            requiresIds: ["reviewId"],
            label: "리뷰 삭제",
        },
        {
            role: "vendor",
            method: "DELETE",
            path: `/api/vendors/me/portfolio/${DUMMY_UUID}`,
            resolvePath: (ids) => `/api/vendors/me/portfolio/${ids.portfolioId}`,
            requiresIds: ["portfolioId"],
            label: "포트폴리오 삭제",
        },
    ];
}

// ── Dynamic ID Fetcher ──

async function fetchDynamicIds(): Promise<DynamicIds> {
    const ids: DynamicIds = {
        vendorId: "",
        vendorCategoryId: "",
        productCategoryId: "",
        productId: "",
        managedProductId: "",
        creditPackageId: "",
        subscriptionPlanId: "",
        membershipPlanId: "",
        prioritySlotId: "",
        leadId: "",
        vendorLeadId: "",
        leadMessageId: "",
        categoryId: "",
        reviewId: "",
        bidProjectId: "",
        supportTicketId: "",
        helpCategoryId: "",
        verificationId: "",
        reportId: "",
        leadReportId: "",
        priceId: "",
        portfolioId: "",
        subscriptionId: "",
        membershipId: "",
        campaignId: "",
        settlementId: "",
        refundId: "",
        sanctionId: "",
        bannerId: "",
    };

    const fetchJson = async (path: string, role: Role): Promise<unknown> => {
        try {
            const { status, body } = await callApi("GET", path, role);
            if (status !== 200) return "";
            return JSON.parse(body);
        } catch {
            return "";
        }
    };

    const fetchFirstItem = async (path: string, role: Role): Promise<Record<string, unknown> | null> => {
        const payload = await fetchJson(path, role);
        if (!isRecord(payload) || !isRecord(payload.data)) return null;

        const data = payload.data;
        const items = Array.isArray(data.items)
            ? data.items
            : Array.isArray(data.rows)
              ? data.rows
              : Array.isArray(data)
                ? data
                : [];

        if (items.length === 0) return null;
        const [firstItem] = items;
        return isRecord(firstItem) ? firstItem : null;
    };

    const vendorMePayload = await fetchJson("/api/vendors/me", "vendor");
    if (isRecord(vendorMePayload) && isRecord(vendorMePayload.data) && isRecord(vendorMePayload.data.vendor)) {
        const vendor = vendorMePayload.data.vendor;
        const categories = Array.isArray(vendor.categories) ? vendor.categories : [];

        ids.vendorId = typeof vendor.id === "string" ? vendor.id : "";

        for (const category of categories) {
            if (!isRecord(category) || typeof category.id !== "string") continue;
            if (!ids.vendorCategoryId) {
                ids.vendorCategoryId = category.id;
            }
            if (!ids.productCategoryId && category.listingType === "product") {
                ids.productCategoryId = category.id;
            }
        }
    }

    if (ids.vendorId && (!ids.vendorCategoryId || !ids.productCategoryId)) {
        const vendorDetailPayload = await fetchJson(`/api/vendors/${ids.vendorId}`, "doctor");
        if (
            isRecord(vendorDetailPayload) &&
            isRecord(vendorDetailPayload.data) &&
            isRecord(vendorDetailPayload.data.vendor)
        ) {
            const vendor = vendorDetailPayload.data.vendor;
            const categories = Array.isArray(vendor.categories) ? vendor.categories : [];

            for (const category of categories) {
                if (!isRecord(category) || typeof category.id !== "string") continue;
                if (!ids.vendorCategoryId) {
                    ids.vendorCategoryId = category.id;
                }
                if (!ids.productCategoryId && category.listingType === "product") {
                    ids.productCategoryId = category.id;
                }
            }
        }
    }

    const doctorLead = await fetchFirstItem("/api/leads?pageSize=1", "doctor");
    if (doctorLead) {
        ids.categoryId =
            Array.isArray(doctorLead.categoryIds) && typeof doctorLead.categoryIds[0] === "string"
                ? doctorLead.categoryIds[0]
                : ids.categoryId;
    }

    const vendorLead = await fetchFirstItem("/api/leads?pageSize=1", "vendor");
    if (vendorLead) {
        if (typeof vendorLead.id === "string") {
            ids.vendorLeadId = vendorLead.id;
        }
        if (!ids.vendorCategoryId) {
            ids.vendorCategoryId =
                Array.isArray(vendorLead.categoryIds) && typeof vendorLead.categoryIds[0] === "string"
                    ? vendorLead.categoryIds[0]
                    : ids.vendorCategoryId;
        }
    }

    const publicProduct = await fetchFirstItem("/api/products?pageSize=1", "doctor");
    if (publicProduct?.id && typeof publicProduct.id === "string") {
        ids.productId = publicProduct.id;
    }

    const vendorProduct = await fetchFirstItem("/api/vendors/me/products?pageSize=1", "vendor");
    if (vendorProduct?.id && typeof vendorProduct.id === "string") {
        ids.managedProductId = vendorProduct.id;
    }

    const price = await fetchFirstItem("/api/vendors/me/prices?pageSize=1", "vendor");
    if (price?.id && typeof price.id === "string") {
        ids.priceId = price.id;
    }

    const portfolio = await fetchFirstItem("/api/vendors/me/portfolio?pageSize=1", "vendor");
    if (portfolio?.id && typeof portfolio.id === "string") {
        ids.portfolioId = portfolio.id;
    }

    const subscription = await fetchFirstItem("/api/vendors/me/subscriptions?pageSize=1", "vendor");
    if (subscription?.id && typeof subscription.id === "string") {
        ids.subscriptionId = subscription.id;
    }

    const creditsPayload = await fetchJson("/api/credits", "vendor");
    if (isRecord(creditsPayload) && isRecord(creditsPayload.data) && Array.isArray(creditsPayload.data.packages)) {
        const [firstPackage] = creditsPayload.data.packages;
        if (isRecord(firstPackage) && typeof firstPackage.id === "string") {
            ids.creditPackageId = firstPackage.id;
        }
    }

    const subscriptionPlansPayload = await fetchJson("/api/vendors/me/subscriptions/plans", "vendor");
    if (
        isRecord(subscriptionPlansPayload) &&
        isRecord(subscriptionPlansPayload.data) &&
        Array.isArray(subscriptionPlansPayload.data.items)
    ) {
        const [firstPlan] = subscriptionPlansPayload.data.items;
        if (isRecord(firstPlan) && typeof firstPlan.id === "string") {
            ids.subscriptionPlanId = firstPlan.id;
        }
    }

    const membershipPlansPayload = await fetchJson("/api/vendors/me/membership/plans", "vendor");
    if (
        isRecord(membershipPlansPayload) &&
        isRecord(membershipPlansPayload.data) &&
        Array.isArray(membershipPlansPayload.data.items)
    ) {
        const [firstPlan] = membershipPlansPayload.data.items;
        if (isRecord(firstPlan) && typeof firstPlan.id === "string") {
            ids.membershipPlanId = firstPlan.id;
        }
    }

    const publicHelpCategory = await fetchFirstItem("/api/help/categories", "doctor");
    if (publicHelpCategory?.id && typeof publicHelpCategory.id === "string") {
        ids.helpCategoryId = publicHelpCategory.id;
    }

    const adminHelpCategory = await fetchFirstItem("/api/admin/help-center/categories?pageSize=1", "admin");
    if (!ids.helpCategoryId && adminHelpCategory?.id && typeof adminHelpCategory.id === "string") {
        ids.helpCategoryId = adminHelpCategory.id;
    }

    const category = await fetchFirstItem("/api/categories?pageSize=1", "doctor");
    if (category?.id && typeof category.id === "string") {
        ids.categoryId = ids.categoryId || category.id;
    }

    const verificationCandidates = [
        await fetchFirstItem("/api/admin/verifications?type=vendor&status=pending&pageSize=1", "admin"),
        await fetchFirstItem("/api/admin/verifications?type=doctor&status=pending&pageSize=1", "admin"),
    ];
    for (const verification of verificationCandidates) {
        if (verification?.id && typeof verification.id === "string") {
            ids.verificationId = verification.id;
            break;
        }
    }

    const campaign = await fetchFirstItem("/api/admin/ads/campaigns?pageSize=1", "admin");
    if (campaign?.id && typeof campaign.id === "string") {
        ids.campaignId = campaign.id;
    }

    const priorityReportPayload = await fetchJson("/api/admin/ads/priority", "admin");
    if (
        isRecord(priorityReportPayload) &&
        isRecord(priorityReportPayload.data) &&
        Array.isArray(priorityReportPayload.data.slots)
    ) {
        const [firstSlotWrapper] = priorityReportPayload.data.slots;
        if (isRecord(firstSlotWrapper) && isRecord(firstSlotWrapper.slot) && typeof firstSlotWrapper.slot.id === "string") {
            ids.prioritySlotId = firstSlotWrapper.slot.id;
        }
    }

    const settlement = await fetchFirstItem("/api/admin/settlements?pageSize=1", "admin");
    if (settlement?.id && typeof settlement.id === "string") {
        ids.settlementId = settlement.id;
    }

    const refund = await fetchFirstItem("/api/admin/refunds?pageSize=1", "admin");
    if (refund?.id && typeof refund.id === "string") {
        ids.refundId = refund.id;
    }

    const sanction = await fetchFirstItem("/api/admin/sanctions?pageSize=1", "admin");
    if (sanction?.id && typeof sanction.id === "string") {
        ids.sanctionId = sanction.id;
    }

    const banner = await fetchFirstItem("/api/ads/banners?pageSize=1", "doctor");
    if (banner?.id && typeof banner.id === "string") {
        ids.bannerId = banner.id;
    }

    return ids;
}

// ── Main ──

async function main() {
    assertSafeTarget();

    console.log("🚀 Mutation Smoke Test Runner");
    console.log(`   Target: ${BASE_URL}`);
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

    for (const test of tests) {
        // Resolve dynamic path
        let path = test.path;
        const missingIds = (test.requiresIds ?? []).filter((key) => !ids[key]);
        if (missingIds.length > 0) {
            console.log(
                `   ⏭️  [${test.role}] ${test.method} ${test.path} — SKIP (missing ${missingIds.join(", ")})`,
            );
            results.push({
                endpoint: test.path,
                method: test.method,
                role: test.role,
                status: -1,
                ok: true,
                error: `SKIPPED: missing ${missingIds.join(", ")}`,
            });
            continue;
        }

        if (test.resolvePath) {
            path = test.resolvePath(ids);
        }

        const body = test.resolveBody ? test.resolveBody(ids) : cloneBody(test.body);
        const { status, body: responseBody } = await callApi(test.method, path, test.role, body);

        const isBug = status >= 500 || status === 0;
        const isOk = !isBug && status !== -1;

        const result: TestResult = {
            endpoint: path,
            method: test.method,
            role: test.role,
            status,
            ok: isOk,
            expected: false,
        };

        if (status >= 400 || !isOk) {
            result.error = responseBody?.slice(0, 300);
            result.body = responseBody?.slice(0, 500);
        }

        results.push(result);

        if (test.saveIdAs && status >= 200 && status < 300) {
            try {
                const payload = JSON.parse(responseBody);
                const savedId = extractSavedId(payload, test.saveIdAs);
                if (savedId) {
                    ids[test.saveIdAs] = savedId;
                    if (test.saveIdAs === "leadId") {
                        ids.vendorLeadId = savedId;
                    }
                    console.log(`   🔗 saved ${test.saveIdAs}: ${savedId}`);
                }
            } catch {
                // ignore malformed JSON from endpoints that don't return JSON
            }
        }

        const isAllowedStatus = test.allowedStatuses?.includes(status) ?? false;
        result.expected = isAllowedStatus;
        const icon =
            status >= 500 || status === 0
                ? "❌"
                : (status === 404 || status === 405) && !isAllowedStatus
                  ? "❗"
                  : isAllowedStatus
                    ? "✅"
                  : status >= 400
                    ? "⚠️"
                    : "✅";
        console.log(
            `   ${icon} [${test.role}] ${test.method} ${path} → ${status} ${test.label}${
                isBug ? ` — ${responseBody?.slice(0, 100)}` : ""
            }`,
        );
    }

    const bugs = results.filter((result) => result.status >= 500 || result.status === 0);
    const suspicious = results.filter(
        (result) => (result.status === 404 || result.status === 405) && !result.expected,
    );
    const expectedStatuses = results.filter((result) => result.expected);

    // 4. Generate report
    generateMutationReport(results, bugs, suspicious, expectedStatuses);

    // 5. Summary
    console.log(`\n${"═".repeat(60)}`);
    console.log(`📊 Results: ${results.length} tested, ${bugs.length} bugs (5xx/fetch)`);
    console.log(`   ✅ OK (2xx): ${results.filter((r) => r.status >= 200 && r.status < 300).length}`);
    console.log(`   ✅ Expected 4xx: ${expectedStatuses.length}`);
    console.log(`   ❗ Suspicious (404/405): ${suspicious.length}`);
    console.log(`   ⚠️  Validation/permission (other 4xx): ${results.filter((r) => r.status >= 400 && r.status < 500 && !r.expected && r.status !== 404 && r.status !== 405).length}`);
    console.log(`   ❌ 5xx: ${results.filter((r) => r.status >= 500).length}`);
    console.log(`   ⏭️  Skipped: ${results.filter((r) => r.status === -1).length}`);
    console.log(`   💥 Fetch errors: ${results.filter((r) => r.status === 0).length}`);
    console.log(`${"═".repeat(60)}`);

    process.exit(bugs.length > 0 ? 1 : 0);
}

function generateMutationReport(
    results: TestResult[],
    bugs: TestResult[],
    suspicious: TestResult[],
    expectedStatuses: TestResult[],
): void {
    const validationWarnings = results.filter(
        (result) => result.status >= 400 && result.status < 500 && !result.expected && result.status !== 404 && result.status !== 405,
    );

    const lines: string[] = [
        "# Mutation Smoke Test Report",
        "",
        `**Date**: ${new Date().toISOString().slice(0, 19)}`,
        `**Total tested**: ${results.length}`,
        `**Bugs (5xx/fetch)**: ${bugs.length}`,
        `**Expected 4xx**: ${expectedStatuses.length}`,
        `**Suspicious (404/405)**: ${suspicious.length}`,
        `**OK (2xx)**: ${results.filter((r) => r.status >= 200 && r.status < 300).length}`,
        `**Validation / Permission (other 4xx)**: ${validationWarnings.length}`,
        `**Skipped**: ${results.filter((r) => r.status === -1).length}`,
        "",
        "---",
        "",
    ];

    if (bugs.length > 0) {
        lines.push("## Bugs (5xx / fetch errors)");
        lines.push("");
        for (const bug of bugs) {
            lines.push(`### [${bug.role}] ${bug.method} ${bug.endpoint}`);
            lines.push(`- **Status**: ${bug.status}`);
            if (bug.error) lines.push(`- **Error**: \`${bug.error.slice(0, 200)}\``);
            lines.push("");
        }
    }

    if (suspicious.length > 0) {
        lines.push("## Suspicious (404 / 405)");
        lines.push("");
        for (const result of suspicious) {
            lines.push(`- [${result.role}] ${result.method} ${result.endpoint} → ${result.status}`);
        }
        lines.push("");
    }

    if (expectedStatuses.length > 0) {
        lines.push("## Expected Validation / Business Rule 4xx");
        lines.push("");
        for (const result of expectedStatuses) {
            lines.push(`- [${result.role}] ${result.method} ${result.endpoint} → ${result.status}`);
        }
        lines.push("");
    }

    if (validationWarnings.length > 0) {
        lines.push("## Validation / Permission (other 4xx)");
        lines.push("");
        for (const result of validationWarnings) {
            lines.push(`- [${result.role}] ${result.method} ${result.endpoint} → ${result.status}`);
        }
        lines.push("");
    }

    lines.push("## All Results");
    lines.push("");
    lines.push("| Role | Method | Endpoint | Status | Result |");
    lines.push("|------|--------|----------|--------|--------|");
    for (const result of results) {
        const icon =
            result.status >= 500 || result.status === 0
                ? "❌"
                : (result.status === 404 || result.status === 405) && !result.expected
                  ? "❗"
                  : result.expected
                    ? "✅"
                    : result.status >= 400
                    ? "⚠️"
                    : result.status === -1
                      ? "⏭️"
                      : "✅";
        lines.push(`| ${result.role} | ${result.method} | ${result.endpoint} | ${result.status} | ${icon} |`);
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
