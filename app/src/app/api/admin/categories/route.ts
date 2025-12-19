import { AdminCategoryCreateBodySchema } from "@/lib/schema/admin";
import { conflict, internalServerError, notFound } from "@/server/api/errors";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapCategoryRow } from "@/server/category/mapper";

export const POST = withApi(
    withRole(["admin"], async (ctx) => {
        const body = AdminCategoryCreateBodySchema.parse(await ctx.req.json());

        let depth = 1;
        if (body.parentId) {
            const { data: parent, error: parentError } = await ctx.supabase
                .from("categories")
                .select("id, depth")
                .eq("id", body.parentId)
                .maybeSingle();

            if (parentError) {
                throw internalServerError("상위 카테고리를 확인할 수 없습니다.", {
                    message: parentError.message,
                    code: parentError.code,
                });
            }

            if (!parent) {
                throw notFound("상위 카테고리를 찾을 수 없습니다.");
            }

            depth = parent.depth + 1;
        }

        const { data, error } = await ctx.supabase
            .from("categories")
            .insert({
                parent_id: body.parentId ?? null,
                depth,
                name: body.name,
                slug: body.slug,
                ...(typeof body.sortOrder === "undefined" ? {} : { sort_order: body.sortOrder }),
                ...(typeof body.isActive === "undefined" ? {} : { is_active: body.isActive }),
            })
            .select("*")
            .single();

        if (error) {
            if (error.code === "23505") {
                throw conflict("이미 사용 중인 slug입니다.");
            }

            throw internalServerError("카테고리를 생성할 수 없습니다.", { message: error.message, code: error.code });
        }

        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "category.create",
            target_type: "category",
            target_id: data.id,
            metadata: { parentId: body.parentId ?? null, slug: body.slug, name: body.name },
        });

        if (auditResult.error) {
            console.error("[POST /api/admin/categories] audit_logs insert failed", auditResult.error);
        }

        return created({ category: mapCategoryRow(data) });
    }),
);

