import "server-only";

import type { Tables } from "@/lib/database.types";
import type {
    AdminReportListItem,
    AdminReportView,
    AdminUserSummary,
    ReporterUserSummary,
    SanctionView,
} from "@/lib/schema/report";

type ReportRow = Tables<"reports">;
type SanctionRow = Tables<"sanctions">;
type ProfileRow = Tables<"profiles">;

type ReportRowWithRelations = ReportRow & {
    reporter_user: Pick<ProfileRow, "id" | "display_name" | "email">;
    reviewed_by_user?: Pick<ProfileRow, "id" | "display_name"> | null;
    resolved_by_user?: Pick<ProfileRow, "id" | "display_name"> | null;
};

type SanctionRowWithRelations = SanctionRow & {
    created_by_user: Pick<ProfileRow, "id" | "display_name"> | null;
    revoked_by_user?: Pick<ProfileRow, "id" | "display_name"> | null;
};

/**
 * Map reporter user row to ReporterUserSummary
 */
function mapReporterUserSummary(
    user: Pick<ProfileRow, "id" | "display_name" | "email">,
): ReporterUserSummary {
    return {
        id: user.id,
        displayName: user.display_name ?? "",
        email: user.email,
    };
}

/**
 * Map admin user row to AdminUserSummary
 */
function mapAdminUserSummary(
    user: Pick<ProfileRow, "id" | "display_name"> | null | undefined,
): AdminUserSummary | null {
    if (!user) return null;
    return {
        id: user.id,
        displayName: user.display_name ?? "",
    };
}

/**
 * Map report row to AdminReportListItem (for list view)
 */
export function mapReportToListItem(
    row: ReportRowWithRelations,
    targetSummary: string,
): AdminReportListItem {
    return {
        id: row.id,
        targetType: row.target_type,
        targetId: row.target_id,
        targetSummary,
        reporterUser: mapReporterUserSummary(row.reporter_user),
        reason: row.reason,
        status: row.status,
        createdAt: row.created_at,
    };
}

/**
 * Map report row to AdminReportView (for detail view)
 */
export function mapReportToView(
    row: ReportRowWithRelations,
    targetSummary: string,
): AdminReportView {
    return {
        id: row.id,
        targetType: row.target_type,
        targetId: row.target_id,
        targetSummary,
        reporterUser: mapReporterUserSummary(row.reporter_user),
        reason: row.reason,
        detail: row.detail,
        status: row.status,
        reviewedBy: mapAdminUserSummary(row.reviewed_by_user),
        reviewedAt: row.reviewed_at,
        resolvedBy: mapAdminUserSummary(row.resolved_by_user),
        resolvedAt: row.resolved_at,
        resolutionNote: row.resolution_note,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/**
 * Map sanction row to SanctionView
 */
export function mapSanctionToView(row: SanctionRowWithRelations): SanctionView {
    return {
        id: row.id,
        targetType: row.target_type,
        targetId: row.target_id,
        reportId: row.report_id,
        sanctionType: row.sanction_type,
        status: row.status,
        reason: row.reason,
        durationDays: row.duration_days,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        createdBy: row.created_by_user
            ? {
                  id: row.created_by_user.id,
                  displayName: row.created_by_user.display_name ?? "",
              }
            : null,
        revokedBy: mapAdminUserSummary(row.revoked_by_user),
        revokedAt: row.revoked_at,
        revokeReason: row.revoke_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
