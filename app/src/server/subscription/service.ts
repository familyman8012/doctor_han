import "server-only";

import type { Database, Json } from "@/lib/database.types";
import type { SubscriptionPlan, VendorSubscription } from "@/lib/schema/subscription";
import { badRequest, conflict, forbidden, internalServerError, notFound } from "@/server/api/errors";
import { mapCategoryRow } from "@/server/category/mapper";
import { fetchNotificationSettings, insertNotificationDelivery } from "@/server/notification/repository";
import { RESEND_FROM_EMAIL, resend } from "@/server/notification/resend";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapSubscriptionPlanRow, mapVendorSubscriptionRow, type VendorSubscriptionRow } from "./mapper";
import {
    getActiveSubscription,
    getVendorSubscriptionById,
    listActivePlans,
    listVendorSubscriptions,
    updateSubscriptionAutoRenew,
} from "./repository";

function isSubscriptionCurrentlyActive(row: Pick<VendorSubscriptionRow, "status" | "expires_at">): boolean {
    return row.status === "active" && new Date(row.expires_at).getTime() > Date.now();
}

function normalizeSubscriptionStatus(row: VendorSubscriptionRow): VendorSubscriptionRow {
    if (row.status === "active" && new Date(row.expires_at).getTime() <= Date.now()) {
        return { ...row, status: "expired" };
    }
    return row;
}

function mapPurchaseRpcError(message?: string): never {
    if (!message) {
        throw internalServerError("구독 구매 처리에 실패했습니다.");
    }

    if (message.includes("SUBSCRIPTION_PLAN_NOT_FOUND")) {
        throw notFound("구독 플랜을 찾을 수 없습니다.");
    }

    if (message.includes("VENDOR_CATEGORY_NOT_FOUND")) {
        throw badRequest("업체에 등록되지 않은 카테고리입니다.");
    }

    if (message.includes("SUBSCRIPTION_EXTENSION_WINDOW_NOT_REACHED")) {
        throw conflict("현재 구독 만료 7일 전부터 연장 구매할 수 있습니다.");
    }

    if (message.includes("Insufficient balance")) {
        throw badRequest("크레딧 잔액이 부족합니다.");
    }

    throw internalServerError("구독 구매 처리에 실패했습니다.", { message });
}

/**
 * 구독 플랜 목록 조회
 */
export async function listPlans(): Promise<{ items: SubscriptionPlan[] }> {
    const admin = createSupabaseAdminClient();
    const rows = await listActivePlans(admin);
    return { items: rows.map(mapSubscriptionPlanRow) };
}

/**
 * 구독 구매/연장: purchase_vendor_subscription RPC로 원자 처리
 */
export async function purchaseSubscription(
    _supabase: SupabaseClient<Database>,
    _userId: string,
    vendorId: string,
    body: { categoryId: string; planId: string; autoRenew?: boolean },
): Promise<{ subscription: VendorSubscription; creditBalance: number }> {
    const admin = createSupabaseAdminClient();

    const { data: rpcResult, error: rpcError } = await admin.rpc("purchase_vendor_subscription", {
        p_vendor_id: vendorId,
        p_category_id: body.categoryId,
        p_plan_id: body.planId,
        p_auto_renew: body.autoRenew ?? false,
        p_extension_window_days: 7,
    });

    if (rpcError) {
        mapPurchaseRpcError(rpcError.message);
    }

    const purchaseRow = (rpcResult?.[0] as
        | {
              subscription_id: string;
              new_balance: number;
              transaction_id: string;
              was_extended: boolean;
          }
        | undefined);

    if (!purchaseRow?.subscription_id) {
        throw internalServerError("구독 구매 결과가 올바르지 않습니다.", { rpcResult });
    }

    const subscriptionRow = await getVendorSubscriptionById(admin, purchaseRow.subscription_id);
    if (!subscriptionRow) {
        throw internalServerError("구독 생성 결과를 조회할 수 없습니다.", {
            subscriptionId: purchaseRow.subscription_id,
        });
    }

    if (subscriptionRow.vendor_id !== vendorId) {
        throw forbidden("해당 구독에 대한 권한이 없습니다.");
    }

    const normalizedRow = normalizeSubscriptionStatus(subscriptionRow);

    const { data: planRow } = await admin
        .from("subscription_plans")
        .select("*")
        .eq("id", normalizedRow.plan_id)
        .single();

    const plan = planRow ? mapSubscriptionPlanRow(planRow as import("./mapper").SubscriptionPlanRow) : undefined;

    const { data: categoryRow } = await admin
        .from("categories")
        .select("*")
        .eq("id", normalizedRow.category_id)
        .single();

    const category = categoryRow ? mapCategoryRow(categoryRow) : undefined;

    return {
        subscription: mapVendorSubscriptionRow(normalizedRow, plan, category),
        creditBalance: purchaseRow.new_balance,
    };
}

