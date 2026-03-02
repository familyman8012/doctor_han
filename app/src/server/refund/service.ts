import "server-only";

import type { RefundRequest } from "@/lib/schema/refund";
import { badRequest, conflict, internalServerError, notFound } from "@/server/api/errors";
import { refundLeadCharge } from "@/server/lead/charge-service";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { mapRefundRequestRow } from "./mapper";
import {
    getRefundRequestByChargeId,
    getRefundRequestById,
    insertRefundRequest,
    listRefundRequestsAdmin,
    listRefundRequestsByVendor,
    updateRefundRequest,
} from "./repository";

// ============================================
// 1. 업체: 환불 요청 생성
// ============================================

const REFUND_REQUEST_DAYS_LIMIT = 7;

interface CreateRefundRequestParams {
    leadChargeId: string;
    vendorId: string;
    requesterUserId: string;
    reason: string;
    description?: string;
}

export async function createRefundRequest(params: CreateRefundRequestParams): Promise<RefundRequest> {
    const admin = createSupabaseAdminClient();
    const { leadChargeId, vendorId, requesterUserId, reason, description } = params;

    // 1. lead_charges 조회
    const { data: charge, error: chargeError } = await admin
        .from("lead_charges")
        .select("*")
        .eq("id", leadChargeId)
        .maybeSingle();

    if (chargeError || !charge) {
        throw notFound("해당 과금 내역을 찾을 수 없습니다.");
    }

    // 2. vendor_id 소유권 검증
    if (charge.vendor_id !== vendorId) {
        throw badRequest("본인 업체의 과금 내역만 환불 요청할 수 있습니다.");
    }

    // 3. status === 'charged' 검증
    if (charge.status !== "charged") {
        throw badRequest(`환불할 수 없는 상태입니다. 현재 상태: ${charge.status}`);
    }

    // 4. 7일 이내 검증
    const chargeDate = new Date(charge.created_at);
    const now = new Date();
    const diffDays = (now.getTime() - chargeDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > REFUND_REQUEST_DAYS_LIMIT) {
        throw badRequest(`과금일로부터 ${REFUND_REQUEST_DAYS_LIMIT}일 이내에만 환불 요청이 가능합니다.`);
    }

    // 5. 기존 요청 존재 여부 체크
    const existing = await getRefundRequestByChargeId(admin, leadChargeId);
    if (existing) {
        if (existing.status === "pending") {
            throw conflict("이미 심사 대기 중인 환불 요청이 있습니다.");
        }
        if (existing.status === "approved") {
            throw conflict("이미 승인된 환불 요청이 있습니다.");
        }
        if (existing.status === "rejected") {
            throw conflict("이미 거절된 환불 요청이 있습니다. 재요청이 필요한 경우 고객센터에 문의해주세요.");
        }
    }

    // 6. INSERT
    const row = await insertRefundRequest(admin, {
        lead_charge_id: leadChargeId,
        vendor_id: vendorId,
        requester_user_id: requesterUserId,
        reason: reason as Parameters<typeof insertRefundRequest>[1]["reason"],
        description,
    });

    return mapRefundRequestRow(row);
}

// ============================================
// 2. 업체: 내 환불 요청 목록
// ============================================

export async function getMyRefundRequests(
    vendorId: string,
    params: { status?: string; page: number; pageSize: number },
) {
    const admin = createSupabaseAdminClient();
    const { rows, total } = await listRefundRequestsByVendor(admin, {
        vendorId,
        ...params,
    });

    return {
        items: rows.map(mapRefundRequestRow),
        page: params.page,
        pageSize: params.pageSize,
        total,
    };
}

// ============================================
// 3. 관리자: 전체 환불 요청 목록
// ============================================

export async function getAdminRefundRequests(params: { status?: string; page: number; pageSize: number }) {
    const admin = createSupabaseAdminClient();
    const { rows, total } = await listRefundRequestsAdmin(admin, params);

    return {
        items: rows.map(mapRefundRequestRow),
        page: params.page,
        pageSize: params.pageSize,
        total,
    };
}

// ============================================
// 4. 관리자: 환불 심사 (승인/거절)
// ============================================

interface ReviewRefundRequestParams {
    requestId: string;
    action: "approve" | "reject";
    adminUserId: string;
    adminNote?: string;
}

export async function reviewRefundRequest(params: ReviewRefundRequestParams): Promise<RefundRequest> {
    const admin = createSupabaseAdminClient();
    const { requestId, action, adminUserId, adminNote } = params;

    // 1. request 조회
    const request = await getRefundRequestById(admin, requestId);

    // 2. pending 상태 검증
    if (request.status !== "pending") {
        throw badRequest(`이미 처리된 요청입니다. 현재 상태: ${request.status}`);
    }

    const now = new Date().toISOString();

    if (action === "approve") {
        // 3a. 승인 대상 lead_charge 상태 확인
        const { data: charge, error: chargeError } = await admin
            .from("lead_charges")
            .select("status")
            .eq("id", request.lead_charge_id)
            .maybeSingle();

        if (chargeError) {
            throw internalServerError("환불 대상 과금 내역을 조회할 수 없습니다.", {
                message: chargeError.message,
                code: chargeError.code,
            });
        }

        if (!charge) {
            throw notFound("환불 대상 과금 내역을 찾을 수 없습니다.");
        }

        if (charge.status !== "charged" && charge.status !== "refunded") {
            throw badRequest(`환불 승인할 수 없는 과금 상태입니다. 현재 상태: ${charge.status}`);
        }

        // 이미 환불 완료된 건은 재환불 없이 요청 상태만 승인 처리
        if (charge.status === "charged") {
            try {
                await refundLeadCharge(request.lead_charge_id, "admin_manual", adminUserId);
            } catch (error) {
                // 동시성 경합으로 이미 환불된 경우는 승인 처리로 수렴
                const { data: latestCharge, error: latestChargeError } = await admin
                    .from("lead_charges")
                    .select("status")
                    .eq("id", request.lead_charge_id)
                    .maybeSingle();

                if (latestChargeError) {
                    throw internalServerError("환불 상태 확인에 실패했습니다.", {
                        message: latestChargeError.message,
                        code: latestChargeError.code,
                    });
                }

                if (!latestCharge) {
                    throw notFound("환불 대상 과금 내역을 찾을 수 없습니다.");
                }

                if (latestCharge.status !== "refunded") {
                    throw error;
                }
            }
        }

        // request status -> approved
        const row = await updateRefundRequest(admin, requestId, {
            status: "approved",
            admin_note: adminNote,
            reviewed_by: adminUserId,
            reviewed_at: now,
        });

        return mapRefundRequestRow(row);
    }

    // 3b. 거절
    const row = await updateRefundRequest(admin, requestId, {
        status: "rejected",
        admin_note: adminNote,
        reviewed_by: adminUserId,
        reviewed_at: now,
    });

    return mapRefundRequestRow(row);
}
