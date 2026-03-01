import { LeadReportReviewBodySchema } from "@/lib/schema/lead";
import { badRequest, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { refundLeadCharge } from "@/server/lead/charge-service";
import { mapLeadReportRow } from "@/server/lead/mapper";
import { getLeadChargeByLeadId, getLeadReportById, updateLeadReport } from "@/server/lead/repository";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

export const POST = withApi(
    withRole(["admin"], async (ctx) => {
        const reportId = (await ctx.params).id;
        const body = LeadReportReviewBodySchema.parse(await ctx.req.json());

        const admin = createSupabaseAdminClient();

        const report = await getLeadReportById(admin, reportId);
        if (!report) throw notFound("신고를 찾을 수 없습니다.");
        if (report.status !== "pending") throw badRequest("이미 처리된 신고입니다.");

        if (body.action === "approve") {
            const charge = await getLeadChargeByLeadId(admin, report.lead_id);
            if (charge && charge.status === "charged") {
                await refundLeadCharge(charge.id, "fraud_vendor_report", ctx.user.id);
            }
        }

        const updatedReport = await updateLeadReport(admin, reportId, {
            status: body.action === "approve" ? "approved" : "dismissed",
            reviewed_by: ctx.user.id,
            reviewed_at: new Date().toISOString(),
        });

        return ok({ report: mapLeadReportRow(updatedReport) });
    }),
);
