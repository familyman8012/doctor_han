import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { reopenTicket } from "@/server/support/service";

type RouteParams = { id: string };

/**
 * POST /api/support/tickets/[id]/reopen
 * Reopen a resolved ticket
 */
export const POST = withApi(
	withAuth<RouteParams>(async (ctx) => {
		const ticket = await reopenTicket(ctx.supabase, ctx.user.id, ctx.params.id);

		return ok({ ticket }, "티켓이 재오픈되었습니다.");
	}),
);
