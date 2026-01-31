import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { buildHomeScreen } from "@/server/home/service";
import { createSupabaseServerClient } from "@/server/supabase/server";
export const GET = withApi(async () => {
    const supabase = await createSupabaseServerClient();
    const screen = await buildHomeScreen(supabase);
    return ok(screen);
});

