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
		const query = AdminSupportTicketListQuerySchema.parse({
			status: ctx.req.nextUrl.searchParams.get("status") ?? undefined,
			categoryId: ctx.req.nextUrl.searchParams.get("categoryId") ?? undefined,
			slaStatus: ctx.req.nextUrl.searchParams.get("slaStatus") ?? undefined,
			q: ctx.req.nextUrl.searchParams.get("q")?.trim() || undefined,
			page: ctx.req.nextUrl.searchParams.get("page") ?? undefined,
			pageSize: ctx.req.nextUrl.searchParams.get("pageSize") ?? undefined,
		});

		const result = await getAdminTickets(ctx.supabase, query);

		return ok(result);
	}),
);
