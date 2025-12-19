import { FavoriteToggleBodySchema } from "@/lib/schema/favorite";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";

export const POST = withApi(
    withRole(["doctor"], async (ctx) => {
        const body = FavoriteToggleBodySchema.parse(await ctx.req.json());

        const { data: vendor, error: vendorError } = await ctx.supabase
            .from("vendors")
            .select("id")
            .eq("id", body.vendorId)
            .maybeSingle();

        if (vendorError) {
            throw internalServerError("업체를 확인할 수 없습니다.", {
                message: vendorError.message,
                code: vendorError.code,
            });
        }

        if (!vendor) {
            throw notFound("업체를 찾을 수 없습니다.");
        }

        const { data: existing, error: existingError } = await ctx.supabase
            .from("favorites")
            .select("vendor_id")
            .eq("user_id", ctx.user.id)
            .eq("vendor_id", body.vendorId)
            .maybeSingle();

        if (existingError) {
            throw internalServerError("찜 상태를 확인할 수 없습니다.", {
                message: existingError.message,
                code: existingError.code,
            });
        }

        if (existing) {
            const { error: deleteError } = await ctx.supabase
                .from("favorites")
                .delete()
                .eq("user_id", ctx.user.id)
                .eq("vendor_id", body.vendorId);

            if (deleteError) {
                throw internalServerError("찜 해제에 실패했습니다.", {
                    message: deleteError.message,
                    code: deleteError.code,
                });
            }

            return ok({ vendorId: body.vendorId, isFavorited: false });
        }

        const { error: insertError } = await ctx.supabase.from("favorites").insert({
            user_id: ctx.user.id,
            vendor_id: body.vendorId,
        });

        if (insertError) {
            if (insertError.code !== "23505") {
                throw internalServerError("찜 설정에 실패했습니다.", {
                    message: insertError.message,
                    code: insertError.code,
                });
            }
        }

        return ok({ vendorId: body.vendorId, isFavorited: true });
    }),
);

