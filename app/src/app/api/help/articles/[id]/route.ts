import { zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { mapHelpArticleRow } from "@/server/help-center/mapper";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

export const GET = withApi(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const params = await ctx.params;
    const articleId = zUuid.parse(params.id);

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("help_articles")
        .select("*, category:help_categories(*)")
        .eq("id", articleId)
        .eq("is_published", true)
        .maybeSingle();

    if (error) {
        throw internalServerError("문서를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (!data) {
        throw notFound("문서를 찾을 수 없습니다.");
    }

    return ok({ article: mapHelpArticleRow(data, data.category) });
});
