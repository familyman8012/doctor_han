import type { Database } from "@/lib/database.types";
import { AdminVerificationRejectBodySchema, type AdminVerificationType } from "@/lib/schema/admin";
import { zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { sendVerificationResult } from "@/server/notification/service";
import { mapDoctorVerificationRow, mapVendorVerificationRow } from "@/server/verification/mapper";
import type { SupabaseClient } from "@supabase/supabase-js";

async function resolveVerificationType(
    supabase: SupabaseClient<Database>,
    id: string,
    requestedType?: AdminVerificationType,
): Promise<AdminVerificationType> {
    if (requestedType === "doctor") {
        const { data, error } = await supabase.from("doctor_verifications").select("id").eq("id", id).maybeSingle();
        if (error) {
            throw internalServerError("검수 요청을 확인할 수 없습니다.", { message: error.message, code: error.code });
        }
        if (!data) {
            throw notFound("검수 요청을 찾을 수 없습니다.");
        }
        return "doctor";
    }

    if (requestedType === "vendor") {
        const { data, error } = await supabase.from("vendor_verifications").select("id").eq("id", id).maybeSingle();
        if (error) {
            throw internalServerError("검수 요청을 확인할 수 없습니다.", { message: error.message, code: error.code });
        }
        if (!data) {
            throw notFound("검수 요청을 찾을 수 없습니다.");
        }
        return "vendor";
    }

    const { data: doctor, error: doctorError } = await supabase
        .from("doctor_verifications")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (doctorError) {
        throw internalServerError("검수 요청을 확인할 수 없습니다.", {
            message: doctorError.message,
            code: doctorError.code,
        });
    }

    if (doctor) {
        return "doctor";
    }

    const { data: vendor, error: vendorError } = await supabase
        .from("vendor_verifications")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (vendorError) {
        throw internalServerError("검수 요청을 확인할 수 없습니다.", {
            message: vendorError.message,
            code: vendorError.code,
        });
    }

    if (vendor) {
        return "vendor";
    }

    throw notFound("검수 요청을 찾을 수 없습니다.");
}

export const POST = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const id = zUuid.parse(ctx.params.id);
        const body = AdminVerificationRejectBodySchema.parse(await ctx.req.json());
        const type = await resolveVerificationType(ctx.supabase, id, body.type);
        const now = new Date().toISOString();

        if (type === "doctor") {
            const { data, error } = await ctx.supabase
                .from("doctor_verifications")
                .update({
                    status: "rejected",
                    reviewed_by: ctx.user.id,
                    reviewed_at: now,
                    reject_reason: body.reason,
                })
                .eq("id", id)
                .select("*")
                .maybeSingle();

            if (error) {
                throw internalServerError("반려 처리에 실패했습니다.", { message: error.message, code: error.code });
            }

            if (!data) {
                throw notFound("검수 요청을 찾을 수 없습니다.");
            }

            const auditResult = await ctx.supabase.from("audit_logs").insert({
                actor_user_id: ctx.user.id,
                action: "doctor_verification.reject",
                target_type: "doctor_verification",
                target_id: data.id,
                metadata: { status: data.status, reason: body.reason },
            });

            if (auditResult.error) {
                console.error("[POST /api/admin/verifications/:id/reject] audit_logs insert failed", auditResult.error);
            }

            // 알림 발송 (이메일 + 카카오 병렬)
            let notificationWarning: string | undefined;
            const { data: profile } = await ctx.supabase
                .from("profiles")
                .select("display_name, email, phone")
                .eq("id", data.user_id)
                .single();

            if (profile?.email || profile?.phone) {
                try {
                    const notificationResult = await sendVerificationResult({
                        userId: data.user_id,
                        email: profile.email ?? "",
                        phone: profile.phone ?? undefined,
                        recipientName: profile.display_name || "회원",
                        type: "doctor",
                        action: "rejected",
                        rejectReason: body.reason,
                    });

                    const warnings: string[] = [];
                    if (!notificationResult.email.success && !notificationResult.email.skipped) {
                        warnings.push("이메일");
                    }
                    if (!notificationResult.kakao.success && !notificationResult.kakao.skipped) {
                        warnings.push("카카오");
                    }
                    if (warnings.length > 0) {
                        notificationWarning = `${warnings.join(", ")} 알림 발송에 실패했습니다.`;
                    }
                } catch (error) {
                    console.error("[POST /api/admin/verifications/:id/reject] notification send failed", {
                        userId: data.user_id,
                        error,
                    });
                    notificationWarning = "알림 발송에 실패했습니다.";
                }
            }

            return ok({ type: "doctor" as const, verification: mapDoctorVerificationRow(data), emailWarning: notificationWarning });
        }

        const { data, error } = await ctx.supabase
            .from("vendor_verifications")
            .update({
                status: "rejected",
                reviewed_by: ctx.user.id,
                reviewed_at: now,
                reject_reason: body.reason,
            })
            .eq("id", id)
            .select("*")
            .maybeSingle();

        if (error) {
            throw internalServerError("반려 처리에 실패했습니다.", { message: error.message, code: error.code });
        }

        if (!data) {
            throw notFound("검수 요청을 찾을 수 없습니다.");
        }

        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "vendor_verification.reject",
            target_type: "vendor_verification",
            target_id: data.id,
            metadata: { status: data.status, reason: body.reason },
        });

        if (auditResult.error) {
            console.error("[POST /api/admin/verifications/:id/reject] audit_logs insert failed", auditResult.error);
        }

        // 알림 발송 (이메일 + 카카오 병렬)
        let notificationWarning: string | undefined;
        const { data: profile } = await ctx.supabase
            .from("profiles")
            .select("display_name, email, phone")
            .eq("id", data.user_id)
            .single();

        if (profile?.email || profile?.phone) {
            try {
                const notificationResult = await sendVerificationResult({
                    userId: data.user_id,
                    email: profile.email ?? "",
                    phone: profile.phone ?? undefined,
                    recipientName: profile.display_name || "회원",
                    type: "vendor",
                    action: "rejected",
                    rejectReason: body.reason,
                });

                const warnings: string[] = [];
                if (!notificationResult.email.success && !notificationResult.email.skipped) {
                    warnings.push("이메일");
                }
                if (!notificationResult.kakao.success && !notificationResult.kakao.skipped) {
                    warnings.push("카카오");
                }
                if (warnings.length > 0) {
                    notificationWarning = `${warnings.join(", ")} 알림 발송에 실패했습니다.`;
                }
            } catch (error) {
                console.error("[POST /api/admin/verifications/:id/reject] notification send failed", {
                    userId: data.user_id,
                    error,
                });
                notificationWarning = "알림 발송에 실패했습니다.";
            }
        }

        return ok({ type: "vendor" as const, verification: mapVendorVerificationRow(data), emailWarning: notificationWarning });
    }),
);
