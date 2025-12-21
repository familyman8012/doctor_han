import { MAX_REVIEW_PHOTOS, MyReviewListQuerySchema, ReviewCreateBodySchema } from "@/lib/schema/review";
import { badRequest, conflict, internalServerError, notFound } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedDoctor, withRole } from "@/server/auth/guards";
import { mapReviewRow } from "@/server/review/mapper";
import type { AuthedContext } from "@/server/auth/guards";
import type { Tables, TablesInsert } from "@/lib/database.types";

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

async function validateReviewPhotoFileIds(
    ctx: AuthedContext,
    input: string[] | undefined,
): Promise<{ photoFileIds: string[]; photoFileIdsOrNull: string[] | null }> {
    if (!input || input.length === 0) {
        return { photoFileIds: [], photoFileIdsOrNull: null };
    }

    const photoFileIds = uniqueIdsInOrder(input);
    if (photoFileIds.length > MAX_REVIEW_PHOTOS) {
        throw badRequest(`리뷰 사진은 최대 ${MAX_REVIEW_PHOTOS}개까지 업로드할 수 있습니다.`);
    }

    const { data: files, error } = await ctx.supabase
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
        if (!fileRow) {
            throw notFound("리뷰 사진을 찾을 수 없습니다.");
        }
        const purpose = (fileRow as unknown as { purpose: string }).purpose;
        if (purpose !== "review_photo") {
            throw badRequest("리뷰 사진 용도로 업로드된 파일만 첨부할 수 있습니다.");
        }
    }

    return { photoFileIds, photoFileIdsOrNull: photoFileIds };
}

type ReviewRow = Tables<"reviews">;
type ReviewInsertWithPhotos = TablesInsert<"reviews"> & { photo_file_ids?: string[] };
type ReviewRowWithVendor = ReviewRow & { vendor?: { id: string; name: string } | null };
function mapReviewVendorSummary(input: { id: string; name: string } | null | undefined): { id: string; name: string } | null {
    if (!input) return null;
    return { id: input.id, name: input.name };
}

export const POST = withApi(
    withApprovedDoctor(async (ctx) => {
        const body = ReviewCreateBodySchema.parse(await ctx.req.json());
        const { photoFileIdsOrNull } = await validateReviewPhotoFileIds(ctx, body.photoFileIds);

        const { data: lead, error: leadError } = await ctx.supabase
            .from("leads")
            .select("id, vendor_id, status")
            .eq("id", body.leadId)
            .maybeSingle();

        if (leadError) {
            throw internalServerError("리드를 확인할 수 없습니다.", {
                message: leadError.message,
                code: leadError.code,
            });
        }

        if (!lead) {
            throw notFound("리드를 찾을 수 없습니다.");
        }

        if (lead.vendor_id !== body.vendorId) {
            throw badRequest("leadId와 vendorId가 일치하지 않습니다.");
        }

        if (lead.status === "canceled") {
            throw badRequest("취소된 문의로는 리뷰를 작성할 수 없습니다.");
        }

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

        const insertPayload: ReviewInsertWithPhotos = {
            vendor_id: body.vendorId,
            doctor_user_id: ctx.user.id,
            lead_id: body.leadId,
            rating: body.rating,
            content: body.content,
            amount: body.amount ?? null,
            worked_at: body.workedAt ?? null,
            status: "published",
        };
        if (photoFileIdsOrNull) {
            insertPayload.photo_file_ids = photoFileIdsOrNull;
        }

        const { data: review, error } = await ctx.supabase
            .from("reviews")
            .insert(insertPayload)
            .select("*")
            .single();

        if (error) {
            if (error.code === "23505") {
                throw conflict("이미 리뷰를 작성했습니다.");
            }

            throw internalServerError("리뷰 작성에 실패했습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        return created({ review: mapReviewRow(review) });
    }),
);

export const GET = withApi(
    withRole(["doctor"], async (ctx) => {
        const { searchParams } = new URL(ctx.req.url);
        const query = MyReviewListQuerySchema.parse({
            status: searchParams.get("status") ?? undefined,
            page: searchParams.get("page") ?? undefined,
            pageSize: searchParams.get("pageSize") ?? undefined,
        });

        const from = (query.page - 1) * query.pageSize;
        const to = from + query.pageSize - 1;

        const request = ctx.supabase
            .from("reviews")
            .select("*, vendor:vendors(id, name)", { count: "exact" })
            .eq("doctor_user_id", ctx.user.id)
            .order("created_at", { ascending: false })
            .range(from, to);

        const { data: rows, error, count } =
            query.status === "all" ? await request : await request.eq("status", query.status);

        if (error) {
            throw internalServerError("리뷰를 조회할 수 없습니다.", {
                message: error.message,
                code: error.code,
            });
        }

        const items =
            (rows ?? []).map((row) => {
                const rowWithVendor = row as unknown as ReviewRowWithVendor;
                const vendor = mapReviewVendorSummary(rowWithVendor.vendor);
                return {
                    ...mapReviewRow(rowWithVendor),
                    vendor,
                };
            }) ?? [];

        return ok({
            items,
            page: query.page,
            pageSize: query.pageSize,
            total: count ?? 0,
        });
    }),
);
