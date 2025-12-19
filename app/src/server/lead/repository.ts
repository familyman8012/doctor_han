import type { Database } from "@/lib/database.types";
import { internalServerError, notFound } from "@/server/api/errors";
import { mapLeadAttachmentRow, mapLeadDetail, mapLeadStatusHistoryRow, mapLeadVendorSummary } from "@/server/lead/mapper";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchLeadDetail(supabase: SupabaseClient<Database>, leadId: string) {
    const { data: leadRow, error: leadError } = await supabase
        .from("leads")
        .select("*, vendor:vendors(id, name)")
        .eq("id", leadId)
        .maybeSingle();

    if (leadError) {
        throw internalServerError("리드를 조회할 수 없습니다.", {
            message: leadError.message,
            code: leadError.code,
        });
    }

    if (!leadRow) {
        throw notFound("리드를 찾을 수 없습니다.");
    }

    const [statusHistoryResult, attachmentsResult] = await Promise.all([
        supabase.from("lead_status_history").select("*").eq("lead_id", leadId).order("created_at", { ascending: true }),
        supabase.from("lead_attachments").select("*").eq("lead_id", leadId).order("created_at", { ascending: true }),
    ]);

    if (statusHistoryResult.error) {
        throw internalServerError("리드 상태 이력을 조회할 수 없습니다.", {
            message: statusHistoryResult.error.message,
            code: statusHistoryResult.error.code,
        });
    }

    if (attachmentsResult.error) {
        throw internalServerError("리드 첨부를 조회할 수 없습니다.", {
            message: attachmentsResult.error.message,
            code: attachmentsResult.error.code,
        });
    }

    const vendor = mapLeadVendorSummary((leadRow as unknown as { vendor?: { id: string; name: string } | null }).vendor);

    return mapLeadDetail({
        lead: leadRow,
        vendor,
        statusHistory: (statusHistoryResult.data ?? []).map(mapLeadStatusHistoryRow),
        attachments: (attachmentsResult.data ?? []).map(mapLeadAttachmentRow),
    });
}

