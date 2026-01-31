import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getAdminTicketDetail } from "@/server/support/service";

type RouteParams = { id: string };

/**
 * GET /api/admin/support/tickets/[id]
 * Get ticket detail for admin with messages and status history
 */
export const GET = withApi(
	withRole<RouteParams>(["admin"], async (ctx) => {
		const result = await getAdminTicketDetail(ctx.supabase, ctx.params.id);

		return ok(result);
	}),
);
