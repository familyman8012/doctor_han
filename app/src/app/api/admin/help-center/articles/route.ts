import { AdminHelpArticleListQuerySchema, HelpArticleCreateBodySchema } from "@/lib/schema/help-center";
import { internalServerError } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapHelpArticleRow } from "@/server/help-center/mapper";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const searchParams = Object.fromEntries(ctx.req.nextUrl.searchParams.entries());
        const query = AdminHelpArticleListQuerySchema.parse({
            ...searchParams,
            page: searchParams.page ? Number(searchParams.page) : undefined,
            pageSize: searchParams.pageSize ? Number(searchParams.pageSize) : undefined,
        });

        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        const offset = (page - 1) * pageSize;

        let queryBuilder = ctx.supabase
            .from("help_articles")
            .select("*, category:help_categories(*)", { count: "exact" });

        // Filter by type
        if (query.type) {
            queryBuilder = queryBuilder.eq("type", query.type);
        }

        // Filter by categoryId
        if (query.categoryId) {
            queryBuilder = queryBuilder.eq("category_id", query.categoryId);
        }

        // Filter by isPublished
        if (query.isPublished !== undefined) {
            queryBuilder = queryBuilder.eq("is_published", query.isPublished === "true");
        }

        // Search by title or content
        if (query.q) {
            // Escape special characters for LIKE pattern
            const escaped = query.q.replace(/[%_\\]/g, "\\$&");
            queryBuilder = queryBuilder.or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`);
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
    }),
);

export const POST = withApi(
    withRole(["admin"], async (ctx) => {
        const body = HelpArticleCreateBodySchema.parse(await ctx.req.json());

        const { data, error } = await ctx.supabase
            .from("help_articles")
            .insert({
                type: body.type,
                category_id: body.categoryId ?? null,
                title: body.title,
                content: body.content,
                created_by: ctx.user.id,
                ...(typeof body.isPublished === "undefined" ? {} : { is_published: body.isPublished }),
                ...(typeof body.isPinned === "undefined" ? {} : { is_pinned: body.isPinned }),
                ...(typeof body.displayOrder === "undefined" ? {} : { display_order: body.displayOrder }),
            })
            .select("*, category:help_categories(*)")
            .single();

        if (error) {
            throw internalServerError("문서를 생성할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "help_article.create",
            target_type: "help_article",
            target_id: data.id,
            metadata: { title: body.title, type: body.type },
        });

        if (auditResult.error) {
            console.error("[POST /api/admin/help-center/articles] audit_logs insert failed", auditResult.error);
        }

        return created({ article: mapHelpArticleRow(data, data.category) });
    }),
);
