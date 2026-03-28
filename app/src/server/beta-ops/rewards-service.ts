import "server-only";

import type { BetaRewardItem } from "@/lib/schema/beta-ops";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { getVendorGradeMetrics } from "./service";

/**
 * 베타 보상 자격 현황 조회
 * - 각 vendor의 등급 메트릭스 + 베타 크레딧 지급 이력 통합
 */
export async function getBetaRewardStatus(): Promise<BetaRewardItem[]> {
    const admin = createSupabaseAdminClient();

    // 1. vendor 등급 메트릭스 조회 (전체 기간)
    const gradeItems = await getVendorGradeMetrics({});

    if (gradeItems.length === 0) {
        // vendor가 없어도 크레딧 계정이 있는 vendor 목록 반환
        const { data: accounts } = await admin
            .from("credit_accounts")
            .select("vendor_id, balance, vendors!inner(id, name)");

        if (!accounts || accounts.length === 0) return [];

        // 이 vendor들의 베타 크레딧 지급 이력 조회
        const vendorIds = accounts.map((a) => a.vendor_id);
        const betaGrants = await fetchBetaGrants(vendorIds);

        return accounts.map((a) => {
            const vendor = a.vendors as unknown as { id: string; name: string };
            const grants = betaGrants.get(a.vendor_id);
            return {
                vendorId: a.vendor_id,
                vendorName: vendor?.name ?? "",
                responseRate: 0,
                avgResponseTimeMinutes: null,
                totalLeads: 0,
                grade: "C" as const,
                initialGranted: grants?.initialGranted ?? false,
                initialGrantedAt: grants?.initialGrantedAt ?? null,
                bonusEligible: false,
                bonusGranted: grants?.bonusGranted ?? false,
                bonusGrantedAt: grants?.bonusGrantedAt ?? null,
                balance: a.balance,
            };
        });
    }

    // 2. 모든 vendor의 베타 크레딧 지급 이력 조회
    const vendorIds = gradeItems.map((g) => g.vendorId);

    // 크레딧 계정 잔액도 함께
    const { data: accounts } = await admin
        .from("credit_accounts")
        .select("vendor_id, balance")
        .in("vendor_id", vendorIds);

    const balanceMap = new Map((accounts ?? []).map((a) => [a.vendor_id, a.balance]));
    const betaGrants = await fetchBetaGrants(vendorIds);

    // 3. 통합 결과 구성
    return gradeItems.map((g) => {
        const grants = betaGrants.get(g.vendorId);
        // 보너스 자격: 응답률 ≥80%, 평균 응답시간 ≤24시간(1440분), 리드 ≥1건
        const bonusEligible =
            g.responseRate >= 0.8 &&
            g.avgResponseTimeMinutes !== null &&
            g.avgResponseTimeMinutes <= 1440 &&
            g.totalLeads >= 1;

        return {
            vendorId: g.vendorId,
            vendorName: g.vendorName,
            responseRate: g.responseRate,
            avgResponseTimeMinutes: g.avgResponseTimeMinutes,
            totalLeads: g.totalLeads,
            grade: g.grade,
            initialGranted: grants?.initialGranted ?? false,
            initialGrantedAt: grants?.initialGrantedAt ?? null,
            bonusEligible,
            bonusGranted: grants?.bonusGranted ?? false,
            bonusGrantedAt: grants?.bonusGrantedAt ?? null,
            balance: balanceMap.get(g.vendorId) ?? 0,
        };
    });
}

interface BetaGrantInfo {
    initialGranted: boolean;
    initialGrantedAt: string | null;
    bonusGranted: boolean;
    bonusGrantedAt: string | null;
}

async function fetchBetaGrants(
    vendorIds: string[],
): Promise<Map<string, BetaGrantInfo>> {
    const admin = createSupabaseAdminClient();
    const result = new Map<string, BetaGrantInfo>();

    if (vendorIds.length === 0) return result;

    // admin_adjust 트랜잭션 중 beta_initial / beta_bonus 설명을 가진 것 조회
    const { data: transactions } = await admin
        .from("credit_transactions")
        .select("credit_account_id, description, created_at, credit_accounts!inner(vendor_id)")
        .eq("type", "admin_adjust")
        .eq("status", "completed")
        .or("description.ilike.[beta_initial]%,description.ilike.[beta_bonus]%");

    if (!transactions) return result;

    for (const tx of transactions) {
        const vendorId = (tx.credit_accounts as unknown as { vendor_id: string }).vendor_id;
        if (!vendorIds.includes(vendorId)) continue;

        if (!result.has(vendorId)) {
            result.set(vendorId, {
                initialGranted: false,
                initialGrantedAt: null,
                bonusGranted: false,
                bonusGrantedAt: null,
            });
        }

        const info = result.get(vendorId)!;
        const desc = tx.description ?? "";

        if (desc.startsWith("[beta_initial]")) {
            info.initialGranted = true;
            info.initialGrantedAt = tx.created_at;
        } else if (desc.startsWith("[beta_bonus]")) {
            info.bonusGranted = true;
            info.bonusGrantedAt = tx.created_at;
        }
    }

    return result;
}
