import "server-only";

import type { Database } from "@/lib/database.types";
import { notFound } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getVendorIdByUserId(
    supabase: SupabaseClient<Database>,
    userId: string,
): Promise<string> {
    const { data, error } = await supabase
        .from("vendors")
        .select("id")
        .eq("owner_user_id", userId)
        .maybeSingle();

    if (error || !data) {
        throw notFound("업체 정보를 찾을 수 없습니다.");
    }

    return data.id;
}
