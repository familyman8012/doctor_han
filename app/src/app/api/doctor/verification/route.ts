import { DoctorVerificationUpsertBodySchema } from "@/lib/schema/verification";
import { conflict, internalServerError } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { mapDoctorVerificationRow } from "@/server/verification/mapper";

export const GET = withApi(
    withRole(["doctor"], async (ctx) => {
        const { data, error } = await ctx.supabase
            .from("doctor_verifications")
            .select("*")
            .eq("user_id", ctx.user.id)
            .maybeSingle();

        if (error) {
            throw internalServerError("검수 정보를 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        return ok({ verification: data ? mapDoctorVerificationRow(data) : null });
    }),
);

export const POST = withApi(
    withRole(["doctor"], async (ctx) => {
        const body = DoctorVerificationUpsertBodySchema.parse(await ctx.req.json());

        const { data: existing, error: existingError } = await ctx.supabase
            .from("doctor_verifications")
            .select("id, status")
            .eq("user_id", ctx.user.id)
            .maybeSingle();

        if (existingError) {
            throw internalServerError("검수 정보를 확인할 수 없습니다.", {
                message: existingError.message,
                code: existingError.code,
            });
        }

        if (existing?.status === "approved") {
            throw conflict("이미 승인된 검수는 수정할 수 없습니다.");
        }

        const insertPayload = {
            user_id: ctx.user.id,
            license_no: body.licenseNo,
            full_name: body.fullName,
            birth_date: body.birthDate ?? null,
            clinic_name: body.clinicName ?? null,
            license_file_id: body.licenseFileId ?? null,
            status: "pending" as const,
            reviewed_by: null,
            reviewed_at: null,
            reject_reason: null,
        };

        if (!existing) {
            const { data, error } = await ctx.supabase
                .from("doctor_verifications")
                .insert(insertPayload)
                .select("*")
                .single();

            if (error) {
                if (error.code === "23505") {
                    throw conflict("이미 제출한 검수입니다.");
                }

                throw internalServerError("검수 제출에 실패했습니다.", {
                    message: error.message,
                    code: error.code,
                });
            }

            return created({ verification: mapDoctorVerificationRow(data) });
        }

        const updatePayload = {
            license_no: body.licenseNo,
            full_name: body.fullName,
            birth_date: body.birthDate ?? null,
            clinic_name: body.clinicName ?? null,
            license_file_id: body.licenseFileId ?? null,
            status: "pending" as const,
            reviewed_by: null,
            reviewed_at: null,
            reject_reason: null,
        };

        const { data, error } = await ctx.supabase
            .from("doctor_verifications")
            .update(updatePayload)
            .eq("user_id", ctx.user.id)
            .select("*")
            .single();

        if (error) {
            throw internalServerError("검수 제출에 실패했습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        return ok({ verification: mapDoctorVerificationRow(data) });
    }),
);
