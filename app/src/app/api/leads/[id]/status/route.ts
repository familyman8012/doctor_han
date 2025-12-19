import { LeadStatusPatchBodySchema } from "@/lib/schema/lead";
import { zUuid } from "@/lib/schema/common";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { fetchLeadDetail } from "@/server/lead/repository";

export const PATCH = withApi(
    withAuth(async (ctx) => {
        const leadId = zUuid.parse(ctx.params.id);
        const body = LeadStatusPatchBodySchema.parse(await ctx.req.json());

        const { data: lead, error: leadError } = await ctx.supabase
            .from("leads")
            .select("id, status")
            .eq("id", leadId)
            .maybeSingle();

        if (leadError) {
            throw internalServerError("리드를 확인할 수 없습니다.", {
                message: leadError.message,
                code: leadError.code,
            });
        }

        if (!lead) {
            throw notFound("리드를 찾을 수 없습니다.");
        }

        if (ctx.profile.role === "doctor" && body.status !== "canceled") {
            throw badRequest("한의사는 문의 취소만 가능합니다.");
        }

        if (lead.status === body.status) {
            const detail = await fetchLeadDetail(ctx.supabase, leadId);
            return ok({ lead: detail });
        }

        const { data: updated, error: updateError } = await ctx.supabase
            .from("leads")
            .update({ status: body.status })
            .eq("id", leadId)
            .select("*")
            .single();

        if (updateError) {
            throw internalServerError("리드 상태 변경에 실패했습니다.", {
                message: updateError.message,
                code: updateError.code,
            });
        }

        const historyResult = await ctx.supabase.from("lead_status_history").insert({
            lead_id: leadId,
            from_status: lead.status,
            to_status: updated.status,
            changed_by: ctx.user.id,
        });

        if (historyResult.error) {
            console.error("[PATCH /api/leads/:id/status] lead_status_history insert failed", historyResult.error);
        }

        const detail = await fetchLeadDetail(ctx.supabase, leadId);
        return ok({ lead: detail });
    }),
);

