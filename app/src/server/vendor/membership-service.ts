import "server-only";

import type { Database, Json } from "@/lib/database.types";
import type { MembershipPlan, VendorMembership } from "@/lib/schema/vendor-membership";
import { badRequest, forbidden, internalServerError, notFound } from "@/server/api/errors";
import { fetchNotificationSettings, insertNotificationDelivery } from "@/server/notification/repository";
import { RESEND_FROM_EMAIL, resend } from "@/server/notification/resend";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
    mapMembershipPlanRow,
    mapVendorMembershipRow,
    type MembershipPlanRow,
    type VendorMembershipRow,
} from "./membership-mapper";
import {
    getActiveMembership,
    getMembershipById,
    listActiveMembershipPlans,
    listAllMemberships,
} from "./membership-repository";

/**
 * 멤버십 출시 후 30일간 유예기간 종료일.
 * 유예기간이 끝나면 이 상수를 삭제하면 된다.
 */
const MEMBERSHIP_GRACE_PERIOD_END = "2026-04-01T00:00:00+09:00";

function isMembershipCurrentlyActive(row: Pick<VendorMembershipRow, "status" | "expires_at">): boolean {
    return row.status === "active" && new Date(row.expires_at).getTime() > Date.now();
}

function normalizeMembershipStatus(row: VendorMembershipRow): VendorMembershipRow {
    if (row.status === "active" && new Date(row.expires_at).getTime() <= Date.now()) {
        return { ...row, status: "expired" };
    }
    return row;
}

function mapPurchaseRpcError(message?: string): never {
    if (!message) {
        throw internalServerError("멤버십 구매 처리에 실패했습니다.");
    }

    if (message.includes("MEMBERSHIP_PLAN_NOT_FOUND")) {
        throw notFound("멤버십 플랜을 찾을 수 없습니다.");
    }

    if (message.includes("VENDOR_NOT_S_GRADE")) {
        throw badRequest("S등급 카테고리에 소속되지 않은 업체입니다.");
    }

    if (message.includes("CREDIT_ACCOUNT_NOT_FOUND")) {
        throw internalServerError("크레딧 계정을 찾을 수 없습니다.");
    }

    if (message.includes("Insufficient balance")) {
        throw badRequest("크레딧 잔액이 부족합니다.");
    }

    throw internalServerError("멤버십 구매 처리에 실패했습니다.", { message });
}

/**
 * 업체가 S등급 카테고리에 소속되어 있는지 확인
 */
