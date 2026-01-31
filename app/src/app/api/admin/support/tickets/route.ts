import { AdminSupportTicketListQuerySchema } from "@/lib/schema/support";
import { ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withRole } from "@/server/auth/guards";
import { getAdminTickets } from "@/server/support/service";

/**
 * GET /api/admin/support/tickets
 * Get all support tickets for admin
 */
export const GET = withApi(
	withRole(["admin"], async (ctx) => {
		const searchParams = Object.fromEntries(ctx.req.nextUrl.searchParams);
		const query = AdminSupportTicketListQuerySchema.parse(searchParams);

		const result = await getAdminTickets(ctx.supabase, query);

		return ok(result);
	}),
);
