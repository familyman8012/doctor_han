import type { TablesUpdate } from "@/lib/database.types";
import { zUuid } from "@/lib/schema/common";
import { HelpCategoryPatchBodySchema } from "@/lib/schema/help-center";
import { conflict, internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapHelpCategoryRow } from "@/server/help-center/mapper";

export const PATCH = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const categoryId = zUuid.parse(ctx.params.id);
        const body = HelpCategoryPatchBodySchema.parse(await ctx.req.json());

        const { data: current, error: currentError } = await ctx.supabase
            .from("help_categories")
            .select("*")
            .eq("id", categoryId)
            .maybeSingle();

        if (currentError) {
            throw internalServerError("카테고리를 확인할 수 없습니다.", {
                message: currentError.message,
                code: currentError.code,
            });
        }

        if (!current) {
            throw notFound("카테고리를 찾을 수 없습니다.");
        }

        const updatePayload: TablesUpdate<"help_categories"> = {
            ...(typeof body.name === "undefined" ? {} : { name: body.name }),
            ...(typeof body.slug === "undefined" ? {} : { slug: body.slug }),
            ...(typeof body.displayOrder === "undefined" ? {} : { display_order: body.displayOrder }),
            ...(typeof body.isActive === "undefined" ? {} : { is_active: body.isActive }),
        };

        const { data: updated, error: updateError } = await ctx.supabase
            .from("help_categories")
            .update(updatePayload)
            .eq("id", categoryId)
            .select("*")
            .maybeSingle();

        if (updateError) {
            if (updateError.code === "23505") {
                throw conflict("이미 사용 중인 slug입니다.");
            }

            throw internalServerError("카테고리를 수정할 수 없습니다.", {
                message: updateError.message,
                code: updateError.code,
            });
        }

        if (!updated) {
            throw notFound("카테고리를 찾을 수 없습니다.");
        }

        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "help_category.update",
            target_type: "help_category",
            target_id: updated.id,
            metadata: {
                before: { name: current.name, slug: current.slug },
                after: { name: updated.name, slug: updated.slug },
            },
        });

        if (auditResult.error) {
            console.error("[PATCH /api/admin/help-center/categories/:id] audit_logs insert failed", auditResult.error);
        }

        return ok({ category: mapHelpCategoryRow(updated) });
    }),
);

export const DELETE = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const categoryId = zUuid.parse(ctx.params.id);

        // Check if there are any articles using this category
        const { data: articles, error: articlesError } = await ctx.supabase
            .from("help_articles")
            .select("id")
            .eq("category_id", categoryId)
            .limit(1);

        if (articlesError) {
            throw internalServerError("카테고리 삭제 여부를 확인할 수 없습니다.", {
                message: articlesError.message,
                code: articlesError.code,
            });
        }

        if ((articles ?? []).length > 0) {
            throw conflict("해당 카테고리를 사용하는 FAQ 문서가 존재하여 삭제할 수 없습니다.");
        }

        const { data, error } = await ctx.supabase
            .from("help_categories")
            .delete()
            .eq("id", categoryId)
            .select("id")
            .maybeSingle();

        if (error) {
            throw internalServerError("카테고리를 삭제할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        if (!data) {
            throw notFound("카테고리를 찾을 수 없습니다.");
        }

        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "help_category.delete",
            target_type: "help_category",
            target_id: data.id,
            metadata: {},
        });

        if (auditResult.error) {
            console.error("[DELETE /api/admin/help-center/categories/:id] audit_logs insert failed", auditResult.error);
        }

        return ok({ id: data.id });
    }),
);
