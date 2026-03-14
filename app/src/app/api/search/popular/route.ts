import { PopularSearchTermsQuerySchema } from "@/lib/schema/search";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { getPopularSearchTerms } from "@/server/search/service";
import type { NextRequest } from "next/server";

export const GET = withApi(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = PopularSearchTermsQuerySchema.parse({
        days: searchParams.get("days") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
    });

    const items = await getPopularSearchTerms({
        days: query.days,
        limit: query.limit,
    });

    return ok({ items });
});
