import { PrioritySlotListQuerySchema } from "@/lib/schema/ad";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { getPrioritySlotsByCategory, getPriorityVendorsForCategory } from "@/server/ad/priority-service";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

/**
 * GET /api/ads/priority
 * 우선순위 업체 목록 (공개) 또는 슬롯 목록 (구매 페이지용)
 * - view=slots: 슬롯별 활성 구매 수 반환
 * - default: 우선순위 업체 목록 반환
 */
export const GET = withApi(async (req: NextRequest) => {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const view = req.nextUrl.searchParams.get("view");
    const query = PrioritySlotListQuerySchema.parse({
        categoryId: searchParams.categoryId,
    });

    const supabase = await createSupabaseServerClient();

    if (view === "slots") {
        const result = await getPrioritySlotsByCategory(supabase, query.categoryId);
        return ok(result);
    }

    const vendors = await getPriorityVendorsForCategory(supabase, query.categoryId);
    return ok({ vendors });
});
