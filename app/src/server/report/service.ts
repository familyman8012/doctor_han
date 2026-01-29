import "server-only";

import type { Database, Tables, TablesInsert } from "@/lib/database.types";
import type {
    AdminReportListItem,
    AdminReportListQuery,
    AdminReportResolveBody,
    AdminReportView,
    AdminSanctionListQuery,
    SanctionView,
} from "@/lib/schema/report";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

import { mapReportToListItem, mapReportToView, mapSanctionToView } from "./mapper";

type ReportRow = Tables<"reports">;

const AUTO_BLIND_THRESHOLD = 5;

function escapeLike(value: string): string {
    return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

/**
 * Get target summary based on target type
 */
async function getTargetSummary(
    supabase: SupabaseClient<Database>,
    targetType: ReportRow["target_type"],
    targetId: string,
): Promise<string> {
    switch (targetType) {
        case "review": {
            const { data } = await supabase
                .from("reviews")
                .select("content, vendor:vendors!reviews_vendor_id_fkey(name)")
                .eq("id", targetId)
                .single();
            if (!data) return `[삭제된 리뷰] ${targetId}`;
            const vendorName = (data.vendor as { name: string } | null)?.name ?? "업체";
            return `${vendorName}: ${data.content.slice(0, 50)}${data.content.length > 50 ? "..." : ""}`;
        }
        case "vendor": {
            const { data } = await supabase
                .from("vendors")
                .select("name")
                .eq("id", targetId)
                .single();
            if (!data) return `[삭제된 업체] ${targetId}`;
            return data.name;
        }
        case "profile": {
            const { data } = await supabase
                .from("profiles")
                .select("display_name, email")
                .eq("id", targetId)
                .single();
            if (!data) return `[삭제된 사용자] ${targetId}`;
            return data.display_name ?? data.email ?? targetId;
        }
        default:
            return targetId;
    }
}

/**
 * Get report list for admin
 */
export async function getReportList(
    supabase: SupabaseClient<Database>,
    query: AdminReportListQuery,
): Promise<{ items: AdminReportListItem[]; total: number }> {
    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;

    let qb = supabase.from("reports").select(
        `
            *,
            reporter_user:profiles!reports_reporter_user_id_fkey(id, display_name, email)
        `,
        { count: "exact" },
    );

    if (query.targetType) {
        qb = qb.eq("target_type", query.targetType);
    }

    if (query.status) {
        qb = qb.eq("status", query.status);
    }

    if (query.q) {
        const escaped = escapeLike(query.q);
        qb = qb.or(
            `target_id.ilike.%${escaped}%,reporter_user.display_name.ilike.%${escaped}%`,
        );
    }

    qb = qb.order("created_at", { ascending: false });

    const { data, error, count } = await qb.range(from, to);

    if (error) {
        throw internalServerError("신고 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    // Get target summaries for each report
    const items: AdminReportListItem[] = [];
    for (const row of data ?? []) {
        const targetSummary = await getTargetSummary(supabase, row.target_type, row.target_id);
        items.push(mapReportToListItem(row as any, targetSummary));
    }

    return {
        items,
        total: count ?? 0,
    };
}

/**
 * Get report detail for admin
 */
export async function getReportDetail(
    supabase: SupabaseClient<Database>,
    reportId: string,
): Promise<{ report: AdminReportView; targetReportCount: number; sanctions: SanctionView[] }> {
    // Get report with relations
    const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .select(
            `
            *,
            reporter_user:profiles!reports_reporter_user_id_fkey(id, display_name, email),
            reviewed_by_user:profiles!reports_reviewed_by_fkey(id, display_name),
            resolved_by_user:profiles!reports_resolved_by_fkey(id, display_name)
        `,
        )
        .eq("id", reportId)
        .single();

    if (reportError || !reportData) {
        throw notFound("신고를 찾을 수 없습니다.");
    }

    const targetSummary = await getTargetSummary(
        supabase,
        reportData.target_type,
        reportData.target_id,
    );

    // Get target report count
    const { count: targetReportCount } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("target_type", reportData.target_type)
        .eq("target_id", reportData.target_id);

    // Get sanctions for the target
    const { data: sanctionsData, error: sanctionsError } = await supabase
        .from("sanctions")
        .select(
            `
            *,
            created_by_user:profiles!sanctions_created_by_fkey(id, display_name),
            revoked_by_user:profiles!sanctions_revoked_by_fkey(id, display_name)
        `,
        )
        .eq("target_type", reportData.target_type)
        .eq("target_id", reportData.target_id)
        .order("created_at", { ascending: false });

    if (sanctionsError) {
        throw internalServerError("제재 이력을 조회할 수 없습니다.", {
            message: sanctionsError.message,
            code: sanctionsError.code,
        });
    }

    return {
        report: mapReportToView(reportData as any, targetSummary),
        targetReportCount: targetReportCount ?? 0,
        sanctions: (sanctionsData ?? []).map((row) => mapSanctionToView(row as any)),
    };
}

/**
 * Start review for a report (pending -> reviewing)
 */
export async function startReview(
    supabase: SupabaseClient<Database>,
    reportId: string,
    adminUserId: string,
): Promise<{ report: AdminReportView }> {
    // Get report
    const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

    if (reportError || !reportData) {
        throw notFound("신고를 찾을 수 없습니다.");
    }

    if (reportData.status !== "pending") {
        throw badRequest("접수 상태의 신고만 심사를 시작할 수 있습니다.");
    }

    // Update report status
    const { error: updateError } = await supabase
        .from("reports")
        .update({
            status: "reviewing",
            reviewed_by: adminUserId,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

    if (updateError) {
        throw internalServerError("신고 상태를 변경할 수 없습니다.", {
            message: updateError.message,
            code: updateError.code,
        });
    }

    // Get updated report
    const result = await getReportDetail(supabase, reportId);
    return { report: result.report };
}

/**
 * Resolve report with optional sanction
 */
export async function resolveReport(
    supabase: SupabaseClient<Database>,
    reportId: string,
    adminUserId: string,
    body: AdminReportResolveBody,
): Promise<{ report: AdminReportView; sanction?: SanctionView }> {
    // Get report
    const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

    if (reportError || !reportData) {
        throw notFound("신고를 찾을 수 없습니다.");
    }

    if (reportData.status === "resolved" || reportData.status === "dismissed") {
        throw badRequest("이미 처리된 신고입니다.");
    }

    const now = new Date().toISOString();
    let sanction: SanctionView | undefined;

    // Update report status
    const { error: updateError } = await supabase
        .from("reports")
        .update({
            status: "resolved",
            resolved_by: adminUserId,
            resolved_at: now,
            resolution_note: body.reason,
            updated_at: now,
        })
        .eq("id", reportId);

    if (updateError) {
        throw internalServerError("신고를 처리할 수 없습니다.", {
            message: updateError.message,
            code: updateError.code,
        });
    }

    // Create sanction if sanctionType is provided
    if (body.sanctionType) {
        const startsAt = now;
        let endsAt: string | null = null;

        if (body.sanctionType === "suspension" && body.durationDays) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + body.durationDays);
            endsAt = endDate.toISOString();
        }

        const sanctionInsert: TablesInsert<"sanctions"> = {
            target_type: reportData.target_type,
            target_id: reportData.target_id,
            report_id: reportId,
            sanction_type: body.sanctionType,
            status: "active",
            reason: body.reason,
            duration_days: body.durationDays ?? null,
            starts_at: startsAt,
            ends_at: endsAt,
            created_by: adminUserId,
        };

        const { data: sanctionData, error: sanctionError } = await supabase
            .from("sanctions")
            .insert(sanctionInsert)
            .select(
                `
                *,
                created_by_user:profiles!sanctions_created_by_fkey(id, display_name),
                revoked_by_user:profiles!sanctions_revoked_by_fkey(id, display_name)
            `,
            )
            .single();

        if (sanctionError) {
            throw internalServerError("제재를 생성할 수 없습니다.", {
                message: sanctionError.message,
                code: sanctionError.code,
            });
        }

        sanction = mapSanctionToView(sanctionData as any);

        // Update target status based on sanction type
        if (body.sanctionType === "permanent_ban" || body.sanctionType === "suspension") {
            const newStatus = body.sanctionType === "permanent_ban" ? "banned" : "inactive";

            if (reportData.target_type === "profile") {
                await supabase
                    .from("profiles")
                    .update({ status: newStatus, updated_at: now })
                    .eq("id", reportData.target_id);
            } else if (reportData.target_type === "vendor") {
                await supabase
                    .from("vendors")
                    .update({ status: newStatus, updated_at: now })
                    .eq("id", reportData.target_id);
            }
        }

        // Log sanction creation
        await supabase.from("audit_logs").insert({
            actor_user_id: adminUserId,
            action: "sanction.create",
            target_type: "sanction",
            target_id: sanctionData.id,
            metadata: {
                sanctionId: sanctionData.id,
                targetType: reportData.target_type,
                targetId: reportData.target_id,
                sanctionType: body.sanctionType,
                durationDays: body.durationDays,
            },
        });
    }

    // Check auto-blind for reviews
    if (reportData.target_type === "review") {
        const { count } = await supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("target_type", "review")
            .eq("target_id", reportData.target_id);

        if (count && count >= AUTO_BLIND_THRESHOLD) {
            // Check if review is not already hidden
            const { data: reviewData } = await supabase
                .from("reviews")
                .select("status")
                .eq("id", reportData.target_id)
                .single();

            if (reviewData && reviewData.status !== "hidden") {
                await supabase
                    .from("reviews")
                    .update({ status: "hidden", updated_at: now })
                    .eq("id", reportData.target_id);

                // Log auto-blind
                await supabase.from("audit_logs").insert({
                    actor_user_id: adminUserId,
                    action: "report.auto_blind",
                    target_type: "review",
                    target_id: reportData.target_id,
                    metadata: {
                        reportId,
                        reviewId: reportData.target_id,
                        reportCount: count,
                    },
                });
            }
        }
    }

    // Log report resolution
    await supabase.from("audit_logs").insert({
        actor_user_id: adminUserId,
        action: "report.resolve",
        target_type: "report",
        target_id: reportId,
        metadata: {
            reportId,
            sanctionType: body.sanctionType,
            reason: body.reason,
        },
    });

    // Get updated report
    const result = await getReportDetail(supabase, reportId);
    return { report: result.report, sanction };
}

/**
 * Dismiss report
 */
export async function dismissReport(
    supabase: SupabaseClient<Database>,
    reportId: string,
    adminUserId: string,
    reason: string,
): Promise<{ report: AdminReportView }> {
    // Get report
    const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

    if (reportError || !reportData) {
        throw notFound("신고를 찾을 수 없습니다.");
    }

    if (reportData.status === "resolved" || reportData.status === "dismissed") {
        throw badRequest("이미 처리된 신고입니다.");
    }

    const now = new Date().toISOString();

    // Update report status
    const { error: updateError } = await supabase
        .from("reports")
        .update({
            status: "dismissed",
            resolved_by: adminUserId,
            resolved_at: now,
            resolution_note: reason,
            updated_at: now,
        })
        .eq("id", reportId);

    if (updateError) {
        throw internalServerError("신고를 기각할 수 없습니다.", {
            message: updateError.message,
            code: updateError.code,
        });
    }

    // Log dismissal
    await supabase.from("audit_logs").insert({
        actor_user_id: adminUserId,
        action: "report.dismiss",
        target_type: "report",
        target_id: reportId,
        metadata: {
            reportId,
            reason,
        },
    });

    // Get updated report
    const result = await getReportDetail(supabase, reportId);
    return { report: result.report };
}

/**
 * Get sanction list for admin
 */
export async function getSanctionList(
    supabase: SupabaseClient<Database>,
    query: AdminSanctionListQuery,
): Promise<{ items: SanctionView[]; total: number }> {
    const from = (query.page - 1) * query.pageSize;
    const to = from + query.pageSize - 1;

    let qb = supabase.from("sanctions").select(
        `
            *,
            created_by_user:profiles!sanctions_created_by_fkey(id, display_name),
            revoked_by_user:profiles!sanctions_revoked_by_fkey(id, display_name)
        `,
        { count: "exact" },
    );

    if (query.targetType) {
        qb = qb.eq("target_type", query.targetType);
    }

    if (query.targetId) {
        qb = qb.eq("target_id", query.targetId);
    }

    if (query.status) {
        qb = qb.eq("status", query.status);
    }

    qb = qb.order("created_at", { ascending: false });

    const { data, error, count } = await qb.range(from, to);

    if (error) {
        throw internalServerError("제재 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return {
        items: (data ?? []).map((row) => mapSanctionToView(row as any)),
        total: count ?? 0,
    };
}

/**
 * Revoke sanction
 */
export async function revokeSanction(
    supabase: SupabaseClient<Database>,
    sanctionId: string,
    adminUserId: string,
    reason: string,
): Promise<{ sanction: SanctionView }> {
    // Get sanction
    const { data: sanctionData, error: sanctionError } = await supabase
        .from("sanctions")
        .select("*")
        .eq("id", sanctionId)
        .single();

    if (sanctionError || !sanctionData) {
        throw notFound("제재를 찾을 수 없습니다.");
    }

    if (sanctionData.status === "revoked") {
        throw badRequest("이미 해제된 제재입니다.");
    }

    const now = new Date().toISOString();

    // Update sanction status
    const { error: updateError } = await supabase
        .from("sanctions")
        .update({
            status: "revoked",
            revoked_by: adminUserId,
            revoked_at: now,
            revoke_reason: reason,
            updated_at: now,
        })
        .eq("id", sanctionId);

    if (updateError) {
        throw internalServerError("제재를 해제할 수 없습니다.", {
            message: updateError.message,
            code: updateError.code,
        });
    }

    // Restore target status if it was permanent_ban or suspension
    if (sanctionData.sanction_type === "permanent_ban" || sanctionData.sanction_type === "suspension") {
        if (sanctionData.target_type === "profile") {
            await supabase
                .from("profiles")
                .update({ status: "active", updated_at: now })
                .eq("id", sanctionData.target_id);
        } else if (sanctionData.target_type === "vendor") {
            await supabase
                .from("vendors")
                .update({ status: "active", updated_at: now })
                .eq("id", sanctionData.target_id);
        }
    }

    // Log revocation
    await supabase.from("audit_logs").insert({
        actor_user_id: adminUserId,
        action: "sanction.revoke",
        target_type: "sanction",
        target_id: sanctionId,
        metadata: {
            sanctionId,
            reason,
        },
    });

    // Get updated sanction
    const { data: updatedSanction, error: fetchError } = await supabase
        .from("sanctions")
        .select(
            `
            *,
            created_by_user:profiles!sanctions_created_by_fkey(id, display_name),
            revoked_by_user:profiles!sanctions_revoked_by_fkey(id, display_name)
        `,
        )
        .eq("id", sanctionId)
        .single();

    if (fetchError || !updatedSanction) {
        throw internalServerError("제재 정보를 조회할 수 없습니다.");
    }

    return { sanction: mapSanctionToView(updatedSanction as any) };
}
