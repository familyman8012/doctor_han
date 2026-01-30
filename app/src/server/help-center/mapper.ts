import type { Tables } from "@/lib/database.types";
import type { HelpArticleView, HelpCategoryView } from "@/lib/schema/help-center";

type HelpCategoryRow = Tables<"help_categories">;
type HelpArticleRow = Tables<"help_articles">;

export function mapHelpCategoryRow(row: HelpCategoryRow): HelpCategoryView {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        displayOrder: row.display_order,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapHelpArticleRow(
    row: HelpArticleRow,
    category: HelpCategoryRow | null,
): HelpArticleView {
    return {
        id: row.id,
        type: row.type,
        categoryId: row.category_id,
        category: category ? mapHelpCategoryRow(category) : null,
        title: row.title,
        content: row.content,
        isPublished: row.is_published,
        isPinned: row.is_pinned,
        displayOrder: row.display_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
