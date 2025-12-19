import type { Tables } from "@/lib/database.types";
import type { ProfileView } from "@/lib/schema/profile";

type ProfileRow = Tables<"profiles">;

export function mapProfileRow(row: ProfileRow): ProfileView {
    return {
        id: row.id,
        role: row.role,
        status: row.status,
        displayName: row.display_name,
        phone: row.phone,
        email: row.email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

