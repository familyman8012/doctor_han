import { AdminUserListQuerySchema } from "@/lib/schema/admin";
import { internalServerError } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapProfileRow } from "@/server/profile/mapper";

function escapeLike(value: string): string {
    return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = AdminUserListQuerySchema.parse({
            role: searchParams.get("role") ?? undefined,
            status: searchParams.get("status") ?? undefined,
            q: searchParams.get("q") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });

        const from = (query.page - 1) * query.pageSize;
        const to = from + query.pageSize - 1;

        let qb = ctx.supabase.from("profiles").select("*", { count: "exact" });

        if (query.role) {
            qb = qb.eq("role", query.role);
        }

        if (query.status) {
            qb = qb.eq("status", query.status);
        }

        if (query.q) {
            const escaped = escapeLike(query.q);
            qb = qb.or(`email.ilike.%${escaped}%,display_name.ilike.%${escaped}%,phone.ilike.%${escaped}%`);
        }

        qb = qb.order("created_at", { ascending: false });

        const { data, error, count } = await qb.range(from, to);

        if (error) {
            throw internalServerError("사용자 목록을 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        return ok({
            items: (data ?? []).map(mapProfileRow),
            page: query.page,
            pageSize: query.pageSize,
            total: count ?? 0,
        });
    }),
);

