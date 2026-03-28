import { internalServerError } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { countUnviewedLeads } from "@/server/lead/repository";

export const GET = withApi(
    withRole(["vendor"], async (ctx) => {
        const { data: vendor, error } = await ctx.supabase
            .from("vendors")
            .select("id")
            .eq("owner_user_id", ctx.user.id)
            .maybeSingle();

        if (error) {
            throw internalServerError("업체 정보를 확인할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        const unviewedCount = vendor
            ? await countUnviewedLeads(ctx.supabase, vendor.id)
            : 0;

        return ok({ unviewedCount });
    }),
);
