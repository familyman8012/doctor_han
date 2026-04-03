import type { Role } from "./config";

export interface PageEntry {
    path: string;
    /** roles that should visit this page */
    roles: Role[];
    /** needs dynamic ID resolution */
    dynamic?: string;
    /** description for report */
    label: string;
}

/**
 * Page manifest - all 123 pages organized by section.
 * Dynamic routes use {vendorId}, {productId}, etc. placeholders.
 */
export const PAGES: PageEntry[] = [
    // ── Auth pages (visit without login) ──
    { path: "/login", roles: [], label: "로그인" },
    { path: "/signup", roles: [], label: "회원가입" },
    { path: "/reset-password", roles: [], label: "비밀번호 재설정 요청" },
    // Note: /update-password, /onboarding, /verification need special state - skip in smoke

    // ── Public pages ──
    { path: "/", roles: ["doctor"], label: "홈" },
    { path: "/categories", roles: ["doctor"], label: "카테고리 전체" },
    { path: "/search", roles: ["doctor"], label: "검색" },
    { path: "/search?q=인테리어", roles: ["doctor"], label: "검색 (키워드)" },
    { path: "/legal/privacy", roles: ["doctor"], label: "개인정보처리방침" },
    { path: "/legal/terms", roles: ["doctor"], label: "이용약관" },
    { path: "/legal/review-policy", roles: ["doctor"], label: "리뷰 정책" },
    { path: "/help", roles: ["doctor"], label: "헬프센터" },
    { path: "/favorites", roles: ["doctor"], label: "찜 목록" },

    // ── Public dynamic pages (need IDs) ──
    { path: "/vendors/{vendorId}", roles: ["doctor"], dynamic: "vendorId", label: "업체 상세" },
    { path: "/vendors/{vendorId}/products", roles: ["doctor"], dynamic: "vendorId", label: "업체 상품목록" },
    { path: "/products/{productId}", roles: ["doctor"], dynamic: "productId", label: "상품 상세" },

    // ── Category pages (use known slugs) ──
    { path: "/categories/interior", roles: ["doctor"], label: "카테고리: 인테리어" },
    { path: "/categories/medical-device", roles: ["doctor"], label: "카테고리: 의료기기" },
    { path: "/categories/signage", roles: ["doctor"], label: "카테고리: 간판" },
    { path: "/categories/marketing", roles: ["doctor"], label: "카테고리: 마케팅" },

    // ── Doctor (mypage) ──
    { path: "/mypage", roles: ["doctor"], label: "마이페이지" },
    { path: "/mypage/leads", roles: ["doctor"], label: "내 문의함" },
    { path: "/mypage/favorites", roles: ["doctor"], label: "찜 리스트 (마이페이지)" },
    { path: "/mypage/reviews", roles: ["doctor"], label: "내 리뷰" },
    { path: "/mypage/recent-views", roles: ["doctor"], label: "최근 본 항목" },
    { path: "/mypage/settings", roles: ["doctor"], label: "계정 설정" },
    { path: "/mypage/notifications", roles: ["doctor"], label: "알림" },
    { path: "/mypage/support", roles: ["doctor"], label: "고객지원" },
    { path: "/mypage/support/new", roles: ["doctor"], label: "고객지원 새 티켓" },

    // Doctor dynamic
    { path: "/mypage/leads/{leadId}", roles: ["doctor"], dynamic: "leadId", label: "문의 상세" },

    // ── Interior (doctor) ──
    { path: "/interior", roles: ["doctor"], label: "인테리어 프로젝트" },
    { path: "/interior/create", roles: ["doctor"], label: "프로젝트 등록" },

    // ── Vendor (partner) ──
    { path: "/partner", roles: ["vendor"], label: "파트너 대시보드" },
    { path: "/partner/products", roles: ["vendor"], label: "상품 관리" },
    { path: "/partner/products/new", roles: ["vendor"], label: "상품 등록" },
    { path: "/partner/leads", roles: ["vendor"], label: "받은 리드함" },
    { path: "/partner/bids", roles: ["vendor"], label: "입찰 관리" },
    { path: "/partner/ads", roles: ["vendor"], label: "광고 관리" },
    { path: "/partner/ads/purchase", roles: ["vendor"], label: "광고 구매" },
    { path: "/partner/credits", roles: ["vendor"], label: "크레딧" },
    { path: "/partner/credits/charge", roles: ["vendor"], label: "크레딧 충전" },
    { path: "/partner/credits/transactions", roles: ["vendor"], label: "거래 내역" },
    { path: "/partner/subscriptions", roles: ["vendor"], label: "구독 관리" },
    { path: "/partner/subscriptions/purchase", roles: ["vendor"], label: "구독 구매" },
    { path: "/partner/membership", roles: ["vendor"], label: "멤버십" },
    { path: "/partner/portfolios", roles: ["vendor"], label: "포트폴리오" },
    { path: "/partner/pricing", roles: ["vendor"], label: "서비스 단가" },
    { path: "/partner/refunds", roles: ["vendor"], label: "환불" },
    { path: "/partner/notifications", roles: ["vendor"], label: "알림 (파트너)" },
    { path: "/partner/settings", roles: ["vendor"], label: "설정 (파트너)" },
    { path: "/partner/support", roles: ["vendor"], label: "고객지원 (파트너)" },
    { path: "/partner/support/new", roles: ["vendor"], label: "고객지원 새 티켓 (파트너)" },

    // Vendor dynamic
    { path: "/partner/leads/{vendorLeadId}", roles: ["vendor"], dynamic: "vendorLeadId", label: "리드 상세 (파트너)" },
    { path: "/partner/products/{vendorProductId}", roles: ["vendor"], dynamic: "vendorProductId", label: "상품 편집 (파트너)" },
    { path: "/partner/bids/{bidProjectId}", roles: ["vendor"], dynamic: "bidProjectId", label: "입찰 상세 (파트너)" },

    // ── Admin ──
    { path: "/admin", roles: ["admin"], label: "관리자 홈" },
    { path: "/admin/dashboard", roles: ["admin"], label: "대시보드" },
    { path: "/admin/dashboard/ads", roles: ["admin"], label: "대시보드: 광고" },
    { path: "/admin/dashboard/revenue", roles: ["admin"], label: "대시보드: 매출" },
    { path: "/admin/dashboard/funnel", roles: ["admin"], label: "대시보드: 퍼널" },
    { path: "/admin/dashboard/leads", roles: ["admin"], label: "대시보드: 리드" },
    { path: "/admin/dashboard/users", roles: ["admin"], label: "대시보드: 사용자" },
    { path: "/admin/dashboard/operations", roles: ["admin"], label: "대시보드: 운영" },
    { path: "/admin/users", roles: ["admin"], label: "사용자 관리" },
    { path: "/admin/vendors", roles: ["admin"], label: "업체 관리" },
    { path: "/admin/verifications", roles: ["admin"], label: "인증 심사" },
    { path: "/admin/products", roles: ["admin"], label: "상품 관리 (어드민)" },
    { path: "/admin/categories", roles: ["admin"], label: "카테고리 관리" },
    { path: "/admin/memberships", roles: ["admin"], label: "멤버십 관리" },
    { path: "/admin/ads", roles: ["admin"], label: "광고 관리 (어드민)" },
    { path: "/admin/ads/campaigns", roles: ["admin"], label: "캠페인 목록" },
    { path: "/admin/ads/campaigns/create", roles: ["admin"], label: "캠페인 생성" },
    { path: "/admin/ads/priority", roles: ["admin"], label: "우선노출 관리" },
    { path: "/admin/ads/reports", roles: ["admin"], label: "광고 리포트" },
    { path: "/admin/bid-projects", roles: ["admin"], label: "입찰 프로젝트 (어드민)" },
    { path: "/admin/refunds", roles: ["admin"], label: "환불 관리" },
    { path: "/admin/settlements", roles: ["admin"], label: "정산 관리" },
    { path: "/admin/reports", roles: ["admin"], label: "리포트" },
    { path: "/admin/lead-reports", roles: ["admin"], label: "리드 리포트" },
    { path: "/admin/support", roles: ["admin"], label: "고객지원 (어드민)" },
    { path: "/admin/audit-logs", roles: ["admin"], label: "감사 로그" },
    { path: "/admin/exports", roles: ["admin"], label: "데이터 내보내기" },
    { path: "/admin/help-center", roles: ["admin"], label: "헬프센터 관리" },
    { path: "/admin/beta-ops", roles: ["admin"], label: "베타 운영" },
    { path: "/admin/beta-ops/leads", roles: ["admin"], label: "베타: 리드" },
    { path: "/admin/beta-ops/history", roles: ["admin"], label: "베타: 히스토리" },
    { path: "/admin/beta-ops/rewards", roles: ["admin"], label: "베타: 보상" },
    { path: "/admin/beta-ops/vendor-grades", roles: ["admin"], label: "베타: 업체 등급" },
];

/** Get pages for a specific role */
export function getPagesForRole(role: Role): PageEntry[] {
    if (role === "doctor") {
        // Doctor visits auth pages (unauthenticated first) + doctor pages
        return PAGES.filter((p) => p.roles.includes("doctor") || p.roles.length === 0);
    }
    return PAGES.filter((p) => p.roles.includes(role));
}
