import "server-only";

import type { Database } from "@/lib/database.types";
import type { AdminCreditAdjustType, CreditAccount, CreditPackage, CreditTransaction } from "@/lib/schema/credit";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { safeInsertAuditLog } from "@/server/audit/utils";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createPayment } from "@/server/payment/repository";
import { getClientKey } from "@/server/payment/toss-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapCreditAccountRow, mapCreditPackageRow, mapCreditTransactionRow } from "./mapper";
import {
    createPendingTransaction,
    getCreditAccount,
    getOrCreateCreditAccount,
    getPackageById,
    getPendingTransactionByPaymentId,
    listActivePackages,
    listCreditTransactions,
    updateAutoChargeSettings,
} from "./repository";

function getTransactionSource(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
        return null;
    }
    const source = (metadata as { source?: unknown }).source;
    return typeof source === "string" ? source : null;
}

interface PrepareChargeResult {
    orderId: string;
    amount: number;
    paymentId: string;
    clientKey: string;
    customerName: string;
    orderName: string;
}

/**
 * 충전 준비: 패키지 조회 → 계정 생성 → payment + pending transaction 생성 → 클라이언트 정보 반환
 */
export async function prepareCharge(
    _supabase: SupabaseClient<Database>,
    userId: string,
    vendorId: string,
    packageId: string,
    customerName: string,
): Promise<PrepareChargeResult> {
    const admin = createSupabaseAdminClient();

    // 패키지 조회
    const pkg = await getPackageById(admin, packageId);
    if (!pkg) {
        throw notFound("충전 패키지를 찾을 수 없습니다.");
    }

    // 크레딧 계정 get/create
    const account = await getOrCreateCreditAccount(admin, vendorId);

    // orderId 생성
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const orderId = `MDHB-${dateStr}-${randomPart}`;

    // payment 레코드 생성
    const payment = await createPayment(admin, {
        orderId,
        vendorId,
        userId,
        amount: pkg.amount,
    });

    // pending 크레딧 거래 생성
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await createPendingTransaction(admin, {
        creditAccountId: account.id,
        type: "charge",
        amount: pkg.amount,
        paymentId: payment.id,
        description: `${pkg.name} 충전`,
        expiresAt: expiresAt.toISOString(),
        metadata: { source: "manual" },
    });

    return {
        orderId,
        amount: pkg.amount,
        paymentId: payment.id,
        clientKey: getClientKey(),
        customerName,
        orderName: `메디허브 크레딧 ${pkg.name}`,
    };
}

/**
 * 충전 완료: RPC로 atomic balance update + 보너스 처리
 * payment confirm 후 또는 webhook에서 호출
 */
export async function completeCharge(
    _supabase: SupabaseClient<Database>,
    paymentId: string,
    vendorId: string,
): Promise<number> {
    const admin = createSupabaseAdminClient();

    // pending 트랜잭션 조회
    const pendingTx = await getPendingTransactionByPaymentId(admin, paymentId);
    if (!pendingTx) {
        throw notFound("대기 중인 크레딧 거래를 찾을 수 없습니다.");
    }

    // 이미 완료된 경우 멱등하게 현재 잔액 반환
    if (pendingTx.status === "completed") {
        const account = await getCreditAccount(admin, vendorId);
        return account?.balance ?? 0;
    }

    // 크레딧 계정 조회
    const account = await getCreditAccount(admin, vendorId);
    if (!account) {
        throw internalServerError("크레딧 계정을 찾을 수 없습니다.");
    }

    // RPC로 atomic balance update
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data: rpcResult, error: rpcError } = await admin.rpc("credit_balance_update", {
        p_credit_account_id: account.id,
        p_transaction_id: pendingTx.id,
        p_amount: pendingTx.amount,
        p_type: "charge",
        p_description: pendingTx.description ?? undefined,
        p_expires_at: expiresAt.toISOString(),
    });

    if (rpcError) {
        throw internalServerError("크레딧 잔액 업데이트에 실패했습니다.", {
            message: rpcError.message,
            code: rpcError.code,
        });
    }

    const newBalance = rpcResult?.[0]?.new_balance;

    // 자동충전 보너스 처리 (auto_charge_enabled이고 이 충전이 자동충전인 경우)
    const isAutoCharge = getTransactionSource(pendingTx.metadata) === "auto_charge";
    if (isAutoCharge && account.auto_charge_enabled && account.auto_charge_amount === pendingTx.amount) {
        const bonusAmount = Math.floor(pendingTx.amount * 0.02);
        if (bonusAmount > 0) {
            await admin.rpc("credit_balance_update", {
                p_credit_account_id: account.id,
                p_transaction_id: null as never, // Supabase types expect string, but SQL handles NULL
                p_amount: bonusAmount,
                p_type: "charge_bonus",
                p_description: "자동충전 보너스 (2%)",
                p_expires_at: expiresAt.toISOString(),
            });
        }
    }

    return newBalance ?? 0;
}

