import { VendorVerificationUpsertBodySchema } from "@/lib/schema/verification";
import { conflict, internalServerError, tooManyRequests } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { checkRateLimit, incrementRateLimit, logRateLimitExceeded } from "@/server/rate-limit";
import { mapVendorVerificationRow } from "@/server/verification/mapper";

export const GET = withApi(
    withRole(["vendor"], async (ctx) => {
        const { data, error } = await ctx.supabase
            .from("vendor_verifications")
            .select("*")
            .eq("user_id", ctx.user.id)
            .maybeSingle();

        if (error) {
            throw internalServerError("검수 정보를 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        return ok({ verification: data ? mapVendorVerificationRow(data) : null });
    }),
);

export const POST = withApi(
    withRole(["vendor"], async (ctx) => {
        const body = VendorVerificationUpsertBodySchema.parse(await ctx.req.json());

        // Rate limit 체크
        const rateCheck = await checkRateLimit(ctx.user.id, "verification_submit");
        if (!rateCheck.allowed) {
            await logRateLimitExceeded(ctx.user.id, "verification_submit", { role: "vendor" });
            throw tooManyRequests("검수 제출 횟수를 초과했습니다.", {
                resetAt: rateCheck.resetAt?.toISOString(),
                retryAfter: rateCheck.retryAfterSeconds,
            });
        }

        const { data: existing, error: existingError } = await ctx.supabase
            .from("vendor_verifications")
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
            business_no: body.businessNo,
            company_name: body.companyName,
            contact_name: body.contactName ?? null,
            contact_phone: body.contactPhone ?? null,
            contact_email: body.contactEmail ?? null,
            business_license_file_id: body.businessLicenseFileId ?? null,
            status: "pending" as const,
            reviewed_by: null,
            reviewed_at: null,
            reject_reason: null,
        };

        if (!existing) {
            const { data, error } = await ctx.supabase
                .from("vendor_verifications")
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

            // 성공 시 rate limit 카운트 증가
            await incrementRateLimit(ctx.user.id, "verification_submit");

            return created({ verification: mapVendorVerificationRow(data) });
        }

        const updatePayload = {
            business_no: body.businessNo,
            company_name: body.companyName,
            contact_name: body.contactName ?? null,
            contact_phone: body.contactPhone ?? null,
            contact_email: body.contactEmail ?? null,
            business_license_file_id: body.businessLicenseFileId ?? null,
            status: "pending" as const,
            reviewed_by: null,
            reviewed_at: null,
            reject_reason: null,
        };

        const { data, error } = await ctx.supabase
            .from("vendor_verifications")
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

        // 성공 시 rate limit 카운트 증가
        await incrementRateLimit(ctx.user.id, "verification_submit");

        return ok({ verification: mapVendorVerificationRow(data) });
    }),
);
