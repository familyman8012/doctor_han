import { zUuid } from "@/lib/schema/common";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { fetchLeadDetail } from "@/server/lead/repository";

export const GET = withApi(
    withAuth(async (ctx) => {
        const leadId = zUuid.parse(ctx.params.id);
        const lead = await fetchLeadDetail(ctx.supabase, leadId);
        return ok({ lead });
    }),
);

