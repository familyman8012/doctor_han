import "server-only";

import type { ExportLeadsQuery } from "@/lib/schema/export";
import { toCsvRow } from "@/server/api/csv";
import { internalServerError } from "@/server/api/errors";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export async function exportLeadsCsv(
    query: ExportLeadsQuery,
): Promise<string> {
    const admin = createSupabaseAdminClient();

    // Fetch leads
    let qb = admin.from("leads").select("*");

    if (query.status) {
        qb = qb.eq("status", query.status);
    }
    if (query.dateFrom) {
        qb = qb.gte("created_at", `${query.dateFrom}T00:00:00+09:00`);
    }
    if (query.dateTo) {
        qb = qb.lte("created_at", `${query.dateTo}T23:59:59+09:00`);
    }

    qb = qb.order("created_at", { ascending: false });

    const { data, error } = await qb;

    if (error) {
        throw internalServerError("리드 목록을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const rows = data ?? [];

    const header = "리드ID,의사명,업체명,서비스명,상태,과금상태,과금금액,환불여부,생성일시";

    if (rows.length === 0) {
        return header + "\n";
    }

    // Batch fetch lead_charges separately (avoids FK ambiguity)
    const leadIds = rows.map((r) => r.id);
    const { data: chargeRows } = await admin
        .from("lead_charges")
        .select("lead_id, status, total_amount, refund_amount")
        .in("lead_id", leadIds);

    const chargeMap = new Map(
        (chargeRows ?? []).map((c) => [c.lead_id, c]),
    );

    // Batch fetch vendor names
    const vendorIds = [...new Set(rows.map((r) => r.vendor_id))];
    const { data: vendorRows } = await admin
        .from("vendors")
        .select("id, name")
        .in("id", vendorIds);

    const vendorNameMap = new Map((vendorRows ?? []).map((v) => [v.id, v.name]));

    // Batch fetch doctor display names
    const doctorIds = [...new Set(rows.map((r) => r.doctor_user_id))];
    const { data: profileRows } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", doctorIds);

    const doctorNameMap = new Map((profileRows ?? []).map((p) => [p.id, p.display_name ?? ""]));

    const statusLabels: Record<string, string> = {
        submitted: "제출",
        in_progress: "진행중",
        quote_pending: "견적대기",
        negotiating: "협상중",
        contracted: "계약완료",
        hold: "보류",
        canceled: "취소",
        closed: "종료",
    };

    const chargeStatusLabels: Record<string, string> = {
        charged: "과금",
        pending: "대기",
        refunded: "환불",
        waived: "면제",
        failed: "실패",
    };

    const csvRows = rows.map((row) => {
        const charge = chargeMap.get(row.id) ?? null;

        return toCsvRow([
            row.id,
            doctorNameMap.get(row.doctor_user_id) ?? "",
            vendorNameMap.get(row.vendor_id) ?? "",
            row.service_name ?? "",
            statusLabels[row.status] ?? row.status,
            charge ? (chargeStatusLabels[charge.status] ?? charge.status) : "",
            charge ? charge.total_amount : "",
            charge?.refund_amount ? "Y" : "N",
            row.created_at,
        ]);
    });

    return [header, ...csvRows].join("\n");
}
