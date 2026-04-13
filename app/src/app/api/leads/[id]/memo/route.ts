import { LeadMemoPatchBodySchema } from "@/lib/schema/lead";
import { zUuid } from "@/lib/schema/common";
import { forbidden, internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";

export const PATCH = withApi(
    withRole<{ id: string }>(["doctor"], async (ctx) => {
        const leadId = zUuid.parse(ctx.params.id);
        const body = LeadMemoPatchBodySchema.parse(await ctx.req.json());

        // 본인 리드인지 확인
        const { data: lead, error: leadError } = await ctx.supabase
            .from("leads")
            .select("id, doctor_user_id")
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

        if (lead.doctor_user_id !== ctx.user.id) {
            throw forbidden("본인의 문의만 메모할 수 있습니다.");
        }

        const { error: updateError } = await ctx.supabase
            .from("leads")
            .update({ doctor_memo: body.memo || null })
            .eq("id", leadId);

        if (updateError) {
            throw internalServerError("메모 저장에 실패했습니다.", {
                message: updateError.message,
                code: updateError.code,
            });
        }

        return ok({ memo: body.memo || null });
    }),
);
