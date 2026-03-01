import { AdminCampaignCreateBodySchema, AdminCampaignListQuerySchema } from "@/lib/schema/ad";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { createAdCampaign, getAdCampaignList } from "@/server/ad/service";

/**
 * GET /api/admin/ads/campaigns
 * 관리자: 캠페인 목록 조회
 */
export const GET = withApi(
    withRole(["admin"], async (ctx) => {
        const searchParams = Object.fromEntries(ctx.req.nextUrl.searchParams.entries());
        const query = AdminCampaignListQuerySchema.parse(searchParams);

        const result = await getAdCampaignList(ctx.supabase, query);

        return ok(result);
    }),
);

/**
 * POST /api/admin/ads/campaigns
 * 관리자: 캠페인 생성
 */
export const POST = withApi(
    withRole(["admin"], async (ctx) => {
        const body = AdminCampaignCreateBodySchema.parse(await ctx.req.json());

        const campaign = await createAdCampaign(ctx.supabase, ctx.user.id, body);

        return created({ campaign });
    }),
);
