import { LeadStatusPatchBodySchema } from "@/lib/schema/lead";
import { zUuid } from "@/lib/schema/common";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { fetchLeadDetail } from "@/server/lead/repository";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { sendDoctorNotification } from "@/server/notification/service";
import { getLeadStatusChangedDoctorTemplate } from "@/server/notification/templates";
import { getKakaoLeadStatusChangedDoctorTemplate } from "@/server/notification/kakao-templates";

export const PATCH = withApi(
    withAuth<{ id: string }>(async (ctx) => {
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

        // ── 의료인 알림 발송 (fire-and-forget) ──
        const DOCTOR_NOTIFY_STATUSES = ["in_progress", "quote_pending", "negotiating", "contracted", "canceled", "closed"];

        const STATUS_LABELS: Record<string, string> = {
            in_progress: "진행중",
            quote_pending: "견적대기",
            negotiating: "협상중",
            contracted: "계약완료",
            canceled: "취소",
            closed: "종료",
        };

        if (DOCTOR_NOTIFY_STATUSES.includes(body.status)) {
            const adminSupabase = createSupabaseAdminClient();

            // lead의 doctor_user_id, vendor_id 조회
            const { data: leadInfo } = await adminSupabase
                .from("leads")
                .select("doctor_user_id, vendor_id")
                .eq("id", leadId)
                .single();

            if (leadInfo?.doctor_user_id && leadInfo?.vendor_id) {
                // doctor profile 조회
                const { data: doctorProfile } = await adminSupabase
                    .from("profiles")
                    .select("email, phone, display_name")
                    .eq("id", leadInfo.doctor_user_id)
                    .single();

                // vendor name 조회
                const { data: vendor } = await adminSupabase
                    .from("vendors")
                    .select("name")
                    .eq("id", leadInfo.vendor_id)
                    .single();

                if ((doctorProfile?.email || doctorProfile?.phone) && vendor?.name) {
                    const statusLabel = STATUS_LABELS[body.status] ?? body.status;
                    const doctorName = doctorProfile.display_name ?? "회원";

                    sendDoctorNotification({
                        doctorUserId: leadInfo.doctor_user_id,
                        email: doctorProfile.email ?? undefined,
                        phone: doctorProfile.phone ?? undefined,
                        notificationType: "lead_status_changed",
                        emailTemplate: getLeadStatusChangedDoctorTemplate({
                            doctorName,
                            vendorName: vendor.name,
                            statusLabel,
                            leadId,
                        }),
                        kakaoTemplate: getKakaoLeadStatusChangedDoctorTemplate({
                            doctorName,
                            vendorName: vendor.name,
                            statusLabel,
                        }),
                    }).catch(() => {});
                }
            }
        }

        const detail = await fetchLeadDetail(ctx.supabase, leadId);
        return ok({ lead: detail });
    }),
);
