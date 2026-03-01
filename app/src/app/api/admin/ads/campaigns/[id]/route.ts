import { zUuid } from "@/lib/schema/common";
import { AdminCampaignPatchBodySchema } from "@/lib/schema/ad";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getAdCampaignDetail, updateAdCampaign } from "@/server/ad/service";

/**
 * GET /api/admin/ads/campaigns/[id]
 * 관리자: 캠페인 상세 조회
 */
export const GET = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const campaignId = zUuid.parse(ctx.params.id);

        const result = await getAdCampaignDetail(ctx.supabase, campaignId);

        return ok(result);
    }),
);

/**
 * PATCH /api/admin/ads/campaigns/[id]
 * 관리자: 캠페인 수정
 */
export const PATCH = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const campaignId = zUuid.parse(ctx.params.id);
        const body = AdminCampaignPatchBodySchema.parse(await ctx.req.json());

        const campaign = await updateAdCampaign(ctx.supabase, campaignId, body);

        return ok({ campaign });
    }),
);
