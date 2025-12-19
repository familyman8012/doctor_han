import type { TablesUpdate } from "@/lib/database.types";
import { ProfileCreateBodySchema, ProfilePatchBodySchema } from "@/lib/schema/profile";
import { conflict, internalServerError } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth, withUser } from "@/server/auth/guards";
import { mapProfileRow } from "@/server/profile/mapper";

export const POST = withApi(
    withUser(async (ctx) => {
        const body = ProfileCreateBodySchema.parse(await ctx.req.json());

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

        return created({ profile: mapProfileRow(profileRow) });
    }),
);

export const PATCH = withApi(
    withAuth(async (ctx) => {
        const body = ProfilePatchBodySchema.parse(await ctx.req.json());

        const update: TablesUpdate<"profiles"> = {};
        if (typeof body.displayName !== "undefined") {
            update.display_name = body.displayName;
        }
        if (typeof body.phone !== "undefined") {
            update.phone = body.phone;
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
