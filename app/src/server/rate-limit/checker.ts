import type { Json } from "@/lib/database.types";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { RATE_LIMIT_CONFIG } from "./config";
import type { RateLimitAction, RateLimitCheckResult } from "./types";

function getWindowStart(windowType: "daily" | "weekly"): Date {
    const now = new Date();
    if (windowType === "daily") {
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    return monday;
}

function getWindowEnd(windowStart: Date, windowType: "daily" | "weekly"): Date {
    if (windowType === "daily") {
        return new Date(windowStart.getTime() + 24 * 60 * 60 * 1000);
    }
    return new Date(windowStart.getTime() + 7 * 24 * 60 * 60 * 1000);
}

export async function checkRateLimit(
    userId: string,
    action: RateLimitAction,
    targetId?: string,
): Promise<RateLimitCheckResult> {
    const config = RATE_LIMIT_CONFIG[action];
    if (!config) {
        return { allowed: true };
    }

    const admin = createSupabaseAdminClient();

    if (config.sameTargetCooldownHours && targetId) {
        const cooldownHours = config.sameTargetCooldownHours;
        const cooldownStart = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);

        const { data: recentSameTarget } = await admin
            .from("rate_limits")
            .select("created_at")
            .eq("user_id", userId)
            .eq("action", action)
            .eq("target_id", targetId)
            .gte("created_at", cooldownStart.toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (recentSameTarget) {
            const createdAt = new Date(recentSameTarget.created_at);
            const resetAt = new Date(createdAt.getTime() + cooldownHours * 60 * 60 * 1000);
            const retryAfterSeconds = Math.ceil((resetAt.getTime() - Date.now()) / 1000);

            return {
                allowed: false,
                resetAt,
                retryAfterSeconds: Math.max(0, retryAfterSeconds),
            };
        }
    }

    if (config.daily) {
        const dailyWindowStart = getWindowStart("daily");

        const { data: dailyCounts } = await admin
            .from("rate_limits")
            .select("request_count")
            .eq("user_id", userId)
            .eq("action", action)
            .is("target_id", null)
            .eq("window_start", dailyWindowStart.toISOString());

        const dailyTotal = (dailyCounts ?? []).reduce((sum: number, row: { request_count: number }) => sum + row.request_count, 0);
        if (dailyTotal >= config.daily) {
            const resetAt = getWindowEnd(dailyWindowStart, "daily");
            const retryAfterSeconds = Math.ceil((resetAt.getTime() - Date.now()) / 1000);

            return {
                allowed: false,
                remaining: 0,
                resetAt,
                retryAfterSeconds: Math.max(0, retryAfterSeconds),
            };
        }
    }

    if (config.weekly) {
        const weeklyWindowStart = getWindowStart("weekly");

        const { data: weeklyCounts } = await admin
            .from("rate_limits")
            .select("request_count")
            .eq("user_id", userId)
            .eq("action", action)
            .is("target_id", null)
            .gte("window_start", weeklyWindowStart.toISOString());

        const weeklyTotal = (weeklyCounts ?? []).reduce((sum: number, row: { request_count: number }) => sum + row.request_count, 0);
        if (weeklyTotal >= config.weekly) {
            const resetAt = getWindowEnd(weeklyWindowStart, "weekly");
            const retryAfterSeconds = Math.ceil((resetAt.getTime() - Date.now()) / 1000);

            return {
                allowed: false,
                remaining: 0,
                resetAt,
                retryAfterSeconds: Math.max(0, retryAfterSeconds),
            };
        }
    }

    const remaining = config.daily ? config.daily - ((await getDailyCount(admin, userId, action)) + 1) : undefined;
    return { allowed: true, remaining };
}

async function getDailyCount(
    admin: ReturnType<typeof createSupabaseAdminClient>,
    userId: string,
    action: RateLimitAction,
): Promise<number> {
    const dailyWindowStart = getWindowStart("daily");
    const { data } = await admin
        .from("rate_limits")
        .select("request_count")
        .eq("user_id", userId)
        .eq("action", action)
        .is("target_id", null)
        .eq("window_start", dailyWindowStart.toISOString());

    return (data ?? []).reduce((sum: number, row: { request_count: number }) => sum + row.request_count, 0);
}

export async function incrementRateLimit(userId: string, action: RateLimitAction, targetId?: string): Promise<void> {
    const admin = createSupabaseAdminClient();
    const dailyWindowStart = getWindowStart("daily");

    if (targetId) {
        await admin.from("rate_limits").insert({
            user_id: userId,
            action,
            target_id: targetId,
            window_start: dailyWindowStart.toISOString(),
            request_count: 1,
        });
    }

    const { data: existing } = await admin
        .from("rate_limits")
        .select("id, request_count")
        .eq("user_id", userId)
        .eq("action", action)
        .is("target_id", null)
        .eq("window_start", dailyWindowStart.toISOString())
        .maybeSingle();

    if (existing) {
        await admin
            .from("rate_limits")
            .update({ request_count: existing.request_count + 1 })
            .eq("id", existing.id);
    } else {
        await admin.from("rate_limits").insert({
            user_id: userId,
            action,
            target_id: null,
            window_start: dailyWindowStart.toISOString(),
            request_count: 1,
        });
    }
}

export async function logRateLimitExceeded(
    userId: string,
    action: RateLimitAction,
    metadata: { [key: string]: Json | undefined },
): Promise<void> {
    const admin = createSupabaseAdminClient();

    await admin.from("audit_logs").insert({
        actor_user_id: userId,
        action: "rate_limit_exceeded",
        target_type: action,
        target_id: null,
        metadata,
    });
}
