import { HelpArticleListQuerySchema } from "@/lib/schema/help-center";
import { internalServerError } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { mapHelpArticleRow } from "@/server/help-center/mapper";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

export const GET = withApi(async (req: NextRequest) => {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = HelpArticleListQuerySchema.parse({
        ...searchParams,
        page: searchParams.page ? Number(searchParams.page) : undefined,
        pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : undefined,
    });

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const supabase = await createSupabaseServerClient();

    let queryBuilder = supabase
        .from("help_articles")
        .select("*, category:help_categories(*)", { count: "exact" })
        .eq("is_published", true);

    // Filter by type
    if (query.type) {
        queryBuilder = queryBuilder.eq("type", query.type);
    }

    // Filter by categoryId (for FAQ)
    if (query.categoryId) {
        queryBuilder = queryBuilder.eq("category_id", query.categoryId);
    }

    // Search by title or content
    if (query.q) {
        // Escape special characters for ilike pattern
        const escapedQ = query.q.replace(/[%_\\]/g, (char) => `\\${char}`);
        queryBuilder = queryBuilder.or(`title.ilike.%${escapedQ}%,content.ilike.%${escapedQ}%`);
    }

    // Sorting: notice -> is_pinned DESC, created_at DESC / faq, guide -> display_order ASC, created_at DESC
    if (query.type === "notice") {
        queryBuilder = queryBuilder
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false });
    } else {
        queryBuilder = queryBuilder
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: false });
    }

    // Pagination
    queryBuilder = queryBuilder.range(offset, offset + pageSize - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
        throw internalServerError("문서를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const items = (data ?? []).map((row) => mapHelpArticleRow(row, row.category));

    return ok({
        items,
        page,
        pageSize,
        total: count ?? 0,
    });
});
