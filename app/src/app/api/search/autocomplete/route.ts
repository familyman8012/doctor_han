import { SearchAutocompleteQuerySchema } from "@/lib/schema/search";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { getAutocomplete } from "@/server/search/service";
import type { NextRequest } from "next/server";

export const GET = withApi(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = SearchAutocompleteQuerySchema.parse({
        q: searchParams.get("q") ?? undefined,
        limit: searchParams.get("limit") ?? undefined,
    });

    const items = await getAutocomplete({
        query: query.q,
        limit: query.limit,
    });

    return ok({ items });
});
