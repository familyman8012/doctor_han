import type { Tables } from "@/lib/database.types";
import type { CategoryView } from "@/lib/schema/category";

type CategoryRow = Tables<"categories">;

export function mapCategoryRow(row: CategoryRow): CategoryView {
    return {
        id: row.id,
        parentId: row.parent_id,
        depth: row.depth,
        name: row.name,
        slug: row.slug,
        sortOrder: row.sort_order,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

