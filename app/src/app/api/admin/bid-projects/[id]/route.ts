import { zUuid } from "@/lib/schema/common";
import { internalServerError, notFound } from "@/server/api/errors";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";

type RouteParams = { id: string };

/**
 * DELETE /api/admin/bid-projects/[id]
 * Admin: delete a bid project
 */
export const DELETE = withApi(
	withRole<RouteParams>(["admin"], async (ctx) => {
		const projectId = zUuid.parse(ctx.params.id);

		// Check exists
		const { data: project, error: fetchError } = await ctx.supabase
			.from("bid_projects")
			.select("id, status")
			.eq("id", projectId)
			.maybeSingle();

		if (fetchError) {
			throw internalServerError("프로젝트를 조회할 수 없습니다.");
		}
		if (!project) {
			throw notFound("프로젝트를 찾을 수 없습니다.");
		}

		// Delete responses first (FK), then project
		await ctx.supabase
			.from("bid_responses")
			.delete()
			.eq("project_id", projectId);

		const { error: deleteError } = await ctx.supabase
			.from("bid_projects")
			.delete()
			.eq("id", projectId);

		if (deleteError) {
			throw internalServerError("프로젝트를 삭제할 수 없습니다.", {
				message: deleteError.message,
			});
		}

		// Audit log
		await ctx.supabase.from("audit_logs").insert({
			actor_user_id: ctx.user.id,
			action: "bid_project.delete",
			target_type: "bid_project",
			target_id: projectId,
			metadata: { status: project.status },
		});

		return ok(null, "프로젝트가 삭제되었습니다.");
	}),
);
