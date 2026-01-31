import "server-only";

import type { Tables } from "@/lib/database.types";
import type { AuditLogView } from "@/lib/schema/audit";

type AuditLogRow = Tables<"audit_logs">;
type ProfileRow = Tables<"profiles">;

export type AuditLogRowWithActor = AuditLogRow & {
    actor: Pick<ProfileRow, "id" | "display_name" | "email">;
};

/**
 * Map audit log DB row to AuditLogView DTO
 */
export function mapAuditLogRow(row: AuditLogRowWithActor): AuditLogView {
    return {
        id: row.id,
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        metadata: row.metadata as Record<string, unknown>,
        createdAt: row.created_at,
        actor: {
            id: row.actor.id,
            displayName: row.actor.display_name,
            email: row.actor.email,
        },
    };
}
