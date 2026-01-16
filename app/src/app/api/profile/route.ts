import type { TablesUpdate } from "@/lib/database.types";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/constants/terms";
import { ProfileCreateBodySchema, ProfilePatchBodySchema } from "@/lib/schema/profile";
import { badRequest, conflict, internalServerError, notFound } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth, withUser } from "@/server/auth/guards";
import { mapProfileRow } from "@/server/profile/mapper";

type ProfileUpdateWithAvatar = TablesUpdate<"profiles"> & { avatar_url?: string | null };

export const POST = withApi(
    withUser(async (ctx) => {
        const body = ProfileCreateBodySchema.parse(await ctx.req.json());
        const now = new Date().toISOString();

        const { data: existing, error: findError } = await ctx.supabase
            .from("profiles")
            .select("id")
            .eq("id", ctx.user.id)
            .maybeSingle();

        if (findError) {
            throw internalServerError("프로필을 확인할 수 없습니다.", {
                message: findError.message,
                code: findError.code,
            });
        }

        if (existing) {
            throw conflict("이미 프로필이 있습니다.");
        }

        const { data: profileRow, error: insertError } = await ctx.supabase
            .from("profiles")
            .insert({
                id: ctx.user.id,
                role: body.role,
                display_name: body.displayName,
                phone: body.phone ?? ctx.user.phone ?? null,
                email: ctx.user.email ?? null,
                terms_agreed_version: CURRENT_TERMS_VERSION,
                terms_agreed_at: now,
                privacy_agreed_version: CURRENT_PRIVACY_VERSION,
                privacy_agreed_at: now,
                marketing_opt_in_at: body.marketingAgreed ? now : null,
                marketing_opt_out_at: null,
            })
            .select("*")
            .single();

        if (insertError) {
            if (insertError.code === "23505") {
                throw conflict("이미 프로필이 있습니다.");
            }

            throw internalServerError("프로필 생성에 실패했습니다.", {
                message: insertError.message,
                code: insertError.code,
            });
        }

        // 마케팅 동의 시 notification_settings 생성
        if (body.marketingAgreed) {
            const { error: marketingSettingsError } = await ctx.supabase
                .from("notification_settings")
                .upsert({
                    user_id: ctx.user.id,
                    marketing_enabled: true,
                });

            if (marketingSettingsError) {
                throw internalServerError("마케팅 동의 정보를 저장할 수 없습니다.", {
                    message: marketingSettingsError.message,
                    code: marketingSettingsError.code,
                });
            }
        }

        return created({ profile: mapProfileRow(profileRow) });
    }),
);

export const PATCH = withApi(
    withAuth(async (ctx) => {
        const body = ProfilePatchBodySchema.parse(await ctx.req.json());

        const update: ProfileUpdateWithAvatar = {};
        const now = new Date().toISOString();
        if (typeof body.displayName !== "undefined") {
            update.display_name = body.displayName;
        }
        if (typeof body.phone !== "undefined") {
            update.phone = body.phone;
        }
        if (typeof body.termsAgreed !== "undefined") {
            update.terms_agreed_version = CURRENT_TERMS_VERSION;
            update.terms_agreed_at = now;
            update.privacy_agreed_version = CURRENT_PRIVACY_VERSION;
            update.privacy_agreed_at = now;
        }
        if (typeof body.avatarFileId !== "undefined") {
            if (body.avatarFileId === null) {
                update.avatar_url = null;
            } else {
                const { data: fileRow, error: fileError } = await ctx.supabase
                    .from("files")
                    .select("id, purpose")
                    .eq("id", body.avatarFileId)
                    .maybeSingle();

                if (fileError) {
                    throw internalServerError("아바타 파일을 확인할 수 없습니다.", {
                        message: fileError.message,
                        code: fileError.code,
                    });
                }

                if (!fileRow) {
                    throw notFound("아바타 파일을 찾을 수 없습니다.");
                }

                if (fileRow.purpose !== "avatar") {
                    throw badRequest("아바타 용도로 업로드된 파일만 사용할 수 있습니다.");
                }

                update.avatar_url = `/api/files/open?fileId=${fileRow.id}`;
            }
        }

        const { data: profileRow, error: updateError } = await ctx.supabase
            .from("profiles")
            .update(update)
            .eq("id", ctx.user.id)
            .select("*")
            .single();

        if (updateError) {
            throw internalServerError("프로필 수정에 실패했습니다.", {
                message: updateError.message,
                code: updateError.code,
            });
        }

        return ok({ profile: mapProfileRow(profileRow) });
    }),
);
