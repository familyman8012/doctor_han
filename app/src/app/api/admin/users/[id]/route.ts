import { AdminUserDeleteBodySchema } from "@/lib/schema/admin";
import { zUuid } from "@/lib/schema/common";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { safeInsertAuditLog } from "@/server/audit/utils";
import { createSupabaseAdminClient } from "@/server/supabase/admin";

type RouteParams = { id: string };

/**
 * DELETE /api/admin/users/[id]
 * Admin: 유저 완전 삭제 (auth.users 삭제 → profiles CASCADE)
 *
 * 주의:
 * - leads/reviews 등 RESTRICT 걸린 테이블에 참조가 있으면 실패함
 * - 이 경우에는 status 변경(inactive)으로 대체 권장
 * - confirmEmail이 대상 email과 정확히 일치해야 실행됨 (오삭제 방지)
 */
export const DELETE = withApi(
    withRole<RouteParams>(["admin"], async (ctx) => {
        const userId = zUuid.parse(ctx.params.id);
        const json = await ctx.req.json();
        const body = AdminUserDeleteBodySchema.parse(json);

        // 자기 자신은 삭제 불가
        if (userId === ctx.user.id) {
            throw badRequest("본인 계정은 삭제할 수 없습니다.");
        }

        // 대상 유저 조회
        const { data: target, error: fetchError } = await ctx.supabase
            .from("profiles")
            .select("id, role, email, display_name, status")
            .eq("id", userId)
            .maybeSingle();

        if (fetchError) {
            throw internalServerError("유저를 조회할 수 없습니다.");
        }
        if (!target) {
            throw notFound("유저를 찾을 수 없습니다.");
        }

        // 다른 admin 계정 삭제 금지
        if (target.role === "admin") {
            throw badRequest("관리자 계정은 삭제할 수 없습니다.");
        }

        // 이메일 재확인 (오삭제 방지)
        if (target.email?.toLowerCase() !== body.confirmEmail.toLowerCase()) {
            throw badRequest("확인용 이메일이 일치하지 않습니다.");
        }

        // 삭제 전에 감사 로그부터 기록 (삭제 후에는 actor/target FK 조회 불가)
        await safeInsertAuditLog(
            ctx.supabase,
            {
                actor_user_id: ctx.user.id,
                action: "user.delete",
                target_type: "user",
                target_id: userId,
                metadata: {
                    reason: body.reason,
                    targetEmail: target.email,
                    targetDisplayName: target.display_name,
                    targetRole: target.role,
                    targetStatus: target.status,
                },
            },
            "admin.user.delete",
        );

        // auth.users 삭제 → profiles CASCADE
        const admin = createSupabaseAdminClient();
        const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

        if (deleteError) {
            // RESTRICT 제약 걸린 경우 관련 에러 힌트 제공
            throw internalServerError(
                "유저를 삭제할 수 없습니다. 관련 거래 이력(리드/리뷰)이 있으면 '탈퇴 처리'를 사용하세요.",
                { message: deleteError.message },
            );
        }

        return ok(null, "유저가 삭제되었습니다.");
    }),
);
