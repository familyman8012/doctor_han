import { ReviewPatchBodySchema } from "@/lib/schema/review";
import { zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedDoctor } from "@/server/auth/guards";
import type { Tables, TablesUpdate } from "@/lib/database.types";
import { mapReviewRow, mapReviewReplyRow } from "@/server/review/mapper";
import {
    updateReviewById,
    deleteReviewById,
    validateReviewPhotoFileIds,
    getReplyByReviewId,
} from "@/server/review/repository";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

type ReviewRow = Tables<"reviews">;
type ReviewRowWithVendor = ReviewRow & { vendor?: { id: string; name: string } | null };
type ReviewUpdateWithPhotos = TablesUpdate<"reviews"> & { photo_file_ids?: string[] };

function mapReviewVendorSummary(input: { id: string; name: string } | null | undefined): { id: string; name: string } | null {
    if (!input) return null;
    return { id: input.id, name: input.name };
}

export const GET = withApi(async (_req: NextRequest, routeCtx: { params: Promise<{ id: string }> }) => {
    const reviewId = zUuid.parse((await routeCtx.params).id);

    const supabase = await createSupabaseServerClient();
    const { data: reviewRow, error } = await supabase
        .from("reviews")
        .select("*, vendor:vendors(id, name)")
        .eq("id", reviewId)
        .maybeSingle();

    if (error) {
        throw internalServerError("리뷰를 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (!reviewRow) throw notFound("리뷰를 찾을 수 없습니다.");

    const reviewWithVendor = reviewRow as unknown as ReviewRowWithVendor;

    const replyRow = await getReplyByReviewId(supabase, reviewId);

    return ok({
        review: mapReviewRow(reviewWithVendor),
        vendor: mapReviewVendorSummary(reviewWithVendor.vendor),
        reply: replyRow ? mapReviewReplyRow(replyRow) : null,
    });
});

export const PATCH = withApi(
    withApprovedDoctor<{ id: string }>(async (ctx) => {
        const reviewId = zUuid.parse(ctx.params.id);
        const body = ReviewPatchBodySchema.parse(await ctx.req.json());

        const update: ReviewUpdateWithPhotos = {};
        if (typeof body.rating !== "undefined") update.rating = body.rating;
        if (typeof body.qualityRating !== "undefined") update.quality_rating = body.qualityRating ?? null;
        if (typeof body.communicationRating !== "undefined") update.communication_rating = body.communicationRating ?? null;
        if (typeof body.speedRating !== "undefined") update.speed_rating = body.speedRating ?? null;
        if (typeof body.content !== "undefined") update.content = body.content;
        if (typeof body.amount !== "undefined") update.amount = body.amount ?? null;
        if (typeof body.workedAt !== "undefined") update.worked_at = body.workedAt ?? null;
        if (typeof body.status !== "undefined") update.status = body.status;

        if (typeof body.photoFileIds !== "undefined") {
            const validated = await validateReviewPhotoFileIds(ctx.supabase, body.photoFileIds);
            update.photo_file_ids = validated ?? [];
        }

        const updated = await updateReviewById(ctx.supabase, reviewId, ctx.user.id, update);
        return ok({ review: mapReviewRow(updated as ReviewRow) });
    }),
);

export const DELETE = withApi(
    withApprovedDoctor<{ id: string }>(async (ctx) => {
        const reviewId = zUuid.parse(ctx.params.id);
        const result = await deleteReviewById(ctx.supabase, reviewId, ctx.user.id);
        return ok({ id: result.id });
    }),
);
