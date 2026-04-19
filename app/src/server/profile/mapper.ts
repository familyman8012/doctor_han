import type { Tables } from "@/lib/database.types";
import type { ProfileView } from "@/lib/schema/profile";

type ProfileRow = Tables<"profiles">;
type ProfileRowWithExtras = ProfileRow & {
    avatar_url?: string | null;
    suspended_until?: string | null;
    status_reason?: string | null;
    status_changed_at?: string | null;
};

export function mapProfileRow(row: ProfileRow): ProfileView {
    const rowWithExtras = row as ProfileRowWithExtras;
    return {
        id: row.id,
        role: row.role,
        status: row.status,
        displayName: row.display_name,
        position: row.position ?? null,
        avatarUrl: rowWithExtras.avatar_url ?? null,
        phone: row.phone,
        email: row.email,
        suspendedUntil: rowWithExtras.suspended_until ?? null,
        statusReason: rowWithExtras.status_reason ?? null,
        statusChangedAt: rowWithExtras.status_changed_at ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
