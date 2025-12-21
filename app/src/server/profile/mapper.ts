import type { Tables } from "@/lib/database.types";
import type { ProfileView } from "@/lib/schema/profile";

type ProfileRow = Tables<"profiles">;
type ProfileRowWithAvatar = ProfileRow & { avatar_url?: string | null };

export function mapProfileRow(row: ProfileRow): ProfileView {
    const rowWithAvatar = row as ProfileRowWithAvatar;
    return {
        id: row.id,
        role: row.role,
        status: row.status,
        displayName: row.display_name,
        avatarUrl: rowWithAvatar.avatar_url ?? null,
        phone: row.phone,
        email: row.email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
