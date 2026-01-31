import "server-only";

import type { Database, TablesInsert } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Safely insert an audit log entry without throwing errors.
 * If insertion fails, only logs to console.error.
 */
export async function safeInsertAuditLog(
    supabase: SupabaseClient<Database>,
    payload: TablesInsert<"audit_logs">,
    context: string,
): Promise<void> {
    const { error } = await supabase.from("audit_logs").insert(payload);
    if (error) {
        console.error(`[${context}] audit_logs insert failed`, error);
    }
}
