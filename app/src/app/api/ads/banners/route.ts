import { BannerListQuerySchema } from "@/lib/schema/ad";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { getBannersForDisplay } from "@/server/ad/service";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

/**
 * GET /api/ads/banners
 * 배너 광고 목록 조회 (공개)
 */
export const GET = withApi(async (req: NextRequest) => {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const query = BannerListQuerySchema.parse(searchParams);

    const supabase = await createSupabaseServerClient();
    const banners = await getBannersForDisplay(supabase, query.position);

    return ok({ banners });
});
