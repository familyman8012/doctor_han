import { zUuid } from "@/lib/schema/common";
import { BannerClickBodySchema } from "@/lib/schema/ad";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { trackBannerClick } from "@/server/ad/service";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

/**
 * POST /api/ads/banners/[id]/click
 * 배너 클릭 추적 (공개)
 */
export const POST = withApi(async (req: NextRequest, routeCtx: { params: Promise<{ id: string }> }) => {
    const campaignId = zUuid.parse((await routeCtx.params).id);
    const body = BannerClickBodySchema.parse(await req.json());

    // Optionally get user from auth (but don't require it)
    const supabase = await createSupabaseServerClient();
    let userId: string | undefined;
    try {
        const { data } = await supabase.auth.getUser();
        userId = data.user?.id;
    } catch {
        // Not authenticated - that's fine
    }

    const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    await trackBannerClick(supabase, campaignId, body.creativeId, {
        userId,
        ipAddress,
        userAgent,
    });

    return ok({ success: true });
});
