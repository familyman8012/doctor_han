import { ReviewReplyCreateBodySchema, ReviewReplyPatchBodySchema } from "@/lib/schema/review";
import { zUuid } from "@/lib/schema/common";
import { forbidden, internalServerError, notFound } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedVendor } from "@/server/auth/guards";
import { mapReviewReplyRow } from "@/server/review/mapper";
import {
    insertReply,
    updateReplyByReviewId,
    deleteReplyByReviewId,
} from "@/server/review/repository";

async function validateVendorOwnership(
    ctx: Parameters<Parameters<typeof withApprovedVendor>[0]>[0],
    reviewId: string,
): Promise<void> {
    const { data: review, error } = await ctx.supabase
        .from("reviews")
        .select("vendor_id, vendors!inner(owner_user_id)")
        .eq("id", reviewId)
        .maybeSingle();

    if (error) {
        throw internalServerError("리뷰를 확인할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (!review) throw notFound("리뷰를 찾을 수 없습니다.");

    const vendor = (review as unknown as { vendors: { owner_user_id: string } }).vendors;
    if (vendor.owner_user_id !== ctx.user.id) {
        throw forbidden("해당 리뷰에 답변할 권한이 없습니다.");
    }
}

export const POST = withApi(
    withApprovedVendor<{ id: string }>(async (ctx) => {
        const reviewId = zUuid.parse(ctx.params.id);
        const body = ReviewReplyCreateBodySchema.parse(await ctx.req.json());

        await validateVendorOwnership(ctx, reviewId);

        const reply = await insertReply(ctx.supabase, {
            review_id: reviewId,
            vendor_user_id: ctx.user.id,
            content: body.content,
        });

        return created({ reply: mapReviewReplyRow(reply) });
    }),
);

export const PATCH = withApi(
    withApprovedVendor<{ id: string }>(async (ctx) => {
        const reviewId = zUuid.parse(ctx.params.id);
        const body = ReviewReplyPatchBodySchema.parse(await ctx.req.json());

        const reply = await updateReplyByReviewId(ctx.supabase, reviewId, ctx.user.id, body.content);
        return ok({ reply: mapReviewReplyRow(reply) });
    }),
);

export const DELETE = withApi(
    withApprovedVendor<{ id: string }>(async (ctx) => {
        const reviewId = zUuid.parse(ctx.params.id);
        const result = await deleteReplyByReviewId(ctx.supabase, reviewId, ctx.user.id);
        return ok({ id: result.id });
    }),
);
