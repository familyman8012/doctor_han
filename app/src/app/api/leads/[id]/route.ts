import { zUuid } from "@/lib/schema/common";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { fetchLeadDetail, markLeadViewed } from "@/server/lead/repository";

export const GET = withApi(
    withAuth<{ id: string }>(async (ctx) => {
        const leadId = zUuid.parse(ctx.params.id);
        const lead = await fetchLeadDetail(ctx.supabase, leadId);

        // vendor가 리드를 조회할 때만 viewed_at 기록 (admin/doctor 제외)
        if (ctx.profile.role === "vendor") {
            markLeadViewed(ctx.supabase, leadId).catch(() => {});
        }

        return ok({ lead });
    }),
);
