import { AdminTicketStatusChangeBodySchema } from "@/lib/schema/support";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { changeTicketStatus } from "@/server/support/service";

type RouteParams = { id: string };

/**
 * PATCH /api/admin/support/tickets/[id]/status
 * Change ticket status (admin)
 */
export const PATCH = withApi(
	withRole<RouteParams>(["admin"], async (ctx) => {
		const body = AdminTicketStatusChangeBodySchema.parse(await ctx.req.json());

		const ticket = await changeTicketStatus(
			ctx.supabase,
			ctx.user.id,
			ctx.params.id,
			body,
		);

		return ok({ ticket }, "상태가 변경되었습니다.");
	}),
);