/**
 * 구독 목록 조회
 */
export async function listSubscriptions(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<{ items: VendorSubscription[] }> {
    const admin = createSupabaseAdminClient();

    const rows = await listVendorSubscriptions(admin, vendorId);

    if (rows.length === 0) {
        return { items: [] };
    }

    const normalizedRows = rows.map(normalizeSubscriptionStatus);

    const planIds = [...new Set(normalizedRows.map((r) => r.plan_id))];
    const { data: planRows } = await admin
        .from("subscription_plans")
        .select("*")
        .in("id", planIds);

    const planMap = new Map(
        (planRows ?? []).map((p) => [p.id, mapSubscriptionPlanRow(p as import("./mapper").SubscriptionPlanRow)]),
    );

    const categoryIds = [...new Set(normalizedRows.map((r) => r.category_id))];
    const { data: categoryRows } = await admin
        .from("categories")
        .select("*")
        .in("id", categoryIds);

    const categoryMap = new Map((categoryRows ?? []).map((c) => [c.id, mapCategoryRow(c)]));

    const items = normalizedRows.map((row) =>
        mapVendorSubscriptionRow(row, planMap.get(row.plan_id), categoryMap.get(row.category_id)),
    );

    return { items };
}

/**
 * 구독 상세 조회
 */
export async function getSubscriptionDetail(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
    subscriptionId: string,
): Promise<{ subscription: VendorSubscription }> {
    const admin = createSupabaseAdminClient();

    const row = await getVendorSubscriptionById(admin, subscriptionId);
    if (!row) {
        throw notFound("구독을 찾을 수 없습니다.");
    }
    if (row.vendor_id !== vendorId) {
        throw forbidden("해당 구독에 대한 권한이 없습니다.");
    }

    const normalizedRow = normalizeSubscriptionStatus(row);

    const { data: planRow } = await admin
        .from("subscription_plans")
        .select("*")
        .eq("id", normalizedRow.plan_id)
        .single();

    const plan = planRow ? mapSubscriptionPlanRow(planRow as import("./mapper").SubscriptionPlanRow) : undefined;

    const { data: categoryRow } = await admin
        .from("categories")
        .select("*")
        .eq("id", normalizedRow.category_id)
        .single();

    const category = categoryRow ? mapCategoryRow(categoryRow) : undefined;

    return { subscription: mapVendorSubscriptionRow(normalizedRow, plan, category) };
}

/**
 * 자동갱신 토글
 */
export async function toggleAutoRenew(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
    subscriptionId: string,
    autoRenew: boolean,
): Promise<{ subscription: VendorSubscription }> {
    const admin = createSupabaseAdminClient();

    const existing = await getVendorSubscriptionById(admin, subscriptionId);
    if (!existing) {
        throw notFound("구독을 찾을 수 없습니다.");
    }
    if (existing.vendor_id !== vendorId) {
        throw forbidden("해당 구독에 대한 권한이 없습니다.");
    }
    if (!isSubscriptionCurrentlyActive(existing)) {
        throw badRequest("활성 상태의 구독만 자동갱신을 설정할 수 있습니다.");
    }

    const updatedRow = await updateSubscriptionAutoRenew(admin, subscriptionId, autoRenew);
    const normalizedRow = normalizeSubscriptionStatus(updatedRow);

    const { data: planRow } = await admin
        .from("subscription_plans")
        .select("*")
        .eq("id", normalizedRow.plan_id)
        .single();

    const plan = planRow ? mapSubscriptionPlanRow(planRow as import("./mapper").SubscriptionPlanRow) : undefined;

    const { data: categoryRow } = await admin
        .from("categories")
        .select("*")
        .eq("id", normalizedRow.category_id)
        .single();

    const category = categoryRow ? mapCategoryRow(categoryRow) : undefined;

    return { subscription: mapVendorSubscriptionRow(normalizedRow, plan, category) };
}

/**
 * 활성 구독 확인 (8-1 연동용)
 */
export async function hasActiveSubscription(
    _supabase: SupabaseClient<Database>,
    vendorId: string,
    categoryId: string,
): Promise<boolean> {
    const admin = createSupabaseAdminClient();
    const row = await getActiveSubscription(admin, vendorId, categoryId);
    return row !== null;
}

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

type ExpiringSubscriptionRow = {
    id: string;
    vendor_id: string;
    category_id: string;
    plan_id: string;
    expires_at: string;
    auto_renew: boolean;
};

/**
 * 만료 7일/1일 전 이메일 알림 발송 (Cron)
 */
export async function sendSubscriptionExpiryReminders(daysBeforeList: number[] = [7, 1]): Promise<{
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
        if (![7, 1].includes(daysBefore)) {
            throw badRequest("알림 일수는 7 또는 1만 허용됩니다.");
        }

        const start = startOfTargetDay(daysBefore);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);

        const { data: expiringRows, error: expiringError } = await admin
            .from("vendor_subscriptions")
            .select("id, vendor_id, category_id, plan_id, expires_at, auto_renew")
            .eq("status", "active")
            .gte("expires_at", start.toISOString())
            .lt("expires_at", end.toISOString());

        if (expiringError) {
            throw internalServerError("만료 예정 구독을 조회할 수 없습니다.", {
                message: expiringError.message,
                code: expiringError.code,
            });
        }

        const rows = (expiringRows ?? []) as ExpiringSubscriptionRow[];
        if (rows.length === 0) {
            continue;
        }

        const subscriptionIds = rows.map((row) => row.id);
        const { data: sentLogRows, error: sentLogError } = await admin
            .from("vendor_subscription_reminder_logs")
            .select("subscription_id")
            .in("subscription_id", subscriptionIds)
            .eq("reminder_days_before", daysBefore);

        if (sentLogError) {
            throw internalServerError("구독 알림 로그를 조회할 수 없습니다.", {
                message: sentLogError.message,
                code: sentLogError.code,
            });
        }

        const sentSubscriptionIdSet = new Set((sentLogRows ?? []).map((row) => row.subscription_id));

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
            throw internalServerError("업체 사용자 프로필을 조회할 수 없습니다.", {
                message: profileError.message,
                code: profileError.code,
            });
        }

        const profileMap = new Map((profileRows ?? []).map((row) => [row.id, row]));

        const planIds = [...new Set(rows.map((row) => row.plan_id))];
        const { data: planRows, error: planError } = await admin
            .from("subscription_plans")
            .select("id, name")
            .in("id", planIds);

        if (planError) {
            throw internalServerError("구독 플랜 정보를 조회할 수 없습니다.", {
                message: planError.message,
                code: planError.code,
            });
        }

        const planNameById = new Map((planRows ?? []).map((row) => [row.id, row.name]));

        const categoryIds = [...new Set(rows.map((row) => row.category_id))];
        const { data: categoryRows, error: categoryError } = await admin
            .from("categories")
            .select("id, name")
            .in("id", categoryIds);

        if (categoryError) {
            throw internalServerError("카테고리 정보를 조회할 수 없습니다.", {
                message: categoryError.message,
                code: categoryError.code,
            });
        }

        const categoryNameById = new Map((categoryRows ?? []).map((row) => [row.id, row.name]));

        for (const row of rows) {
            if (sentSubscriptionIdSet.has(row.id)) {
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
            const categoryName = categoryNameById.get(row.category_id) ?? "카테고리";
            const expiresAtLabel = formatDateKst(row.expires_at);
            const autoRenewLabel = row.auto_renew ? "자동갱신: ON" : "자동갱신: OFF";

            const subject = `[메디허브] 구독 만료 ${daysBefore}일 전 알림`;
            const body = [
                `안녕하세요, ${profile.display_name ?? "파트너"}님.`,
                "",
                `${categoryName} 카테고리 구독(${planName})이 ${expiresAtLabel}에 만료됩니다.`,
                `만료까지 ${daysBefore}일 남았습니다.`,
                autoRenewLabel,
                "",
                "파트너센터에서 구독 상태를 확인해주세요.",
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
                    type: "subscription_expiring",
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
                    .from("vendor_subscription_reminder_logs")
                    .insert({
                        subscription_id: row.id,
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
                    type: "subscription_expiring",
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
