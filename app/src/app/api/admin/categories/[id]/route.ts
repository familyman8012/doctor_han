import type { Tables, TablesUpdate } from "@/lib/database.types";
import { AdminCategoryPatchBodySchema } from "@/lib/schema/admin";
import { zUuid } from "@/lib/schema/common";
import { badRequest, conflict, internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapCategoryRow } from "@/server/category/mapper";

type CategoryRow = Pick<Tables<"categories">, "id" | "parent_id" | "depth">;

function collectDescendantIds(categories: readonly CategoryRow[], rootId: string): string[] {
    const childrenByParentId = new Map<string, string[]>();

    for (const row of categories) {
        if (!row.parent_id) continue;
        const list = childrenByParentId.get(row.parent_id);
        if (list) list.push(row.id);
        else childrenByParentId.set(row.parent_id, [row.id]);
    }

    const result: string[] = [];
    const stack = [...(childrenByParentId.get(rootId) ?? [])];

    while (stack.length > 0) {
        const current = stack.pop()!;
        result.push(current);
        const children = childrenByParentId.get(current);
        if (children) {
            stack.push(...children);
        }
    }

    return result;
}

export const PATCH = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const categoryId = zUuid.parse(ctx.params.id);
        const body = AdminCategoryPatchBodySchema.parse(await ctx.req.json());

        const { data: current, error: currentError } = await ctx.supabase
            .from("categories")
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

        const nextParentId = typeof body.parentId === "undefined" ? current.parent_id : body.parentId ?? null;
        const parentChanged = typeof body.parentId !== "undefined" && nextParentId !== current.parent_id;

        const updatePayload: TablesUpdate<"categories"> = {
            ...(typeof body.name === "undefined" ? {} : { name: body.name }),
            ...(typeof body.slug === "undefined" ? {} : { slug: body.slug }),
            ...(typeof body.sortOrder === "undefined" ? {} : { sort_order: body.sortOrder }),
            ...(typeof body.isActive === "undefined" ? {} : { is_active: body.isActive }),
        };

        let descendantIds: string[] = [];
        let depthDelta = 0;
        let categoriesSnapshot: CategoryRow[] = [];

        if (parentChanged) {
            if (nextParentId === categoryId) {
                throw badRequest("상위 카테고리는 자기 자신일 수 없습니다.");
            }

            const { data: allCategories, error: allError } = await ctx.supabase
                .from("categories")
                .select("id, parent_id, depth");

            if (allError) {
                throw internalServerError("카테고리 트리를 확인할 수 없습니다.", {
                    message: allError.message,
                    code: allError.code,
                });
            }

            categoriesSnapshot = allCategories ?? [];
            descendantIds = collectDescendantIds(categoriesSnapshot, categoryId);

            if (nextParentId && descendantIds.includes(nextParentId)) {
                throw badRequest("하위 카테고리로 이동할 수 없습니다.");
            }

            let nextDepth = 1;
            if (nextParentId) {
                const parent = categoriesSnapshot.find((row) => row.id === nextParentId);
                if (!parent) {
                    throw notFound("상위 카테고리를 찾을 수 없습니다.");
                }
                nextDepth = parent.depth + 1;
            }

            depthDelta = nextDepth - current.depth;
            updatePayload.parent_id = nextParentId;
            updatePayload.depth = nextDepth;
        }

        const { data: updated, error: updateError } = await ctx.supabase
            .from("categories")
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
            action: "category.update",
            target_type: "category",
            target_id: updated.id,
            metadata: {
                before: { parentId: current.parent_id, depth: current.depth, slug: current.slug, name: current.name },
                after: { parentId: updated.parent_id, depth: updated.depth, slug: updated.slug, name: updated.name },
            },
        });

        if (auditResult.error) {
            console.error("[PATCH /api/admin/categories/:id] audit_logs insert failed", auditResult.error);
        }

        if (parentChanged && depthDelta !== 0 && descendantIds.length > 0) {
            const byId = new Map(categoriesSnapshot.map((row) => [row.id, row]));
            const failures: Array<{ id: string; code?: string; message: string }> = [];

            for (const childId of descendantIds) {
                const snapshot = byId.get(childId);
                if (!snapshot) continue;

                const nextDepth = snapshot.depth + depthDelta;
                const result = await ctx.supabase.from("categories").update({ depth: nextDepth }).eq("id", childId);
                if (result.error) {
                    failures.push({
                        id: childId,
                        code: result.error.code,
                        message: result.error.message,
                    });
                }
            }

            if (failures.length > 0) {
                console.error("[PATCH /api/admin/categories/:id] descendant depth update failed", failures);
            }
        }

        return ok({ category: mapCategoryRow(updated) });
    }),
);

export const DELETE = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const categoryId = zUuid.parse(ctx.params.id);

        const { data: children, error: childrenError } = await ctx.supabase
            .from("categories")
            .select("id")
            .eq("parent_id", categoryId)
            .limit(1);

        if (childrenError) {
            throw internalServerError("카테고리 삭제 여부를 확인할 수 없습니다.", {
                message: childrenError.message,
                code: childrenError.code,
            });
        }

        if ((children ?? []).length > 0) {
            throw conflict("하위 카테고리가 존재하여 삭제할 수 없습니다.");
        }

        const { data, error } = await ctx.supabase
            .from("categories")
            .delete()
            .eq("id", categoryId)
            .select("id")
            .maybeSingle();

        if (error) {
            throw internalServerError("카테고리를 삭제할 수 없습니다.", { message: error.message, code: error.code });
        }

        if (!data) {
            throw notFound("카테고리를 찾을 수 없습니다.");
        }

        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "category.delete",
            target_type: "category",
            target_id: data.id,
            metadata: {},
        });

        if (auditResult.error) {
            console.error("[DELETE /api/admin/categories/:id] audit_logs insert failed", auditResult.error);
        }

        return ok({ id: data.id });
    }),
);
