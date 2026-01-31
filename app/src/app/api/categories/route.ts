import { internalServerError } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { mapCategoryRow } from "@/server/category/mapper";
import { createSupabaseServerClient } from "@/server/supabase/server";
export const GET = withApi(async () => {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("depth", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    if (error) {
        throw internalServerError("카테고리를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return ok({ items: (data ?? []).map(mapCategoryRow) });
});

