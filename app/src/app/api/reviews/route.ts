import { MyReviewListQuerySchema, ReviewCreateBodySchema } from "@/lib/schema/review";
import { badRequest, internalServerError, notFound, tooManyRequests } from "@/server/api/errors";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withApprovedDoctor, withRole } from "@/server/auth/guards";
import { mapReviewRow } from "@/server/review/mapper";
import { insertReview, validateReviewPhotoFileIds } from "@/server/review/repository";
import { checkRateLimit, incrementRateLimit, logRateLimitExceeded } from "@/server/rate-limit";
import type { Tables } from "@/lib/database.types";

type ReviewRow = Tables<"reviews">;
type ReviewRowWithVendor = ReviewRow & { vendor?: { id: string; name: string } | null };
function mapReviewVendorSummary(input: { id: string; name: string } | null | undefined): { id: string; name: string } | null {
    if (!input) return null;
    return { id: input.id, name: input.name };
}

export const POST = withApi(
    withApprovedDoctor(async (ctx) => {
        const body = ReviewCreateBodySchema.parse(await ctx.req.json());

        // Rate limit 체크
        const rateCheck = await checkRateLimit(ctx.user.id, "review_create");
        if (!rateCheck.allowed) {
            await logRateLimitExceeded(ctx.user.id, "review_create", { vendorId: body.vendorId });
            throw tooManyRequests("리뷰 작성 횟수를 초과했습니다.", {
                resetAt: rateCheck.resetAt?.toISOString(),
                retryAfter: rateCheck.retryAfterSeconds,
            });
        }

        const photoFileIds = await validateReviewPhotoFileIds(ctx.supabase, body.photoFileIds);

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

        if (!lead) throw notFound("리드를 찾을 수 없습니다.");
        if (lead.vendor_id !== body.vendorId) throw badRequest("leadId와 vendorId가 일치하지 않습니다.");
        if (lead.status === "canceled") throw badRequest("취소된 문의로는 리뷰를 작성할 수 없습니다.");

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

        if (!vendor) throw notFound("업체를 찾을 수 없습니다.");

        // productId가 있으면 해당 상품이 실제로 이 vendor 소속인지 검증
        if (body.productId) {
            const { data: product, error: productError } = await ctx.supabase
                .from("products")
                .select("id, vendor_id")
                .eq("id", body.productId)
                .maybeSingle();

            if (productError) {
                throw internalServerError("상품을 확인할 수 없습니다.", {
                    message: productError.message,
                    code: productError.code,
                });
            }

            if (!product) throw badRequest("존재하지 않는 상품입니다.");
            if (product.vendor_id !== body.vendorId) {
                throw badRequest("상품이 해당 업체에 속하지 않습니다.");
            }
        }

        const insertPayload: Parameters<typeof insertReview>[1] = {
            vendor_id: body.vendorId,
            doctor_user_id: ctx.user.id,
            lead_id: body.leadId,
            rating: body.rating,
            quality_rating: body.qualityRating ?? null,
            communication_rating: body.communicationRating ?? null,
            speed_rating: body.speedRating ?? null,
            content: body.content,
            amount: body.amount ?? null,
            worked_at: body.workedAt ?? null,
            status: "published",
        };
        if (body.productId) {
            (insertPayload as Record<string, unknown>).product_id = body.productId;
        }
        if (photoFileIds) {
            insertPayload.photo_file_ids = photoFileIds;
        }

        const review = await insertReview(ctx.supabase, insertPayload);

        // 성공 시 rate limit 카운트 증가
        await incrementRateLimit(ctx.user.id, "review_create");

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
