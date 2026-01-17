import type { ReviewReportReason } from "@/lib/schema/review";
import { ReviewReportBodySchema } from "@/lib/schema/review";
import { zUuid } from "@/lib/schema/common";
import { badRequest, conflict, internalServerError, notFound } from "@/server/api/errors";
import { created } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";

// NOTE: review_reports 테이블 타입은 마이그레이션 적용 및 타입 생성 후 자동 반영됩니다.
// pnpm db:reset && pnpm db:gen -- --local 실행 후 @ts-expect-error 제거 필요
type ReviewReportInsert = {
    review_id: string;
    reporter_user_id: string;
    reason: ReviewReportReason;
    detail: string | null;
};

export const POST = withApi(
    withAuth<{ id: string }>(async (ctx) => {
        const reviewId = zUuid.parse(ctx.params.id);
        const body = ReviewReportBodySchema.parse(await ctx.req.json());

        // 리뷰 존재 여부 확인
        const { data: review, error: reviewError } = await ctx.supabase
            .from("reviews")
            .select("id, doctor_user_id")
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

        // 본인 리뷰 신고 불가
        if (review.doctor_user_id === ctx.user.id) {
            throw badRequest("본인이 작성한 리뷰는 신고할 수 없습니다.");
        }

        // 중복 신고 확인 (review_reports 테이블)
        // NOTE: review_reports 테이블 타입은 마이그레이션 후 생성됨 (pnpm db:reset && pnpm db:gen -- --local)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingReport, error: existingError } = await (ctx.supabase as any)
            .from("review_reports")
            .select("id")
            .eq("review_id", reviewId)
            .eq("reporter_user_id", ctx.user.id)
            .maybeSingle();

        if (existingError) {
            throw internalServerError("신고 이력을 확인할 수 없습니다.", {
                message: existingError.message,
                code: existingError.code,
            });
        }

        if (existingReport) {
            throw conflict("이미 신고한 리뷰입니다.");
        }

        // 신고 저장
        const insertData: ReviewReportInsert = {
            review_id: reviewId,
            reporter_user_id: ctx.user.id,
            reason: body.reason,
            detail: body.detail ?? null,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: report, error: insertError } = await (ctx.supabase as any)
            .from("review_reports")
            .insert(insertData)
            .select("id")
            .single();

        if (insertError) {
            throw internalServerError("리뷰 신고에 실패했습니다.", {
                message: insertError.message,
                code: insertError.code,
            });
        }

        const reportId = report?.id as string;

        // 감사 로그
        const auditResult = await ctx.supabase.from("audit_logs").insert({
            actor_user_id: ctx.user.id,
            action: "review.report",
            target_type: "review",
            target_id: reviewId,
            metadata: { reason: body.reason, reportId },
        });

        if (auditResult.error) {
            console.error("[POST /api/reviews/:id/report] audit_logs insert failed", auditResult.error);
        }

        return created({ id: reportId });
    }),
);
