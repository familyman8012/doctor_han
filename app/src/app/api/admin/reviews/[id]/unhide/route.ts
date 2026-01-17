import { AdminReviewUnhideBodySchema } from "@/lib/schema/review";
import { zUuid } from "@/lib/schema/common";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";

export const POST = withApi(
    withRole<{ id: string }>(["admin"], async (ctx) => {
        const reviewId = zUuid.parse(ctx.params.id);
        const body = AdminReviewUnhideBodySchema.parse(await ctx.req.json());

        // 리뷰 확인
        const { data: review, error: reviewError } = await ctx.supabase
            .from("reviews")
            .select("id, status")
            .eq("id", reviewId)
            .maybeSingle();

        if (reviewError) {
            throw internalServerError("리뷰를 확인할 수 없습니다.", {
                message: reviewError.message,
                code: reviewError.code,
            });
        }

        if (!review) {
            throw notFound("리뷰를 찾을 수 없습니다.");
        }

        if (review.status !== "hidden") {
            throw badRequest("블라인드 상태가 아닌 리뷰입니다.");
        }

        // 블라인드 해제 (published로 복구)
        const { error: updateError } = await ctx.supabase
            .from("reviews")
            .update({ status: "published" })
            .eq("id", reviewId);

        if (updateError) {
            throw internalServerError("리뷰 블라인드 해제에 실패했습니다.", {
                message: updateError.message,
                code: updateError.code,
            });
        }

        // 감사 로그
        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "review.unhide",
            target_type: "review",
            target_id: reviewId,
            metadata: { reason: body.reason ?? null },
        });

        if (auditResult.error) {
            console.error("[POST /api/admin/reviews/:id/unhide] audit_logs insert failed", auditResult.error);
        }

        return ok({ id: reviewId });
    }),
);
