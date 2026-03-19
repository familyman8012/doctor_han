import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { getHomeStats } from "@/server/home/service";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const GET = withApi(async () => {
    const supabase = await createSupabaseServerClient();
    const stats = await getHomeStats(supabase);
    return ok(stats);
});
