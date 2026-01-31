import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { getTicketDetail } from "@/server/support/service";

type RouteParams = { id: string };

/**
 * GET /api/support/tickets/[id]
 * Get user's ticket detail with messages
 */
export const GET = withApi(
	withAuth<RouteParams>(async (ctx) => {
		const result = await getTicketDetail(ctx.supabase, ctx.user.id, ctx.params.id);

		return ok(result);
	}),
);