/**
 * 잔액 + 패키지 목록 조회
 */
export async function getBalance(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<{ account: CreditAccount; packages: CreditPackage[] }> {
    const admin = createSupabaseAdminClient();

    const [accountRow, packageRows] = await Promise.all([
        getOrCreateCreditAccount(admin, vendorId),
        listActivePackages(admin),
    ]);

    return {
        account: mapCreditAccountRow(accountRow),
        packages: packageRows.map(mapCreditPackageRow),
    };
}

/**
 * 거래 내역 조회
 */
export async function getTransactions(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
    params: { page: number; pageSize: number; type?: string },
): Promise<{ items: CreditTransaction[]; page: number; pageSize: number; total: number }> {
    const admin = createSupabaseAdminClient();

    const account = await getCreditAccount(admin, vendorId);
    if (!account) {
        return { items: [], page: params.page, pageSize: params.pageSize, total: 0 };
    }

    const { rows, total } = await listCreditTransactions(admin, account.id, params);

    return {
        items: rows.map(mapCreditTransactionRow),
        page: params.page,
        pageSize: params.pageSize,
        total,
    };
}

/**
 * 자동충전 설정 변경
 */
export async function updateAutoCharge(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
    params: { enabled: boolean; amount?: number },
): Promise<CreditAccount> {
    const admin = createSupabaseAdminClient();

    const account = await getOrCreateCreditAccount(admin, vendorId);

    if (params.enabled && !params.amount) {
        throw badRequest("자동충전 활성화 시 금액은 필수입니다.");
    }

    if (params.enabled && params.amount && params.amount < 50000) {
        throw badRequest("자동충전 최소 금액은 50,000원입니다.");
    }

    const updated = await updateAutoChargeSettings(admin, account.id, params);
    return mapCreditAccountRow(updated);
}

/**
 * 관리자 수동 크레딧 조정 (지급/차감)
 */
export async function adminAdjustCredit(params: {
    vendorId: string;
    amount: number;
    reason: string;
    adjustType: AdminCreditAdjustType;
    adminUserId: string;
}): Promise<{ transaction: CreditTransaction; newBalance: number }> {
    const admin = createSupabaseAdminClient();

    // vendor 존재 확인
    const { data: vendor, error: vendorError } = await admin
        .from("vendors")
        .select("id, name")
        .eq("id", params.vendorId)
        .maybeSingle();

    if (vendorError || !vendor) {
        throw notFound("업체를 찾을 수 없습니다.");
    }

    // 크레딧 계정 get/create
    const account = await getOrCreateCreditAccount(admin, params.vendorId);

    // 차감 시 잔액 검증
    if (params.amount < 0 && account.balance < Math.abs(params.amount)) {
        throw badRequest(
            `잔액이 부족합니다. 현재 잔액: ${account.balance.toLocaleString()}원`,
        );
    }

    // RPC로 atomic balance update (p_transaction_id=null → 신규 트랜잭션 생성)
    const description = `[${params.adjustType}] ${params.reason}`;
    const { data: rpcResult, error: rpcError } = await admin.rpc("credit_balance_update", {
        p_credit_account_id: account.id,
        p_transaction_id: null as never,
        p_amount: params.amount,
        p_type: "admin_adjust",
        p_description: description,
    });

    if (rpcError) {
        throw internalServerError("크레딧 조정에 실패했습니다.", {
            message: rpcError.message,
            code: rpcError.code,
        });
    }

    const newBalance = rpcResult?.[0]?.new_balance ?? 0;
    const transactionId = rpcResult?.[0]?.transaction_id;

    // 감사 로그
    await safeInsertAuditLog(
        admin,
        {
            actor_user_id: params.adminUserId,
            action: "credit.admin_adjust",
            target_type: "credit_account",
            target_id: account.id,
            metadata: {
                vendorId: params.vendorId,
                vendorName: vendor.name,
                amount: params.amount,
                adjustType: params.adjustType,
                reason: params.reason,
                newBalance,
            },
        },
        "adminAdjustCredit",
    );

    // 생성된 트랜잭션 조회
    const { data: txRow } = await admin
        .from("credit_transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

    if (!txRow) {
        throw internalServerError("생성된 트랜잭션을 조회할 수 없습니다.");
    }

    return {
        transaction: mapCreditTransactionRow(txRow),
        newBalance,
    };
}
