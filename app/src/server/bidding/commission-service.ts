import "server-only";

import type { Database } from "@/lib/database.types";
import type { BidContract } from "@/lib/schema/bidding";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapBidContract } from "./mapper";
import type { BidContractRow } from "./mapper";

const COMMISSION_RATE = 0.03;
const COMMISSION_MIN = 500_000;
const COMMISSION_MAX = 10_000_000;

/**
 * 수수료 금액 계산: clamp(계약금액 × 3%, 50만, 1000만)
 */
export function calculateCommission(contractAmount: number): number {
    const raw = Math.round(contractAmount * COMMISSION_RATE);
    return Math.max(COMMISSION_MIN, Math.min(COMMISSION_MAX, raw));
}

/**
 * 수수료 정산 (admin이 수동 트리거)
 * charge_bid_commission RPC 호출
 */
export async function settleBidCommission(
    _supabase: SupabaseClient<Database>,
    contractId: string,
): Promise<BidContract> {
    const admin = createSupabaseAdminClient();

    // 1. 계약 조회
    const { data: contractRow, error: fetchError } = await admin
        .from("bid_contracts")
        .select("*")
        .eq("id", contractId)
        .maybeSingle();

    if (fetchError) {
        throw internalServerError("계약 정보를 조회할 수 없습니다.", {
            message: fetchError.message,
            code: fetchError.code,
        });
    }

    if (!contractRow) {
        throw notFound("계약을 찾을 수 없습니다.");
    }

    const contract = contractRow as BidContractRow;

    if (contract.commission_status !== "pending") {
        throw badRequest(`이미 처리된 수수료입니다. 현재 상태: ${contract.commission_status}`);
    }

    // 2. RPC 호출
    const { error: rpcError } = await admin.rpc("charge_bid_commission", {
        p_contract_id: contractId,
        p_vendor_id: contract.vendor_id,
    });

    if (rpcError) {
        throw internalServerError("수수료 차감에 실패했습니다.", {
            message: rpcError.message,
            code: rpcError.code,
        });
    }

    // 3. 업데이트된 계약 다시 조회
    const { data: updatedRow, error: refetchError } = await admin
        .from("bid_contracts")
        .select("*")
        .eq("id", contractId)
        .single();

    if (refetchError || !updatedRow) {
        throw internalServerError("업데이트된 계약을 조회할 수 없습니다.");
    }

    return mapBidContract(updatedRow as BidContractRow);
}
