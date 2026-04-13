import { LeadReportBodySchema } from "@/lib/schema/lead";
import { notFound } from "@/server/api/errors";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { mapLeadReportRow } from "@/server/lead/mapper";
import { insertLeadReport } from "@/server/lead/repository";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { getVendorIdByUserId } from "@/server/vendor/utils";

export const POST = withApi(
    withApprovedVendor(async (ctx) => {
        const leadId = (await ctx.params).id;
        const body = LeadReportBodySchema.parse(await ctx.req.json());

        // Verify the lead belongs to this vendor
        const admin = createSupabaseAdminClient();
        const vendorId = await getVendorIdByUserId(admin, ctx.user.id);

        const { data: lead } = await admin
            .from("leads")
            .select("id, vendor_id")
            .eq("id", leadId)
            .single();

        if (!lead || lead.vendor_id !== vendorId) {
            throw notFound("리드를 찾을 수 없습니다.");
        }

        const report = await insertLeadReport(admin, {
            lead_id: leadId,
            reporter_user_id: ctx.user.id,
            reason: body.reason,
            detail: body.detail ?? null,
        });

        // 신고 접수 시 리드 상태를 자동으로 보류(hold)로 전환
        const { error: statusError } = await admin
            .from("leads")
            .update({ status: "hold" })
            .eq("id", leadId)
            .not("status", "in", '("canceled","closed","contracted")');
        if (statusError) {
            console.error("[LeadReport] auto hold transition failed", statusError);
        }

        return created({ report: mapLeadReportRow(report) });
    }),
);
