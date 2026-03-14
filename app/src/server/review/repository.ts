import "server-only";

import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";
import { MAX_REVIEW_PHOTOS } from "@/lib/schema/review";
import type { SubRatingSummary } from "@/lib/schema/review";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

type ReviewRow = Tables<"reviews">;
type ReviewReplyRow = Tables<"review_replies">;
type ReviewInsertWithPhotos = TablesInsert<"reviews"> & { photo_file_ids?: string[] };
type ReviewUpdateWithPhotos = TablesUpdate<"reviews"> & { photo_file_ids?: string[] };

// ─── Review Photo Validation ───

export function uniqueIdsInOrder(ids: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        result.push(id);
    }
    return result;
}

export async function validateReviewPhotoFileIds(
    supabase: SupabaseClient<Database>,
    input: string[] | undefined,
): Promise<string[] | null> {
    if (!input || input.length === 0) return null;

    const photoFileIds = uniqueIdsInOrder(input);
    if (photoFileIds.length > MAX_REVIEW_PHOTOS) {
        throw badRequest(`리뷰 사진은 최대 ${MAX_REVIEW_PHOTOS}개까지 업로드할 수 있습니다.`);
    }

    const { data: files, error } = await supabase
        .from("files")
        .select("id, purpose")
        .in("id", photoFileIds);

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
        if (!fileRow) throw notFound("리뷰 사진을 찾을 수 없습니다.");
        const purpose = (fileRow as unknown as { purpose: string }).purpose;
        if (purpose !== "review_photo") {
            throw badRequest("리뷰 사진 용도로 업로드된 파일만 첨부할 수 있습니다.");
        }
    }

    return photoFileIds;
}

// ─── Review CRUD ───

export async function insertReview(
    supabase: SupabaseClient<Database>,
    payload: ReviewInsertWithPhotos,
): Promise<ReviewRow> {
    const { data, error } = await supabase
        .from("reviews")
        .insert(payload)
        .select("*")
        .single();

    if (error) {
        if (error.code === "23505") {
            const { conflict } = await import("@/server/api/errors");
            throw conflict("이미 리뷰를 작성했습니다.");
        }
        throw internalServerError("리뷰 작성에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data;
}

export async function updateReviewById(
    supabase: SupabaseClient<Database>,
    id: string,
    doctorUserId: string,
    payload: ReviewUpdateWithPhotos,
): Promise<ReviewRow> {
    const { data, error } = await supabase
        .from("reviews")
        .update(payload)
        .eq("id", id)
        .eq("doctor_user_id", doctorUserId)
        .select("*")
        .maybeSingle();

    if (error) {
        throw internalServerError("리뷰 수정에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (!data) throw notFound("리뷰를 찾을 수 없습니다.");
    return data;
}

export async function deleteReviewById(
    supabase: SupabaseClient<Database>,
    id: string,
    doctorUserId: string,
): Promise<{ id: string }> {
    const { data, error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", id)
        .eq("doctor_user_id", doctorUserId)
        .select("id")
        .maybeSingle();

    if (error) {
        throw internalServerError("리뷰 삭제에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (!data) throw notFound("리뷰를 찾을 수 없습니다.");
    return { id: data.id };
}

// ─── Sub-rating Summary ───

export async function getVendorSubRatingSummary(
    supabase: SupabaseClient<Database>,
    vendorId: string,
): Promise<SubRatingSummary> {
    const { data, error } = await supabase.rpc("get_vendor_sub_rating_summary", {
        target_vendor_id: vendorId,
    });

    if (error) {
        throw internalServerError("세부 평점을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
        qualityRatingAvg: row?.quality_avg ? Number(row.quality_avg) : null,
        communicationRatingAvg: row?.communication_avg ? Number(row.communication_avg) : null,
        speedRatingAvg: row?.speed_avg ? Number(row.speed_avg) : null,
    };
}

// ─── Review Replies ───

export async function getReplyByReviewId(
    supabase: SupabaseClient<Database>,
    reviewId: string,
): Promise<ReviewReplyRow | null> {
    const { data, error } = await supabase
        .from("review_replies")
        .select("*")
        .eq("review_id", reviewId)
        .maybeSingle();

    if (error) {
        throw internalServerError("리뷰 답변을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data;
}

export async function getRepliesByReviewIds(
    supabase: SupabaseClient<Database>,
    reviewIds: string[],
): Promise<Map<string, ReviewReplyRow>> {
    const result = new Map<string, ReviewReplyRow>();
    if (reviewIds.length === 0) return result;

    const { data, error } = await supabase
        .from("review_replies")
        .select("*")
        .in("review_id", reviewIds);

    if (error) {
        throw internalServerError("리뷰 답변을 조회할 수 없습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    for (const row of data ?? []) {
        result.set(row.review_id, row);
    }

    return result;
}

export async function insertReply(
    supabase: SupabaseClient<Database>,
    payload: { review_id: string; vendor_user_id: string; content: string },
): Promise<ReviewReplyRow> {
    const { data, error } = await supabase
        .from("review_replies")
        .insert(payload)
        .select("*")
        .single();

    if (error) {
        if (error.code === "23505") {
            const { conflict } = await import("@/server/api/errors");
            throw conflict("이미 답변을 작성했습니다.");
        }
        throw internalServerError("답변 작성에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    return data;
}

export async function updateReplyByReviewId(
    supabase: SupabaseClient<Database>,
    reviewId: string,
    vendorUserId: string,
    content: string,
): Promise<ReviewReplyRow> {
    const { data, error } = await supabase
        .from("review_replies")
        .update({ content })
        .eq("review_id", reviewId)
        .eq("vendor_user_id", vendorUserId)
        .select("*")
        .maybeSingle();

    if (error) {
        throw internalServerError("답변 수정에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (!data) throw notFound("답변을 찾을 수 없습니다.");
    return data;
}

export async function deleteReplyByReviewId(
    supabase: SupabaseClient<Database>,
    reviewId: string,
    vendorUserId: string,
): Promise<{ id: string }> {
    const { data, error } = await supabase
        .from("review_replies")
        .delete()
        .eq("review_id", reviewId)
        .eq("vendor_user_id", vendorUserId)
        .select("id")
        .maybeSingle();

    if (error) {
        throw internalServerError("답변 삭제에 실패했습니다.", {
            message: error.message,
            code: error.code,
        });
    }

    if (!data) throw notFound("답변을 찾을 수 없습니다.");
    return { id: data.id };
}
