import "server-only";

import type { Database } from "@/lib/database.types";
import type { AdminAuditLogListQuery, AuditLogView } from "@/lib/schema/audit";
import { internalServerError } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

import { mapAuditLogRow, type AuditLogRowWithActor } from "./mapper";

/**
 * List audit logs with filters and pagination
 */
export async function listAuditLogs(
    supabase: SupabaseClient<Database>,
    query: AdminAuditLogListQuery,
): Promise<{ items: AuditLogView[]; total: number }> {
    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;

    let qb = supabase.from("audit_logs").select(
        `
            *,
            actor:profiles!audit_logs_actor_user_id_fkey(id, display_name, email)
        `,
        { count: "exact" },
    );

    // Apply filters
    if (query.action) {
        qb = qb.ilike("action", `${query.action}.%`);
    }

    if (query.targetType) {
        qb = qb.eq("target_type", query.targetType);
    }

    if (query.actorId) {
        qb = qb.eq("actor_user_id", query.actorId);
    }

    if (query.startDate) {
        // Start of day (inclusive)
        qb = qb.gte("created_at", `${query.startDate}T00:00:00.000Z`);
    }

    if (query.endDate) {
        // End of day (inclusive)
        qb = qb.lte("created_at", `${query.endDate}T23:59:59.999Z`);
    }

    // Order by created_at DESC for stable sorting
    qb = qb.order("created_at", { ascending: false });

    // Apply pagination
    const { data, error, count } = await qb.range(from, to);

    if (error) {
        throw internalServerError("감사 로그를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const items: AuditLogView[] = (data ?? []).map((row) =>
        mapAuditLogRow(row as AuditLogRowWithActor),
    );

    return {
        items,
        total: count ?? 0,
    };
}
