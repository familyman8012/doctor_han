import { MAX_REVIEW_PHOTOS, ReviewPatchBodySchema } from "@/lib/schema/review";
import { zUuid } from "@/lib/schema/common";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedDoctor } from "@/server/auth/guards";
import type { AuthedContext } from "@/server/auth/guards";
import type { Tables, TablesUpdate } from "@/lib/database.types";
import { mapReviewRow } from "@/server/review/mapper";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { NextRequest } from "next/server";

type ReviewRow = Tables<"reviews">;
type ReviewRowWithVendor = ReviewRow & { vendor?: { id: string; name: string } | null };
type ReviewUpdateWithPhotos = TablesUpdate<"reviews"> & { photo_file_ids?: string[] };

function mapReviewVendorSummary(input: { id: string; name: string } | null | undefined): { id: string; name: string } | null {
    if (!input) return null;
    return { id: input.id, name: input.name };
}

function uniqueIdsInOrder(ids: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        result.push(id);
    }
    return result;
}

async function validateReviewPhotoFileIds(ctx: AuthedContext, input: string[]): Promise<string[]> {
    if (input.length === 0) return [];

    const photoFileIds = uniqueIdsInOrder(input);
    if (photoFileIds.length > MAX_REVIEW_PHOTOS) {
        throw badRequest(`리뷰 사진은 최대 ${MAX_REVIEW_PHOTOS}개까지 업로드할 수 있습니다.`);
    }

    const { data: files, error } = await ctx.supabase.from("files").select("id, purpose").in("id", photoFileIds);
    if (error) {
        throw internalServerError("리뷰 사진을 확인할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const byId = new Map((files ?? []).map((row) => [row.id, row]));
    if (byId.size !== photoFileIds.length) {
        throw notFound("리뷰 사진을 찾을 수 없습니다.");
    }

    for (const fileId of photoFileIds) {
        const fileRow = byId.get(fileId);
        if (!fileRow) {
            throw notFound("리뷰 사진을 찾을 수 없습니다.");
        }
        const purpose = (fileRow as unknown as { purpose: string }).purpose;
        if (purpose !== "review_photo") {
            throw badRequest("리뷰 사진 용도로 업로드된 파일만 첨부할 수 있습니다.");
        }
    }

    return photoFileIds;
}

export const GET = withApi(async (_req: NextRequest, routeCtx: { params: { id: string } }) => {
    const reviewId = zUuid.parse(routeCtx.params.id);

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

    if (!reviewRow) {
        throw notFound("리뷰를 찾을 수 없습니다.");
    }

    const reviewWithVendor = reviewRow as unknown as ReviewRowWithVendor;
    return ok({
        review: mapReviewRow(reviewWithVendor),
        vendor: mapReviewVendorSummary(reviewWithVendor.vendor),
    });
});

export const PATCH = withApi(
    withApprovedDoctor<{ id: string }>(async (ctx) => {
        const reviewId = zUuid.parse(ctx.params.id);
        const body = ReviewPatchBodySchema.parse(await ctx.req.json());

        const update: ReviewUpdateWithPhotos = {};
        if (typeof body.rating !== "undefined") update.rating = body.rating;
        if (typeof body.content !== "undefined") update.content = body.content;
        if (typeof body.amount !== "undefined") update.amount = body.amount ?? null;
        if (typeof body.workedAt !== "undefined") update.worked_at = body.workedAt ?? null;
        if (typeof body.status !== "undefined") update.status = body.status;

        if (typeof body.photoFileIds !== "undefined") {
            update.photo_file_ids = await validateReviewPhotoFileIds(ctx, body.photoFileIds);
        }

        const { data: updated, error } = await ctx.supabase
            .from("reviews")
            .update(update)
            .eq("id", reviewId)
            .eq("doctor_user_id", ctx.user.id)
            .select("*")
            .maybeSingle();

        if (error) {
            throw internalServerError("리뷰 수정에 실패했습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        if (!updated) {
            throw notFound("리뷰를 찾을 수 없습니다.");
        }

        return ok({ review: mapReviewRow(updated as ReviewRow) });
    }),
);

export const DELETE = withApi(
    withApprovedDoctor<{ id: string }>(async (ctx) => {
        const reviewId = zUuid.parse(ctx.params.id);

        const { data: deleted, error } = await ctx.supabase
            .from("reviews")
            .delete()
            .eq("id", reviewId)
            .eq("doctor_user_id", ctx.user.id)
            .select("id")
            .maybeSingle();

        if (error) {
            throw internalServerError("리뷰 삭제에 실패했습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        if (!deleted) {
            throw notFound("리뷰를 찾을 수 없습니다.");
        }

        return ok({ id: deleted.id });
    }),
);
