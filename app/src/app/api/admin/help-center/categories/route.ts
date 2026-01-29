import { HelpCategoryCreateBodySchema } from "@/lib/schema/help-center";
import { conflict, internalServerError } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapHelpCategoryRow } from "@/server/help-center/mapper";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { data, error } = await ctx.supabase
            .from("help_categories")
            .select("*")
            .order("display_order", { ascending: true });

        if (error) {
            throw internalServerError("카테고리를 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        return ok({ items: (data ?? []).map(mapHelpCategoryRow) });
    }),
);

export const POST = withApi(
    withRole(["admin"], async (ctx) => {
        const body = HelpCategoryCreateBodySchema.parse(await ctx.req.json());

        const { data, error } = await ctx.supabase
            .from("help_categories")
            .insert({
                name: body.name,
                slug: body.slug,
                ...(typeof body.displayOrder === "undefined" ? {} : { display_order: body.displayOrder }),
                ...(typeof body.isActive === "undefined" ? {} : { is_active: body.isActive }),
            })
            .select("*")
            .single();

        if (error) {
            if (error.code === "23505") {
                throw conflict("이미 사용 중인 slug입니다.");
            }

            throw internalServerError("카테고리를 생성할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "help_category.create",
            target_type: "help_category",
            target_id: data.id,
            metadata: { name: body.name, slug: body.slug },
        });

        if (auditResult.error) {
            console.error("[POST /api/admin/help-center/categories] audit_logs insert failed", auditResult.error);
        }

        return created({ category: mapHelpCategoryRow(data) });
    }),
);
