import type { TablesUpdate } from "@/lib/database.types";
import { zUuid } from "@/lib/schema/common";
import { HelpArticlePatchBodySchema } from "@/lib/schema/help-center";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapHelpArticleRow } from "@/server/help-center/mapper";

export const GET = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const articleId = zUuid.parse(ctx.params.id);

        const { data, error } = await ctx.supabase
            .from("help_articles")
            .select("*, category:help_categories(*)")
            .eq("id", articleId)
            .maybeSingle();

        if (error) {
            throw internalServerError("문서를 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        if (!data) {
            throw notFound("문서를 찾을 수 없습니다.");
        }

        return ok({ article: mapHelpArticleRow(data, data.category) });
    }),
);

export const PATCH = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const articleId = zUuid.parse(ctx.params.id);
        const body = HelpArticlePatchBodySchema.parse(await ctx.req.json());

        const { data: current, error: currentError } = await ctx.supabase
            .from("help_articles")
            .select("*")
            .eq("id", articleId)
            .maybeSingle();

        if (currentError) {
            throw internalServerError("문서를 확인할 수 없습니다.", {
                message: currentError.message,
                code: currentError.code,
            });
        }

        if (!current) {
            throw notFound("문서를 찾을 수 없습니다.");
        }

        const updatePayload: TablesUpdate<"help_articles"> = {
            ...(typeof body.type === "undefined" ? {} : { type: body.type }),
            ...(typeof body.categoryId === "undefined" ? {} : { category_id: body.categoryId ?? null }),
            ...(typeof body.title === "undefined" ? {} : { title: body.title }),
            ...(typeof body.content === "undefined" ? {} : { content: body.content }),
            ...(typeof body.isPublished === "undefined" ? {} : { is_published: body.isPublished }),
            ...(typeof body.isPinned === "undefined" ? {} : { is_pinned: body.isPinned }),
            ...(typeof body.displayOrder === "undefined" ? {} : { display_order: body.displayOrder }),
        };

        const { data: updated, error: updateError } = await ctx.supabase
            .from("help_articles")
            .update(updatePayload)
            .eq("id", articleId)
            .select("*, category:help_categories(*)")
            .maybeSingle();

        if (updateError) {
            throw internalServerError("문서를 수정할 수 없습니다.", {
                message: updateError.message,
                code: updateError.code,
            });
        }

        if (!updated) {
            throw notFound("문서를 찾을 수 없습니다.");
        }

        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "help_article.update",
            target_type: "help_article",
            target_id: updated.id,
            metadata: {
                before: { title: current.title, type: current.type, isPublished: current.is_published },
                after: { title: updated.title, type: updated.type, isPublished: updated.is_published },
            },
        });

        if (auditResult.error) {
            console.error("[PATCH /api/admin/help-center/articles/:id] audit_logs insert failed", auditResult.error);
        }

        return ok({ article: mapHelpArticleRow(updated, updated.category) });
    }),
);

export const DELETE = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const articleId = zUuid.parse(ctx.params.id);

        const { data: current, error: currentError } = await ctx.supabase
            .from("help_articles")
            .select("id, title, type")
            .eq("id", articleId)
            .maybeSingle();

        if (currentError) {
            throw internalServerError("문서를 확인할 수 없습니다.", {
                message: currentError.message,
                code: currentError.code,
            });
        }

        if (!current) {
            throw notFound("문서를 찾을 수 없습니다.");
        }

        const { data, error } = await ctx.supabase
            .from("help_articles")
            .delete()
            .eq("id", articleId)
            .select("id")
            .maybeSingle();

        if (error) {
            throw internalServerError("문서를 삭제할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        if (!data) {
            throw notFound("문서를 찾을 수 없습니다.");
        }

        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "help_article.delete",
            target_type: "help_article",
            target_id: data.id,
            metadata: { title: current.title, type: current.type },
        });

        if (auditResult.error) {
            console.error("[DELETE /api/admin/help-center/articles/:id] audit_logs insert failed", auditResult.error);
        }

        return ok({ id: data.id });
    }),
);
