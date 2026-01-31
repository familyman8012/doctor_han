import {
	SupportTicketCreateBodySchema,
	SupportTicketListQuerySchema,
} from "@/lib/schema/support";
import { created, ok } from "@/server/api/response";
import { withApi } from "@/server/api/with-api";
import { withAuth } from "@/server/auth/guards";
import { createTicket, getMyTickets } from "@/server/support/service";

/**
 * GET /api/support/tickets
 * Get user's support tickets list
 */
export const GET = withApi(
	withAuth(async (ctx) => {
		const searchParams = Object.fromEntries(ctx.req.nextUrl.searchParams);
		const query = SupportTicketListQuerySchema.parse(searchParams);

		const result = await getMyTickets(ctx.supabase, ctx.user.id, query);

		return ok(result);
	}),
);

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
export const POST = withApi(
	withAuth(async (ctx) => {
		const body = SupportTicketCreateBodySchema.parse(await ctx.req.json());

		const ticket = await createTicket(ctx.supabase, ctx.user.id, body);

		return created({ ticket }, "문의가 접수되었습니다.");
	}),
);
