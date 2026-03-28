import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { countAllUnviewedLeads } from "@/server/lead/repository";

export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const unviewedCount = await countAllUnviewedLeads(ctx.supabase);

        return ok({ unviewedCount });
    }),
);
