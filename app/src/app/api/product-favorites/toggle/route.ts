import { z } from "zod";
import { zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";

const ProductFavoriteToggleBodySchema = z
    .object({
        productId: zUuid,
    })
    .strict();

export const POST = withApi(
    withRole(["doctor"], async (ctx) => {
        const body = ProductFavoriteToggleBodySchema.parse(await ctx.req.json());

        // Verify product exists and is active (RLS handles visibility)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: product, error: productError } = await (ctx.supabase as any)
            .from("products")
            .select("id")
            .eq("id", body.productId)
            .maybeSingle();

        if (productError) {
            throw internalServerError("상품을 확인할 수 없습니다.", {
                message: productError.message,
                code: productError.code,
            });
        }

        if (!product) {
            throw notFound("상품을 찾을 수 없습니다.");
        }

        // Check existing favorite
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing, error: existingError } = await (ctx.supabase as any)
            .from("product_favorites")
            .select("product_id")
            .eq("user_id", ctx.user.id)
            .eq("product_id", body.productId)
            .maybeSingle();

        if (existingError) {
            throw internalServerError("찜 상태를 확인할 수 없습니다.", {
                message: existingError.message,
                code: existingError.code,
            });
        }

        if (existing) {
            // Remove favorite
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: deleteError } = await (ctx.supabase as any)
                .from("product_favorites")
                .delete()
                .eq("user_id", ctx.user.id)
                .eq("product_id", body.productId);

            if (deleteError) {
                throw internalServerError("찜 해제에 실패했습니다.", {
                    message: deleteError.message,
                    code: deleteError.code,
                });
            }

            return ok({ productId: body.productId, isFavorited: false });
        }

        // Add favorite
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (ctx.supabase as any)
            .from("product_favorites")
            .insert({
                user_id: ctx.user.id,
                product_id: body.productId,
            });

        if (insertError) {
            if (insertError.code !== "23505") {
                throw internalServerError("찜 설정에 실패했습니다.", {
                    message: insertError.message,
                    code: insertError.code,
                });
            }
        }

        return ok({ productId: body.productId, isFavorited: true });
    }),
);
