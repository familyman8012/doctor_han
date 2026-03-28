import type { Database } from "@/lib/database.types";
import { AdminVerificationApproveBodySchema, type AdminVerificationType } from "@/lib/schema/admin";
import { zUuid } from "@/lib/schema/common";
import { conflict, internalServerError, notFound } from "@/server/api/errors";
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

async function requireVendorReadyForApproval(supabase: SupabaseClient<Database>, userId: string) {
    const { data, error } = await supabase
        .from("vendors")
        .select("id, status")
        .eq("owner_user_id", userId)
        .maybeSingle();

    if (error) {
        throw internalServerError("업체 상태를 확인할 수 없습니다.", { message: error.message, code: error.code });
    }

    if (!data) {
        throw conflict("업체 프로필이 없습니다. 업체 프로필 생성 후 다시 승인해주세요.");
    }

    if (data.status === "inactive" || data.status === "banned") {
        throw conflict("비활성/정지된 업체는 승인과 동시에 활성화할 수 없습니다. 업체 상태를 먼저 확인해주세요.", {
            status: data.status,
        });
    }

    return data;
}

export const POST = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const id = zUuid.parse(ctx.params.id);

        let rawBody: unknown = {};
        try {
            rawBody = await ctx.req.json();
        } catch {
            rawBody = {};
        }

        const body = AdminVerificationApproveBodySchema.parse(rawBody);
        const type = await resolveVerificationType(ctx.supabase, id, body.type);
        const now = new Date().toISOString();

        if (type === "doctor") {
            const { data, error } = await ctx.supabase
                .from("doctor_verifications")
                .update({
                    status: "approved",
                    reviewed_by: ctx.user.id,
                    reviewed_at: now,
                    reject_reason: null,
                })
                .eq("id", id)
                .select("*")
                .maybeSingle();

            if (error) {
                throw internalServerError("승인 처리에 실패했습니다.", { message: error.message, code: error.code });
            }

            if (!data) {
                throw notFound("검수 요청을 찾을 수 없습니다.");
            }

            const auditResult = await ctx.supabase.from("audit_logs").insert({
                actor_user_id: ctx.user.id,
                action: "doctor_verification.approve",
                target_type: "doctor_verification",
                target_id: data.id,
                metadata: { status: data.status },
            });

            if (auditResult.error) {
                console.error("[POST /api/admin/verifications/:id/approve] audit_logs insert failed", auditResult.error);
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
                        action: "approved",
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
                    console.error("[POST /api/admin/verifications/:id/approve] notification send failed", {
                        userId: data.user_id,
                        error,
                    });
                    notificationWarning = "알림 발송에 실패했습니다.";
                }
            }

            return ok({ type: "doctor" as const, verification: mapDoctorVerificationRow(data), emailWarning: notificationWarning });
        }

        const { data: existingVerification, error: existingVerificationError } = await ctx.supabase
            .from("vendor_verifications")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (existingVerificationError) {
            throw internalServerError("검수 요청을 확인할 수 없습니다.", {
                message: existingVerificationError.message,
                code: existingVerificationError.code,
            });
        }

        if (!existingVerification) {
            throw notFound("검수 요청을 찾을 수 없습니다.");
        }

        const vendor = await requireVendorReadyForApproval(ctx.supabase, existingVerification.user_id);

        let vendorActivated = vendor.status === "active";
        const shouldRollbackVendorActivation = vendor.status === "draft";

        if (shouldRollbackVendorActivation) {
            const { data: activatedVendor, error: vendorStatusError } = await ctx.supabase
                .from("vendors")
                .update({ status: "active" as const, updated_at: now })
                .eq("id", vendor.id)
                .eq("status", "draft")
                .select("id")
                .maybeSingle();

            if (vendorStatusError) {
                throw internalServerError("업체 활성화에 실패했습니다. 업체 상태를 확인해주세요.", {
                    message: vendorStatusError.message,
                    code: vendorStatusError.code,
                });
            }

            if (!activatedVendor) {
                throw conflict("업체가 더 이상 활성화 가능한 상태가 아닙니다. 새로고침 후 다시 시도해주세요.");
            }

            vendorActivated = true;
        }

        const data = await (async () => {
            const { data: approvedVerification, error } = await ctx.supabase
                .from("vendor_verifications")
                .update({
                    status: "approved",
                    reviewed_by: ctx.user.id,
                    reviewed_at: now,
                    reject_reason: null,
                })
                .eq("id", id)
                .select("*")
                .maybeSingle();

            if (error) {
                throw internalServerError("승인 처리에 실패했습니다.", { message: error.message, code: error.code });
            }

            if (!approvedVerification) {
                throw notFound("검수 요청을 찾을 수 없습니다.");
            }

            return approvedVerification;
        })().catch(async (error) => {
            if (shouldRollbackVendorActivation) {
                const { error: rollbackError } = await ctx.supabase
                    .from("vendors")
                    .update({ status: "draft" as const, updated_at: now })
                    .eq("id", vendor.id)
                    .eq("status", "active");

                if (rollbackError) {
                    console.error("[POST /api/admin/verifications/:id/approve] vendor activation rollback failed", rollbackError);
                }
            }

            throw error;
        });

        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "vendor_verification.approve",
            target_type: "vendor_verification",
            target_id: data.id,
            metadata: { status: data.status, vendorActivated },
        });

        if (auditResult.error) {
            console.error("[POST /api/admin/verifications/:id/approve] audit_logs insert failed", auditResult.error);
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
                    action: "approved",
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
                console.error("[POST /api/admin/verifications/:id/approve] notification send failed", {
                    userId: data.user_id,
                    error,
                });
                notificationWarning = "알림 발송에 실패했습니다.";
            }
        }

        return ok({ type: "vendor" as const, verification: mapVendorVerificationRow(data), emailWarning: notificationWarning });
    }),
);
