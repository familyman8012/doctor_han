import "server-only";

import type { Database } from "@/lib/database.types";
import { internalServerError } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BidProjectRow, BidProjectScoreRow } from "./mapper";
import { insertBidProjectScores, insertBidResponses } from "./repository";

const WEIGHTS = {
    region: 0.30,
    rating: 0.25,
    response: 0.20,
    portfolio: 0.15,
    price: 0.10,
} as const;

const RECOMMEND_COUNT = 3;
const MIN_PORTFOLIO_COUNT = 3;
const MIN_CREDIT_BALANCE = 500_000;

interface VendorCandidate {
    vendorId: string;
    regionPrimary: string | null;
    ratingAvg: number;
    responseRate: number;
    portfolioCount: number;
    creditBalance: number;
    priceMin: number | null;
    priceMax: number | null;
}

/**
 * 사전 필터 + 스코어링 + 상위 3개 추천 + bid_responses 자동 생성
 */
export async function scoreAndMatchVendors(
    _supabase: SupabaseClient<Database>,
    project: BidProjectRow,
): Promise<BidProjectScoreRow[]> {
    const admin = createSupabaseAdminClient();

    // 1. 인테리어 카테고리 ID 조회
    const interiorCategoryId = await getInteriorCategoryId(admin);
    if (!interiorCategoryId) {
        return [];
    }

    // 2. 인테리어 카테고리 승인된 업체 목록
    const candidates = await getEligibleVendors(admin, interiorCategoryId);
    if (candidates.length === 0) {
        return [];
    }

    // 3. 사전 필터 (포트폴리오 3건+, 크레딧 50만+)
    const filtered = candidates.filter(
        (v) => v.portfolioCount >= MIN_PORTFOLIO_COUNT && v.creditBalance >= MIN_CREDIT_BALANCE,
    );
    if (filtered.length === 0) {
        return [];
    }

    // 4. 개별 점수 계산
    const scored = filtered.map((v) => {
        const regionScore = v.regionPrimary && project.location.includes(v.regionPrimary) ? 1 : 0;
        const ratingScore = v.ratingAvg / 5.0;
        const responseScore = Math.min(v.responseRate, 1);
        const portfolioScore = Math.min(v.portfolioCount, 10) / 10;
        const priceScore = hasBudgetOverlap(
            project.budget_min,
            project.budget_max,
            v.priceMin,
            v.priceMax,
        )
            ? 1
            : 0;

        const totalScore =
            WEIGHTS.region * regionScore +
            WEIGHTS.rating * ratingScore +
            WEIGHTS.response * responseScore +
            WEIGHTS.portfolio * portfolioScore +
            WEIGHTS.price * priceScore;

        return {
            vendorId: v.vendorId,
            regionScore,
            ratingScore,
            responseScore,
            portfolioScore,
            priceScore,
            totalScore,
        };
    });

    // 5. 총점 내림차순 정렬 → 상위 3개 추천
    scored.sort((a, b) => b.totalScore - a.totalScore);
    const topVendors = scored.slice(0, RECOMMEND_COUNT);
    const recommendedVendorIds = new Set(topVendors.map((v) => v.vendorId));

    // 6. DB 저장 (scored 업체 전체 저장, 상위 3개만 is_recommended=true)
    const scoreInserts: Database["public"]["Tables"]["bid_project_scores"]["Insert"][] = scored.map((v) => ({
        project_id: project.id,
        vendor_id: v.vendorId,
        region_score: v.regionScore,
        rating_score: v.ratingScore,
        response_score: v.responseScore,
        portfolio_score: v.portfolioScore,
        price_score: v.priceScore,
        total_score: v.totalScore,
        is_recommended: recommendedVendorIds.has(v.vendorId),
    }));

    const scoreRows = await insertBidProjectScores(admin, scoreInserts);

    // 7. 추천 업체에 대해 bid_responses 자동 생성 (status=invited)
    const responseInserts: Database["public"]["Tables"]["bid_responses"]["Insert"][] = topVendors.map((v) => ({
        project_id: project.id,
        vendor_id: v.vendorId,
        status: "invited" as const,
    }));

    await insertBidResponses(admin, responseInserts);

    return scoreRows;
}

// ============================================
// Helpers
// ============================================

async function getInteriorCategoryId(supabase: SupabaseClient<Database>): Promise<string | null> {
    const { data, error } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", "%인테리어%")
        .limit(1)
        .maybeSingle();

    if (error) {
        console.warn("[scoring] 인테리어 카테고리 조회 실패:", error.message);
        return null;
    }

    return data?.id ?? null;
}