async function isVendorSGrade(admin: SupabaseClient<Database>, vendorId: string): Promise<boolean> {
    const { data, error } = await admin
        .from("vendor_categories")
        .select("category_id, categories!inner(tier)")
        .eq("vendor_id", vendorId)
        .eq("categories.tier", "s_grade")
        .limit(1);

    if (error) {
        throw internalServerError("업체 카테고리를 확인할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return (data ?? []).length > 0;
}

/**
 * 유예기간 여부 확인
 */
function isInGracePeriod(): boolean {
    return new Date().getTime() < new Date(MEMBERSHIP_GRACE_PERIOD_END).getTime();
}

// ============================================
// Public API
// ============================================

/**
 * 멤버십 플랜 목록 조회
 */
export async function listMembershipPlans(): Promise<{ items: MembershipPlan[] }> {
    const admin = createSupabaseAdminClient();
    const rows = await listActiveMembershipPlans(admin);
    return { items: rows.map(mapMembershipPlanRow) };
}

/**
 * 멤버십 상태 조회 (파트너 대시보드용)
 */
export async function getMembershipStatus(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<{
    membership: VendorMembership | null;
    isRequired: boolean;
    inGracePeriod: boolean;
}> {
    const admin = createSupabaseAdminClient();

    const isSGrade = await isVendorSGrade(admin, vendorId);

    if (!isSGrade) {
        return { membership: null, isRequired: false, inGracePeriod: false };
    }

    const row = await getActiveMembership(admin, vendorId);

    let membership: VendorMembership | null = null;
    if (row) {
        const normalized = normalizeMembershipStatus(row);
        const { data: planRow } = await admin
            .from("membership_plans")
            .select("*")
            .eq("id", normalized.plan_id)
            .single();

        const plan = planRow ? mapMembershipPlanRow(planRow as MembershipPlanRow) : undefined;
        membership = mapVendorMembershipRow(normalized, plan);
    }

    return {
        membership,
        isRequired: true,
        inGracePeriod: isInGracePeriod(),
    };
}

/**
 * 멤버십 구매 (크레딧 차감)
 */
export async function purchaseMembership(
    _supabase: SupabaseClient<Database>,
    _userId: string,
    vendorId: string,
    body: { planId: string; autoRenew?: boolean },
): Promise<{ membership: VendorMembership; creditBalance: number }> {
    const admin = createSupabaseAdminClient();

    const { data: rpcResult, error: rpcError } = await admin.rpc("purchase_vendor_membership", {
        p_vendor_id: vendorId,
        p_plan_id: body.planId,
        p_auto_renew: body.autoRenew ?? false,
    });

    if (rpcError) {
        mapPurchaseRpcError(rpcError.message);
    }

    const purchaseRow = (rpcResult?.[0] as
        | {
              membership_id: string;
              new_balance: number;
              transaction_id: string;
              was_extended: boolean;
          }
        | undefined);

    if (!purchaseRow?.membership_id) {
        throw internalServerError("멤버십 구매 결과가 올바르지 않습니다.", { rpcResult });
    }

    const membershipRow = await getMembershipById(admin, purchaseRow.membership_id);
    if (!membershipRow) {
        throw internalServerError("멤버십 생성 결과를 조회할 수 없습니다.", {
            membershipId: purchaseRow.membership_id,
        });
    }

    if (membershipRow.vendor_id !== vendorId) {
        throw forbidden("해당 멤버십에 대한 권한이 없습니다.");
    }

    const normalizedRow = normalizeMembershipStatus(membershipRow);

    const { data: planRow } = await admin
        .from("membership_plans")
        .select("*")
        .eq("id", normalizedRow.plan_id)
        .single();

    const plan = planRow ? mapMembershipPlanRow(planRow as MembershipPlanRow) : undefined;

    return {
        membership: mapVendorMembershipRow(normalizedRow, plan),
        creditBalance: purchaseRow.new_balance,
    };
}

/**
 * 활성 멤버십 확인 (리드 차단용)
 */
export async function hasActiveMembership(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<boolean> {
    const admin = createSupabaseAdminClient();
    const row = await getActiveMembership(admin, vendorId);
    return row !== null && isMembershipCurrentlyActive(row);
}

/**
 * Admin: 멤버십 목록 조회
 */
export async function listMembershipsAdmin(
    params: { status?: string; vendorId?: string; page: number; pageSize: number },
): Promise<{
    items: (VendorMembership & { vendorName?: string })[];
    page: number;
    pageSize: number;
    total: number;
}> {
    const admin = createSupabaseAdminClient();
    const { rows, total } = await listAllMemberships(admin, params);

    if (rows.length === 0) {
        return { items: [], page: params.page, pageSize: params.pageSize, total };
    }

    const normalizedRows = rows.map(normalizeMembershipStatus);

    // Batch fetch plans
    const planIds = [...new Set(normalizedRows.map((r) => r.plan_id))];
    const { data: planRows } = await admin
        .from("membership_plans")
        .select("*")
        .in("id", planIds);

    const planMap = new Map(
        (planRows ?? []).map((p) => [p.id, mapMembershipPlanRow(p as MembershipPlanRow)]),
    );

    // Batch fetch vendor names
    const vendorIds = [...new Set(normalizedRows.map((r) => r.vendor_id))];
    const { data: vendorRows } = await admin
        .from("vendors")
        .select("id, name")
        .in("id", vendorIds);

    const vendorNameMap = new Map((vendorRows ?? []).map((v) => [v.id, v.name]));

    const items = normalizedRows.map((row) => ({
        ...mapVendorMembershipRow(row, planMap.get(row.plan_id)),
        vendorName: vendorNameMap.get(row.vendor_id),
    }));

    return { items, page: params.page, pageSize: params.pageSize, total };
}

/**
 * Admin: 멤버십 취소
 */
export async function cancelMembershipAdmin(membershipId: string): Promise<{ membership: VendorMembership }> {
    const admin = createSupabaseAdminClient();

    const row = await getMembershipById(admin, membershipId);
    if (!row) {
        throw notFound("멤버십을 찾을 수 없습니다.");
    }

    if (row.status !== "active") {
        throw badRequest("활성 상태의 멤버십만 취소할 수 있습니다.");
    }

    const { error } = await admin
        .from("vendor_memberships")
        .update({ status: "canceled", canceled_at: new Date().toISOString() })
        .eq("id", membershipId);

    if (error) {
        throw internalServerError("멤버십 취소에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const updatedRow = await getMembershipById(admin, membershipId);
    if (!updatedRow) {
        throw internalServerError("취소된 멤버십을 조회할 수 없습니다.");
    }

    const { data: planRow } = await admin
        .from("membership_plans")
        .select("*")
        .eq("id", updatedRow.plan_id)
        .single();

    const plan = planRow ? mapMembershipPlanRow(planRow as MembershipPlanRow) : undefined;

    return { membership: mapVendorMembershipRow(updatedRow, plan) };
}

// ============================================
// Cron: Expiry Reminders
// ============================================

function startOfTargetDay(daysBefore: number): Date {
    const now = new Date();
    const target = new Date(now);
    target.setDate(now.getDate() + daysBefore);
    target.setHours(0, 0, 0, 0);
    return target;
}

function formatDateKst(iso: string): string {
    return new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}

type ExpiringMembershipRow = {
    id: string;
    vendor_id: string;
    plan_id: string;
    expires_at: string;
    auto_renew: boolean;
};

export async function sendMembershipExpiryReminders(daysBeforeList: number[] = [30, 7]): Promise<{
    processed: number;
    sent: number;
    skipped: number;
    failed: number;
}> {
    const admin = createSupabaseAdminClient();

    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const daysBefore of daysBeforeList) {
        if (![30, 7].includes(daysBefore)) {
            throw badRequest("알림 일수는 30 또는 7만 허용됩니다.");
        }

        const start = startOfTargetDay(daysBefore);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);

        const { data: expiringRows, error: expiringError } = await admin
            .from("vendor_memberships")
            .select("id, vendor_id, plan_id, expires_at, auto_renew")
            .eq("status", "active")
            .gte("expires_at", start.toISOString())
            .lt("expires_at", end.toISOString());

        if (expiringError) {
            throw internalServerError("만료 예정 멤버십을 조회할 수 없습니다.", {
                message: expiringError.message,
                code: expiringError.code,
            });
        }

        const rows = (expiringRows ?? []) as ExpiringMembershipRow[];
        if (rows.length === 0) continue;

        const membershipIds = rows.map((row) => row.id);
        const { data: sentLogRows, error: sentLogError } = await admin
            .from("vendor_membership_reminder_logs")
            .select("membership_id")
            .in("membership_id", membershipIds)
            .eq("reminder_days_before", daysBefore);

        if (sentLogError) {
            throw internalServerError("멤버십 알림 로그를 조회할 수 없습니다.", {
                message: sentLogError.message,
                code: sentLogError.code,
            });
        }

        const sentMembershipIdSet = new Set((sentLogRows ?? []).map((row) => row.membership_id));

        const vendorIds = [...new Set(rows.map((row) => row.vendor_id))];
        const { data: vendorRows, error: vendorError } = await admin
            .from("vendors")
            .select("id, owner_user_id")
            .in("id", vendorIds);

        if (vendorError) {
            throw internalServerError("업체 정보를 조회할 수 없습니다.", {
                message: vendorError.message,
                code: vendorError.code,
            });
        }

        const ownerUserIdByVendorId = new Map((vendorRows ?? []).map((row) => [row.id, row.owner_user_id]));

        const ownerUserIds = [...new Set((vendorRows ?? []).map((row) => row.owner_user_id))];
        const { data: profileRows, error: profileError } = await admin
            .from("profiles")
            .select("id, display_name, email")
            .in("id", ownerUserIds);

        if (profileError) {
            throw internalServerError("프로필을 조회할 수 없습니다.", {
                message: profileError.message,
                code: profileError.code,
            });
        }

        const profileMap = new Map((profileRows ?? []).map((row) => [row.id, row]));

        const planIds = [...new Set(rows.map((row) => row.plan_id))];
        const { data: planRows, error: planError } = await admin
            .from("membership_plans")
            .select("id, name")
            .in("id", planIds);

        if (planError) {
            throw internalServerError("멤버십 플랜 정보를 조회할 수 없습니다.", {
                message: planError.message,
                code: planError.code,
            });
        }

        const planNameById = new Map((planRows ?? []).map((row) => [row.id, row.name]));

        for (const row of rows) {
            if (sentMembershipIdSet.has(row.id)) {
                skipped += 1;
                continue;
            }

            processed += 1;

            const ownerUserId = ownerUserIdByVendorId.get(row.vendor_id);
            if (!ownerUserId) {
                skipped += 1;
                continue;
            }

            const settings = await fetchNotificationSettings(admin, ownerUserId);
            if (settings && !settings.email_enabled) {
                skipped += 1;
                continue;
            }

            const profile = profileMap.get(ownerUserId);
            if (!profile?.email) {
                skipped += 1;
                continue;
            }

            const planName = planNameById.get(row.plan_id) ?? "플랜";
            const expiresAtLabel = formatDateKst(row.expires_at);
            const autoRenewLabel = row.auto_renew ? "자동갱신: ON" : "자동갱신: OFF";

            const subject = `[메디허브] 입점 멤버십 만료 ${daysBefore}일 전 알림`;
            const body = [
                `안녕하세요, ${profile.display_name ?? "파트너"}님.`,
                "",
                `입점 멤버십(${planName})이 ${expiresAtLabel}에 만료됩니다.`,
                `만료까지 ${daysBefore}일 남았습니다.`,
                autoRenewLabel,
                "",
                "파트너센터에서 멤버십 상태를 확인해주세요.",
                "감사합니다.",
                "메디허브 팀",
            ].join("\n");

            try {
                const providerResponse = await resend.emails.send({
                    from: RESEND_FROM_EMAIL,
                    to: profile.email,
                    subject,
                    text: body,
                });

                await insertNotificationDelivery(admin, {
                    userId: ownerUserId,
                    type: "membership_expiring",
                    channel: "email",
                    provider: "resend",
                    recipient: profile.email,
                    subject,
                    bodyPreview: body.slice(0, 200),
                    providerResponse: providerResponse as Json,
                    sentAt: new Date().toISOString(),
                    retryCount: 0,
                    maxRetries: 0,
                    status: "sent",
                });

                const { error: reminderLogError } = await admin
                    .from("vendor_membership_reminder_logs")
                    .insert({
                        membership_id: row.id,
                        reminder_days_before: daysBefore,
                        sent_at: new Date().toISOString(),
                    });

                if (reminderLogError && reminderLogError.code !== "23505") {
                    throw reminderLogError;
                }

                sent += 1;
            } catch (error) {
                failed += 1;

                const errorMessage = error instanceof Error ? error.message : "Unknown error";

                await insertNotificationDelivery(admin, {
                    userId: ownerUserId,
                    type: "membership_expiring",
                    channel: "email",
                    provider: "resend",
                    recipient: profile.email,
                    subject,
                    bodyPreview: body.slice(0, 200),
                    failedAt: new Date().toISOString(),
                    errorMessage,
                    retryCount: 0,
                    maxRetries: 0,
                    status: "failed",
                });
            }
        }
    }

    return { processed, sent, skipped, failed };
}
