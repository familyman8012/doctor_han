import { AdminUserStatusPatchBodySchema } from "@/lib/schema/admin";
import { zUuid } from "@/lib/schema/common";
import { badRequest, internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { safeInsertAuditLog } from "@/server/audit/utils";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { mapProfileRow } from "@/server/profile/mapper";

type RouteParams = { id: string };

/**
 * PATCH /api/admin/users/[id]/status
 * Admin: 유저 상태 변경 (active/suspended/banned/inactive)
 */
export const PATCH = withApi(
    withRole<RouteParams>(["admin"], async (ctx) => {
        const userId = zUuid.parse(ctx.params.id);
        const json = await ctx.req.json();
        const body = AdminUserStatusPatchBodySchema.parse(json);

        // 자기 자신은 변경 불가
        if (userId === ctx.user.id) {
            throw badRequest("본인 계정의 상태는 변경할 수 없습니다.");
        }

        // 대상 유저 확인
        const { data: target, error: fetchError } = await ctx.supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

        if (fetchError) {
            throw internalServerError("유저를 조회할 수 없습니다.");
        }
        if (!target) {
            throw notFound("유저를 찾을 수 없습니다.");
        }

        // 다른 admin 계정은 건드리지 못함 (권한 에스컬레이션 방지)
        if (target.role === "admin") {
            throw badRequest("관리자 계정의 상태는 변경할 수 없습니다.");
        }

        const now = new Date().toISOString();
        // service_role로 RLS 우회 업데이트
        const admin = createSupabaseAdminClient();

        const updatePayload: Record<string, unknown> = {
            status: body.status,
            status_reason: "reason" in body ? (body.reason ?? null) : null,
            status_changed_by: ctx.user.id,
            status_changed_at: now,
            suspended_until: body.status === "suspended" ? body.suspendedUntil : null,
        };

        const { data: updated, error: updateError } = await admin
            .from("profiles")
            .update(updatePayload)
            .eq("id", userId)
            .select("*")
            .single();

        if (updateError || !updated) {
            throw internalServerError("유저 상태를 변경할 수 없습니다.", {
                message: updateError?.message,
            });
        }

        // 감사 로그
        await safeInsertAuditLog(
            ctx.supabase,
            {
                actor_user_id: ctx.user.id,
                action: "user.status_change",
                target_type: "user",
                target_id: userId,
                metadata: {
                    from: target.status,
                    to: body.status,
                    reason: "reason" in body ? body.reason : null,
                    suspendedUntil:
                        body.status === "suspended" ? body.suspendedUntil : null,
                    targetEmail: target.email,
                    targetDisplayName: target.display_name,
                },
            },
            "admin.user.status_change",
        );

        return ok(mapProfileRow(updated), "상태가 변경되었습니다.");
    }),
);