async function getEligibleVendors(
    supabase: SupabaseClient<Database>,
    categoryId: string,
): Promise<VendorCandidate[]> {
    // 인테리어 카테고리를 가진 승인된 업체
    const { data: vendorCategories, error: vcError } = await supabase
        .from("vendor_categories")
        .select("vendor_id")
        .eq("category_id", categoryId);

    if (vcError) {
        throw internalServerError("업체 카테고리 조회 실패", {
            message: vcError.message,
            code: vcError.code,
        });
    }

    const vendorIds = (vendorCategories ?? []).map((vc) => vc.vendor_id);
    if (vendorIds.length === 0) return [];

    // 업체 기본 정보
    const { data: vendors, error: vError } = await supabase
        .from("vendors")
        .select("id, region_primary, rating_avg, price_min, price_max")
        .in("id", vendorIds)
        .eq("status", "active");

    if (vError) {
        throw internalServerError("업체 정보 조회 실패", {
            message: vError.message,
            code: vError.code,
        });
    }

    if (!vendors || vendors.length === 0) return [];

    // 포트폴리오 개수
    const { data: portfolioCounts, error: pcError } = await supabase
        .from("vendor_portfolios")
        .select("vendor_id")
        .in("vendor_id", vendorIds);

    if (pcError) {
        throw internalServerError("포트폴리오 개수 조회 실패", {
            message: pcError.message,
            code: pcError.code,
        });
    }

    const portfolioCountMap = new Map<string, number>();
    for (const row of portfolioCounts ?? []) {
        portfolioCountMap.set(row.vendor_id, (portfolioCountMap.get(row.vendor_id) ?? 0) + 1);
    }

    // 크레딧 잔액
    const { data: credits, error: crError } = await supabase
        .from("credit_accounts")
        .select("vendor_id, balance")
        .in("vendor_id", vendorIds);

    if (crError) {
        throw internalServerError("크레딧 잔액 조회 실패", {
            message: crError.message,
            code: crError.code,
        });
    }

    const creditMap = new Map<string, number>();
    for (const row of credits ?? []) {
        creditMap.set(row.vendor_id, row.balance);
    }

    // 응답률 계산 (리드 기반)
    const { data: leadCounts, error: lcError } = await supabase
        .from("leads")
        .select("vendor_id, status")
        .in("vendor_id", vendorIds);

    if (lcError) {
        throw internalServerError("리드 통계 조회 실패", {
            message: lcError.message,
            code: lcError.code,
        });
    }

    const responseRateMap = new Map<string, number>();
    const totalLeadMap = new Map<string, number>();
    const respondedLeadMap = new Map<string, number>();
    for (const row of leadCounts ?? []) {
        totalLeadMap.set(row.vendor_id, (totalLeadMap.get(row.vendor_id) ?? 0) + 1);
        if (row.status !== "submitted") {
            respondedLeadMap.set(row.vendor_id, (respondedLeadMap.get(row.vendor_id) ?? 0) + 1);
        }
    }
    for (const [vid, total] of totalLeadMap) {
        responseRateMap.set(vid, total > 0 ? (respondedLeadMap.get(vid) ?? 0) / total : 0);
    }

    return vendors.map((v) => ({
        vendorId: v.id,
        regionPrimary: v.region_primary ?? null,
        ratingAvg: v.rating_avg ?? 0,
        responseRate: responseRateMap.get(v.id) ?? 0,
        portfolioCount: portfolioCountMap.get(v.id) ?? 0,
        creditBalance: creditMap.get(v.id) ?? 0,
        priceMin: v.price_min,
        priceMax: v.price_max,
    }));
}

function hasBudgetOverlap(
    budgetMin: number,
    budgetMax: number,
    vendorPriceMin: number | null,
    vendorPriceMax: number | null,
): boolean {
    if (budgetMin === 0 && budgetMax === 0) {
        return true;
    }

    if (vendorPriceMin == null && vendorPriceMax == null) {
        return false;
    }

    const projectMin = budgetMin > 0 ? budgetMin : 0;
    const projectMax = budgetMax > 0 ? budgetMax : Number.MAX_SAFE_INTEGER;
    const vendorMin = vendorPriceMin ?? 0;
    const vendorMax = vendorPriceMax ?? Number.MAX_SAFE_INTEGER;

    return vendorMin <= projectMax && vendorMax >= projectMin;
}
